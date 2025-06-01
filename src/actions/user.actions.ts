/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use server";

import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { grantLessonAccessOnSignup } from "./enrollment.actions";
import { normalizeMobileNumber } from "@/lib/utils"; // Import the new function

// Helper to get internal user by Clerk ID, can be used by other actions too
export const getInternalUserByClerkId = unstable_cache(
  async (clerkId: string) => {
    if (!clerkId) return null;
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.clerk_user_id, clerkId),
      });
      return user || null;
    } catch (error) {
      console.error("Error fetching internal user by Clerk ID:", error);
      return null;
    }
  },
  ["user-by-clerk-id"],
  {
    revalidate: 60, // Cache for 60 seconds
    tags: [`user-by-clerk-id`], // Static tag for the entire function
  },
);

// Action to get the current logged-in user's internal profile
export async function getCurrentInternalUser() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return null; // Or throw new Error("User not authenticated");
  }
  return getInternalUserByClerkId(clerkUserId);
}

const completeProfileFormSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: "Full name must be at least 2 characters." }),
  whatsappNumber: z
    .string()
    .min(1, { message: "WhatsApp number is required." }),
  address: z.string().optional(),
  birthDay: z.coerce.number().int().min(1).max(31).optional().nullable(),
  birthMonth: z.coerce.number().int().min(1).max(12).optional().nullable(),
  birthYear: z.coerce
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear())
    .optional()
    .nullable(),
  fromLessonSlug: z.string().optional(),
});

export async function completeUserProfile(
  prevState: any, // Can be more specific if you have a defined state type
  formData: FormData,
): Promise<{
  success: boolean;
  error?: string;
  fieldErrors?: Partial<
    Record<
      | "fullName"
      | "whatsappNumber"
      | "address"
      | "birthDay"
      | "birthMonth"
      | "birthYear",
      string[]
    >
  >;
}> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { success: false, error: "User not authenticated." };
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return { success: false, error: "Clerk user data not found." };
  }

  const rawFormData = {
    fullName: formData.get("fullName") as string,
    whatsappNumber: formData.get("whatsappNumber") as string | undefined,
    address: formData.get("address") as string | undefined,
    birthDay: formData.get("birthDay")
      ? Number(formData.get("birthDay"))
      : undefined,
    birthMonth: formData.get("birthMonth")
      ? Number(formData.get("birthMonth"))
      : undefined,
    birthYear: formData.get("birthYear")
      ? Number(formData.get("birthYear"))
      : undefined,
    fromLessonSlug: formData.get("fromLessonSlug") as string | null,
  };

  const validation = completeProfileFormSchema.safeParse(rawFormData);

  if (!validation.success) {
    return {
      success: false,
      error: "Invalid input.",
      fieldErrors: validation.error.flatten().fieldErrors as Partial<
        Record<"fullName" | "whatsappNumber", string[]>
      >,
    };
  }

  let {
    fullName,
    whatsappNumber,
    address,
    birthDay,
    birthMonth,
    birthYear,
    fromLessonSlug,
  } = validation.data;

  if (whatsappNumber) {
    whatsappNumber = normalizeMobileNumber(whatsappNumber);
  }
  // Else block removed as whatsappNumber is guaranteed by schema to be non-empty

  // Convert empty strings from form to null for optional number fields if not provided
  const finalBirthDay =
    birthDay === undefined || birthDay === null || isNaN(birthDay)
      ? null
      : birthDay;
  const finalBirthMonth =
    birthMonth === undefined || birthMonth === null || isNaN(birthMonth)
      ? null
      : birthMonth;
  const finalBirthYear =
    birthYear === undefined || birthYear === null || isNaN(birthYear)
      ? null
      : birthYear;
  const finalAddress = address === undefined || address === "" ? null : address;

  try {
    const existingUser = await getInternalUserByClerkId(clerkUserId);

    const userData = {
      clerk_user_id: clerkUserId,
      email:
        clerkUser.emailAddresses.find(
          (e) => e.id === clerkUser.primaryEmailAddressId,
        )?.emailAddress || "",
      fullName: fullName,
      whatsappNumber: whatsappNumber, // Corrected to match schema property name
      avatar_url: clerkUser.imageUrl,
      address: finalAddress,
      birthDay: finalBirthDay,
      birthMonth: finalBirthMonth,
      birthYear: finalBirthYear,
      // role is defaulted by schema
    };

    if (!userData.email) {
      return {
        success: false,
        error: "Primary email not found for Clerk user.",
      };
    }

    if (existingUser) {
      // Update existing user
      await db
        .update(users)
        .set({
          ...userData,
          // updatedAt is handled by schema's $onUpdate
        })
        .where(eq(users.id, existingUser.id));

      // Invalidate the user cache
      revalidateTag(`user-by-clerk-id`);
    } else {
      // Create new user
      await db.insert(users).values(userData);

      // Invalidate the user cache
      revalidateTag(`user-by-clerk-id`);
    }

    revalidatePath("/profile"); // Revalidate profile page if you have one
    revalidatePath("/home"); // Revalidate home or other relevant pages

    // Grant lesson access if fromLessonSlug is present
    if (fromLessonSlug) {
      const userForLessonGrant =
        existingUser || (await getInternalUserByClerkId(clerkUserId));
      if (userForLessonGrant) {
        try {
          console.log(
            `Attempting to grant lesson access for slug: ${fromLessonSlug}, user ID: ${userForLessonGrant.id} during profile completion.`,
          );
          const grantAccessResult = await grantLessonAccessOnSignup(
            fromLessonSlug,
            userForLessonGrant.id,
          );
          if (grantAccessResult.success) {
            console.log(
              `Successfully granted lesson access for slug: ${fromLessonSlug}, user ID: ${userForLessonGrant.id}. Message: ${grantAccessResult.message || ""}`,
            );
            // The client-side form should clear sessionStorage for 'fromLessonSlug' upon success.
            // If redirecting to the lesson, it would be: redirect(`/lesson/${fromLessonSlug}`);
            // For now, keeping redirect to /home as per original structure.
          } else {
            console.error(
              `Failed to grant lesson access for slug: ${fromLessonSlug}, user ID: ${userForLessonGrant.id}. Error: ${grantAccessResult.error}`,
            );
            // Log error but don't fail the profile completion for this secondary action.
          }
        } catch (grantError) {
          console.error(
            `Exception during grantLessonAccessOnSignup for slug: ${fromLessonSlug}, user ID: ${userForLessonGrant.id}:`,
            grantError,
          );
        }
      } else {
        console.error(
          `Could not find/create internal user (ID: ${clerkUserId}) to grant lesson access for slug: ${fromLessonSlug}.`,
        );
      }
    }
  } catch (error) {
    console.error("Error completing user profile:", error);
    // Check for unique constraint violation on email (if another user already took it, though Clerk should prevent this at its level)
    if (
      error instanceof Error &&
      "constraint" in error &&
      typeof error.constraint === "string" &&
      error.constraint.includes("users_email_unique")
    ) {
      return {
        success: false,
        error: "This email address is already in use by another account.",
      };
    }
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }

  // On success, redirect. This redirect will be caught by the form handler in the client component.
  // For server components that directly call this, the redirect will work as expected.
  redirect("/home");
  // The return type still expects a value, but redirect throws an error that Next.js handles.
  // To satisfy TypeScript if redirect doesn't throw in all test environments:
  // return { success: true };
}

// Schema for updating profile (only fullName for now)
const updateUserProfileSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  whatsappNumber: z.string().min(1, "WhatsApp number is required"),
  address: z.string().min(1, "Address is required"), // Now required
  birthDay: z
    .number()
    .int()
    .min(1, "Day must be between 1 and 31")
    .max(31, "Day must be between 1 and 31"), // Now required
  birthMonth: z
    .number()
    .int()
    .min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12"), // Now required
  birthYear: z
    .number()
    .int()
    .min(1900, "Year must be 1900 or later")
    .max(new Date().getFullYear(), `Year cannot be in the future`)
    .optional()
    .nullable(),
});

export async function updateUserProfile(
  prevState: any,
  formData: FormData,
): Promise<{
  success: boolean;
  message?: string; // General message for success/error
  fieldErrors?: Partial<
    Record<
      | "fullName"
      | "whatsappNumber"
      | "address"
      | "birthDay"
      | "birthMonth"
      | "birthYear",
      string[]
    >
  >;
}> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { success: false, message: "User not authenticated." };
  }

  const rawFormData = {
    fullName: formData.get("fullName") as string,
    whatsappNumber: formData.get("whatsappNumber") as string | undefined,
    address: formData.get("address") as string | undefined,
    birthDay: formData.get("birthDay")
      ? Number(formData.get("birthDay"))
      : undefined,
    birthMonth: formData.get("birthMonth")
      ? Number(formData.get("birthMonth"))
      : undefined,
    birthYear: formData.get("birthYear")
      ? Number(formData.get("birthYear"))
      : undefined,
  };

  const validation = updateUserProfileSchema.safeParse(rawFormData);

  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input.",
      fieldErrors: validation.error.flatten().fieldErrors as Partial<
        Record<
          | "fullName"
          | "whatsappNumber"
          | "address"
          | "birthDay"
          | "birthMonth"
          | "birthYear",
          string[]
        >
      >,
    };
  }

  let { fullName, whatsappNumber, address, birthDay, birthMonth, birthYear } =
    validation.data;

  if (whatsappNumber) {
    whatsappNumber = normalizeMobileNumber(whatsappNumber);
  }
  // Else block removed as whatsappNumber is guaranteed by schema to be non-empty

  // Convert empty strings from form to null for  // address, birthDay, birthMonth are now required by Zod, so they will be valid strings/numbers.
  // birthYear is still optional and needs to be handled for nullability.
  const finalBirthYear =
    birthYear === undefined || birthYear === null || isNaN(birthYear)
      ? null
      : birthYear;

  try {
    const internalUser = await getInternalUserByClerkId(clerkUserId);

    if (!internalUser) {
      return { success: false, message: "User profile not found." };
    }

    await db
      .update(users)
      .set({
        fullName: fullName,
        whatsappNumber: whatsappNumber, // Already normalized
        address: address, // Directly from validatedData, now required
        birthDay: birthDay, // Directly from validatedData, now required
        birthMonth: birthMonth, // Directly from validatedData, now required
        birthYear: finalBirthYear, // Still optional, needs null conversion
        updated_at: new Date(),
      })
      .where(eq(users.id, internalUser.id));

    // Invalidate the user cache
    revalidateTag(`user-by-clerk-id`);

    revalidatePath("/profile");

    // fromLessonSlug logic removed from here

    return { success: true, message: "Profile updated successfully!" };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
}
