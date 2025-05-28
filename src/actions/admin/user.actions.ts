"use server";

import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, asc, desc, eq, like, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { normalizeMobileNumber } from "@/lib/utils";

// Ensure the current user is an admin
async function ensureAdmin() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const adminUser = await db.query.users.findFirst({
    where: and(
      eq(users.clerk_user_id, userId),
      eq(users.role, "admin")
    ),
  });

  if (!adminUser) {
    throw new Error("Not authorized - Admin access required");
  }

  return adminUser;
}

// Get all users with pagination and search
export async function getUsers({
  page = 1,
  limit = 10,
  sortBy = "created_at",
  sortOrder = "desc",
  search = "",
  role = "",
}: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  role?: string;
}) {
  await ensureAdmin();

  try {
    const offset = (page - 1) * limit;
    
    // Create the appropriate order by clause based on the requested column
    let orderByClause;
    
    // Handle each possible sort column explicitly to avoid type errors
    switch (sortBy) {
      case 'id':
        orderByClause = sortOrder === "asc" ? asc(users.id) : desc(users.id);
        break;
      case 'fullName':
        orderByClause = sortOrder === "asc" ? asc(users.fullName) : desc(users.fullName);
        break;
      case 'email':
        orderByClause = sortOrder === "asc" ? asc(users.email) : desc(users.email);
        break;
      case 'role':
        orderByClause = sortOrder === "asc" ? asc(users.role) : desc(users.role);
        break;
      case 'updated_at':
        orderByClause = sortOrder === "asc" ? asc(users.updated_at) : desc(users.updated_at);
        break;
      case 'created_at':
      default:
        orderByClause = sortOrder === "asc" ? asc(users.created_at) : desc(users.created_at);
        break;
    }
    
    // Handle case with no filters
    if (!search && !role) {
      const totalCount = await db.$count(users);
      const totalPages = Math.ceil(totalCount / limit);
      
      const usersList = await db.query.users.findMany({
        limit,
        offset,
        orderBy: orderByClause,
      });
      
      return {
        users: usersList,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    }
    
    // Handle case with filters
    let conditions = [];
    
    if (search) {
      conditions.push(
        or(
          like(users.fullName, `%${search}%`),
          like(users.email, `%${search}%`),
          like(users.whatsappNumber, `%${search}%`),
          like(users.address, `%${search}%`)
        )
      );
    }
    
    if (role) {
      conditions.push(eq(users.role, role));
    }
    
    const whereClause = and(...conditions);
    const totalCount = await db.$count(users, whereClause);
    const totalPages = Math.ceil(totalCount / limit);
    
    const usersList = await db.query.users.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: orderByClause,
    });
    
    return {
      users: usersList,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      users: [],
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalCount: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
      error: "Failed to fetch users",
    };
  }
}

// Get a single user by ID
export async function getUserById(userId: number) {
  await ensureAdmin();

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return { error: "User not found" };
    }

    return { user };
  } catch (error) {
    console.error("Error fetching user:", error);
    return { error: "Failed to fetch user" };
  }
}

// Schema for admin updating user profile
const adminUpdateUserSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  whatsappNumber: z.string().min(1, { message: "WhatsApp number is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  address: z.string().optional(),
  birthDay: z.coerce.number().int().min(1).max(31).optional().nullable(),
  birthMonth: z.coerce.number().int().min(1).max(12).optional().nullable(),
  birthYear: z.coerce.number().int().min(1900).max(new Date().getFullYear()).optional().nullable(),
  role: z.enum(["user", "admin"]),
});

// Update a user (admin function)
export async function updateUser(
  userId: number,
  formData: FormData
) {
  await ensureAdmin();

  const rawFormData = {
    fullName: formData.get("fullName") as string,
    email: formData.get("email") as string,
    whatsappNumber: formData.get("whatsappNumber") as string,
    address: formData.get("address") as string || undefined,
    birthDay: formData.get("birthDay") ? Number(formData.get("birthDay")) : undefined,
    birthMonth: formData.get("birthMonth") ? Number(formData.get("birthMonth")) : undefined,
    birthYear: formData.get("birthYear") ? Number(formData.get("birthYear")) : undefined,
    role: formData.get("role") as "user" | "admin",
  };

  const validation = adminUpdateUserSchema.safeParse(rawFormData);

  if (!validation.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  let { fullName, email, whatsappNumber, address, birthDay, birthMonth, birthYear, role } = validation.data;

  if (whatsappNumber) {
    whatsappNumber = normalizeMobileNumber(whatsappNumber);
  }

  // Convert empty strings to null for optional fields
  const finalAddress = address === undefined || address === "" ? null : address;
  const finalBirthDay = birthDay === undefined || birthDay === null || isNaN(birthDay) ? null : birthDay;
  const finalBirthMonth = birthMonth === undefined || birthMonth === null || isNaN(birthMonth) ? null : birthMonth;
  const finalBirthYear = birthYear === undefined || birthYear === null || isNaN(birthYear) ? null : birthYear;

  try {
    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!existingUser) {
      return { success: false, error: "User not found" };
    }

    // Update user
    await db.update(users)
      .set({
        fullName,
        email,
        whatsappNumber,
        address: finalAddress,
        birthDay: finalBirthDay,
        birthMonth: finalBirthMonth,
        birthYear: finalBirthYear,
        role,
        updated_at: new Date(),
      })
      .where(eq(users.id, userId));

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);

    return { success: true, message: "User updated successfully" };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: "Failed to update user" };
  }
}

// Delete a user (admin function)
export async function deleteUser(userId: number) {
  await ensureAdmin();

  try {
    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!existingUser) {
      return { success: false, error: "User not found" };
    }

    // Delete user
    await db.delete(users).where(eq(users.id, userId));

    revalidatePath("/admin/users");

    return { success: true, message: "User deleted successfully" };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Failed to delete user" };
  }
}
