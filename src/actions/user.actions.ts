/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use server";

import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// Helper to get internal user by Clerk ID, can be used by other actions too
export async function getInternalUserByClerkId(clerkId: string) {
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
}

// Action to get the current logged-in user's internal profile
export async function getCurrentInternalUser() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return null; // Or throw new Error("User not authenticated");
  }
  return getInternalUserByClerkId(clerkUserId);
}

const completeProfileFormSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  // Add other fields here if needed in the future, e.g., username
});

export async function completeUserProfile(
  prevState: any, // Can be more specific if you have a defined state type
  formData: FormData
): Promise<{
  success: boolean;
  error?: string;
  fieldErrors?: Partial<Record<"fullName", string[]>>;
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
  };

  const validation = completeProfileFormSchema.safeParse(rawFormData);

  if (!validation.success) {
    return {
      success: false,
      error: "Invalid input.",
      fieldErrors: validation.error.flatten().fieldErrors as Partial<Record<"fullName", string[]>>,
    };
  }

  const { fullName } = validation.data;

  try {
    const existingUser = await getInternalUserByClerkId(clerkUserId);

    const userData = {
      clerk_user_id: clerkUserId,
      email: clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress || '',
      fullName: fullName,
      avatar_url: clerkUser.imageUrl,
      // role is defaulted by schema
    };

    if (!userData.email) {
        return { success: false, error: "Primary email not found for Clerk user." };
    }

    if (existingUser) {
      // Update existing user
      await db.update(users)
        .set({
          ...userData,
          // updatedAt is handled by schema's $onUpdate
        })
        .where(eq(users.id, existingUser.id));
    } else {
      // Create new user
      await db.insert(users).values(userData);
    }

    revalidatePath("/profile"); // Revalidate profile page if you have one
    revalidatePath("/home"); // Revalidate home or other relevant pages
  } catch (error) {
    console.error("Error completing user profile:", error);
    // Check for unique constraint violation on email (if another user already took it, though Clerk should prevent this at its level)
    if (error instanceof Error && 'constraint' in error && typeof error.constraint === 'string' && error.constraint.includes('users_email_unique')) {
      return { success: false, error: "This email address is already in use by another account." };
    }
    return { success: false, error: "An unexpected error occurred. Please try again." };
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
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
});

export async function updateUserProfile(
  prevState: any, 
  formData: FormData
): Promise<{
  success: boolean;
  message?: string; // General message for success/error
  fieldErrors?: Partial<Record<"fullName", string[]>>;
}> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { success: false, message: "User not authenticated." };
  }

  const rawFormData = {
    fullName: formData.get("fullName") as string,
  };

  const validation = updateUserProfileSchema.safeParse(rawFormData);

  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input.",
      fieldErrors: validation.error.flatten().fieldErrors as Partial<Record<"fullName", string[]>>,
    };
  }

  const { fullName } = validation.data;

  try {
    const internalUser = await getInternalUserByClerkId(clerkUserId);

    if (!internalUser) {
      return { success: false, message: "User profile not found." };
    }

    await db.update(users)
      .set({
        fullName: fullName,
        // Ensure updatedAt is handled by schema's $onUpdate or manually set here if needed
      })
      .where(eq(users.id, internalUser.id));

    revalidatePath("/profile");
    return { success: true, message: "Profile updated successfully!" };

  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, message: "An unexpected error occurred. Please try again." };
  }
}
