"use server";

import { db } from "@/db/drizzle";
import { users, courses, course_enrollments } from "@/db/schema";
import { eq, desc, count, asc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

export type AdminEnrollmentView = {
  enrollmentId: number;
  userId: number;
  userName: string | null;
  courseId: number;
  courseName: string;
  enrollmentDate: Date;
};

export async function getEnrollmentsForAdminView({
  courseIdFilter,
  page = 1,
  pageSize = 20,
}: {
  courseIdFilter?: number;
  page?: number;
  pageSize?: number;
}): Promise<{
  data: AdminEnrollmentView[];
  totalCount: number;
  error: string | null;
}> {
  try {
    // Base query for data
    let queryBuilder = db
      .select({
        enrollmentId: course_enrollments.id,
        userId: users.id,
        userName: users.fullName,
        courseId: courses.id,
        courseName: courses.title,
        enrollmentDate: course_enrollments.enrollmentDate,
      })
      .from(course_enrollments)
      .innerJoin(users, eq(course_enrollments.userId, users.id))
      .innerJoin(courses, eq(course_enrollments.courseId, courses.id));

    // Base query for count
    let countQueryBuilder = db
      .select({ value: count() })
      .from(course_enrollments);

    // Apply filter if present
    if (courseIdFilter) {
      // @ts-ignore Drizzle's dynamic query builder type can be tricky for TS here
      queryBuilder = queryBuilder.where(
        eq(course_enrollments.courseId, courseIdFilter),
      );
      // @ts-ignore
      countQueryBuilder = countQueryBuilder.where(
        eq(course_enrollments.courseId, courseIdFilter),
      );
    }

    // Finalize data query with ordering and pagination
    const data = await queryBuilder
      .orderBy(desc(course_enrollments.enrollmentDate))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // Finalize and execute count query
    const totalResult = await countQueryBuilder;
    const totalCount = totalResult[0]?.value || 0;

    return { data, totalCount, error: null };
  } catch (error) {
    console.error("Error fetching enrollments for admin view:", error);
    return { data: [], totalCount: 0, error: "Failed to fetch enrollments." };
  }
}

export async function getCoursesForAdminFilter(): Promise<{
  data: { id: number; title: string }[];
  error: string | null;
}> {
  try {
    const courseList = await db
      .select({
        id: courses.id,
        title: courses.title,
      })
      .from(courses)
      .orderBy(asc(courses.title));
    return { data: courseList, error: null };
  } catch (error) {
    console.error("Error fetching courses for admin filter:", error);
    return { data: [], error: "Failed to fetch courses." };
  }
}

// Get all users for dropdown selection
export async function getAllUsersForAdmin(): Promise<{
  data: { id: number; fullName: string | null; email: string | null }[];
  error: string | null;
}> {
  try {
    const userList = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
      })
      .from(users)
      .orderBy(asc(users.fullName));
    return { data: userList, error: null };
  } catch (error) {
    console.error("Error fetching users for admin:", error);
    return { data: [], error: "Failed to fetch users." };
  }
}

// Get all courses for dropdown selection
export async function getAllCoursesForAdmin(): Promise<{
  data: { id: number; title: string }[];
  error: string | null;
}> {
  try {
    const courseList = await db
      .select({
        id: courses.id,
        title: courses.title,
      })
      .from(courses)
      .where(eq(courses.is_active, true))
      .orderBy(asc(courses.title));
    return { data: courseList, error: null };
  } catch (error) {
    console.error("Error fetching courses for admin:", error);
    return { data: [], error: "Failed to fetch courses." };
  }
}

// Zod schema for manual enrollment form
const manualEnrollmentSchema = z.object({
  userId: z.string().min(1, "User is required").transform(Number),
  courseId: z.string().min(1, "Course is required").transform(Number),
});

// Create enrollment by admin (bypasses auto-enrollment restrictions)
export async function createEnrollmentByAdmin(
  prevState: any,
  formData: FormData,
) {
  const validatedFields = manualEnrollmentSchema.safeParse({
    userId: formData.get("userId"),
    courseId: formData.get("courseId"),
  });

  if (!validatedFields.success) {
    return {
      message: "Validation Error",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { userId, courseId } = validatedFields.data;

  try {
    // Check if enrollment already exists
    const existingEnrollment = await db.query.course_enrollments.findFirst({
      where: and(
        eq(course_enrollments.userId, userId),
        eq(course_enrollments.courseId, courseId),
      ),
    });

    if (existingEnrollment) {
      return {
        message: "Error",
        errors: { _form: ["User is already enrolled in this course."] },
      };
    }

    // Create the enrollment
    await db.insert(course_enrollments).values({
      userId: userId,
      courseId: courseId,
      enrollmentDate: new Date(),
      status: "enrolled",
      pricePaid: 0,
    });

    revalidatePath("/admin/enrollments");
  } catch (error) {
    console.error("Error creating manual enrollment:", error);
    return {
      message: "Error",
      errors: { _form: ["Failed to create enrollment. Please try again."] },
    };
  }

  redirect("/admin/enrollments");
}

// Update enrollment date by admin
export async function updateEnrollmentDateByAdmin(
  enrollmentId: number,
  newDate: Date,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!enrollmentId || !(newDate instanceof Date)) {
      return { success: false, error: "Invalid input." };
    }

    const updated = await db
      .update(course_enrollments)
      .set({ enrollmentDate: newDate })
      .where(eq(course_enrollments.id, enrollmentId))
      .returning({ id: course_enrollments.id });

    if (!updated || updated.length === 0) {
      return { success: false, error: "Enrollment not found." };
    }

    revalidatePath("/admin/enrollments");
    return { success: true };
  } catch (error) {
    console.error("Error updating enrollment date:", error);
    return { success: false, error: "Failed to update enrollment date." };
  }
}

// Delete enrollment by admin
export async function deleteEnrollmentByAdmin(
  enrollmentId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!enrollmentId) {
      return { success: false, error: "Invalid enrollment id." };
    }

    const deleted = await db
      .delete(course_enrollments)
      .where(eq(course_enrollments.id, enrollmentId))
      .returning({ id: course_enrollments.id });

    if (!deleted || deleted.length === 0) {
      return { success: false, error: "Enrollment not found." };
    }

    revalidatePath("/admin/enrollments");
    return { success: true };
  } catch (error) {
    console.error("Error deleting enrollment:", error);
    return { success: false, error: "Failed to delete enrollment." };
  }
}
