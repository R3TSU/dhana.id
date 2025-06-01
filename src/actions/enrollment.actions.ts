"use server";

import { db } from "@/db/drizzle";
import {
  course_enrollments,
  courses,
  users,
  lessons,
  userLessonAccessOverrides,
} from "@/db/schema";
import { getLessonDetailsBySlug } from "./admin/lesson.actions";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type CourseEnrollment = typeof course_enrollments.$inferSelect;

// Helper function to get internal user ID from Clerk User ID
async function getInternalUserIdFromClerkId(
  clerkUserId: string,
): Promise<number | null> {
  if (!clerkUserId) return null;
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.clerk_user_id, clerkUserId),
      columns: { id: true },
    });
    return user ? user.id : null;
  } catch (error) {
    console.error("Error fetching internal user ID:", error);
    return null;
  }
}

/**
 * Checks if the current user is enrolled in a specific course.
 */
export async function checkEnrollment(courseId: number): Promise<{
  isEnrolled: boolean;
  enrollmentDetails: CourseEnrollment | null;
  error: string | null;
}> {
  const { userId } = await auth();

  if (!userId) {
    return {
      isEnrolled: false,
      enrollmentDetails: null,
      error: "User not authenticated.",
    };
  }

  const internalUserId = await getInternalUserIdFromClerkId(userId);

  if (!internalUserId) {
    return {
      isEnrolled: false,
      enrollmentDetails: null,
      error: "User record not found.",
    };
  }

  try {
    const enrollment = await db.query.course_enrollments.findFirst({
      where: and(
        eq(course_enrollments.courseId, courseId),
        eq(course_enrollments.userId, internalUserId), // Use internal integer userId
      ),
    });

    if (enrollment) {
      return { isEnrolled: true, enrollmentDetails: enrollment, error: null };
    } else {
      return { isEnrolled: false, enrollmentDetails: null, error: null };
    }
  } catch (err) {
    console.error("Error checking course enrollment:", err);
    return {
      isEnrolled: false,
      enrollmentDetails: null,
      error: "Failed to check enrollment.",
    };
  }
}

/**
 * Enrolls the current user in a course if they aren't already.
 * For now, all enrollments are free.
 */
export async function enrollInCourse(
  courseId: number,
  providedInternalUserId?: number,
): Promise<{
  enrollment: CourseEnrollment | null;
  error: string | null;
  success: boolean;
  message?: string;
}> {
  let internalUserIdToUse: number | null;

  if (providedInternalUserId) {
    internalUserIdToUse = providedInternalUserId;
  } else {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return {
        enrollment: null,
        error: "User not authenticated.",
        success: false,
      };
    }
    internalUserIdToUse = await getInternalUserIdFromClerkId(clerkUserId);
  }

  if (!internalUserIdToUse) {
    return {
      enrollment: null,
      error: "User record not found.",
      success: false,
    };
  }

  try {
    const courseExists = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
      columns: { id: true },
    });

    if (!courseExists) {
      return { enrollment: null, error: "Course not found.", success: false };
    }

    const existingEnrollment = await db.query.course_enrollments.findFirst({
      where: and(
        eq(course_enrollments.courseId, courseId),
        eq(course_enrollments.userId, internalUserIdToUse), // Use internal integer userId
      ),
    });

    if (existingEnrollment) {
      return {
        enrollment: existingEnrollment,
        error: null,
        success: true,
        message: "User already enrolled in this course.",
      };
    }

    const newEnrollmentResult = await db
      .insert(course_enrollments)
      .values({
        userId: internalUserIdToUse, // Use internal integer userId
        courseId: courseId,
        enrollmentDate: new Date(),
        status: "enrolled",
        pricePaid: 0,
      })
      .returning();

    if (newEnrollmentResult.length === 0) {
      return {
        enrollment: null,
        error: "Failed to create enrollment record.",
        success: false,
      };
    }

    // Optional: revalidatePath if needed for UI updates
    // e.g., revalidatePath(`/course/${courseSlug}`);

    return {
      enrollment: newEnrollmentResult[0],
      error: null,
      success: true,
      message: "Successfully enrolled in course.",
    };
  } catch (err) {
    console.error("Error enrolling in course:", err);
    if (
      err instanceof Error &&
      "constraint" in err &&
      typeof err.constraint === "string" &&
      err.constraint.includes("course_enrollments_user_course_idx")
    ) {
      return {
        enrollment: null,
        error: "User is already enrolled (concurrent request?).",
        success: false,
      };
    }
    return {
      enrollment: null,
      error: "Failed to enroll in course.",
      success: false,
    };
  }
}

/**
 * Fetches the enrollment date for the current user for a specific course.
 */
export async function getUserEnrollmentForCourse(courseId: number): Promise<{
  enrollmentDate: Date | null;
  error: string | null;
}> {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return { enrollmentDate: null, error: "User not authenticated." };
  }

  const internalUserId = await getInternalUserIdFromClerkId(clerkUserId);

  if (!internalUserId) {
    // This case implies the user is authenticated with Clerk but doesn't have an internal user record.
    // Middleware should ideally redirect them to /complete-profile.
    // For content dripping, if they don't have an internal record, they effectively aren't enrolled in our system's terms.
    return { enrollmentDate: null, error: "User profile not found." };
  }

  try {
    const enrollment = await db.query.course_enrollments.findFirst({
      where: and(
        eq(course_enrollments.courseId, courseId),
        eq(course_enrollments.userId, internalUserId),
      ),
      columns: { enrollmentDate: true },
    });

    if (enrollment && enrollment.enrollmentDate) {
      return { enrollmentDate: enrollment.enrollmentDate, error: null };
    } else {
      // Not enrolled or enrollmentDate is missing (though schema has defaultNow())
      return {
        enrollmentDate: null,
        error: "User not enrolled in this course.",
      };
    }
  } catch (err) {
    console.error("Error fetching user enrollment for course:", err);
    return {
      enrollmentDate: null,
      error: "Failed to fetch enrollment details.",
    };
  }
}

/**
 * Grants special access to a lesson for a user, typically after signing up from a lesson preview.
 * This involves enrolling them in the course (if not already) and adding an override record.
 */
export async function grantLessonAccessOnSignup(
  lessonSlug: string,
  internalUserId: number,
): Promise<{
  success: boolean;
  error: string | null;
  message?: string;
}> {
  if (!lessonSlug) {
    return { success: false, error: "Lesson slug is required." };
  }
  if (!internalUserId) {
    return { success: false, error: "User ID is required." };
  }

  try {
    // 1. Get lesson details to find courseId and lessonId
    const lessonDetailsResult = await getLessonDetailsBySlug(lessonSlug);
    if (lessonDetailsResult.error || !lessonDetailsResult.data) {
      return {
        success: false,
        error: lessonDetailsResult.error || "Lesson not found.",
      };
    }
    const { id: lessonId, course_id: courseId } = lessonDetailsResult.data;

    if (!courseId) {
      return { success: false, error: "Course ID not found for this lesson." };
    }

    // 2. Ensure user is enrolled in the course
    const enrollmentResult = await enrollInCourse(courseId, internalUserId);
    if (!enrollmentResult.success) {
      return {
        success: false,
        error: enrollmentResult.error || "Failed to enroll in course.",
      };
    }

    // 3. Check if an override already exists
    const existingOverride = await db.query.userLessonAccessOverrides.findFirst(
      {
        where: and(
          eq(userLessonAccessOverrides.userId, internalUserId),
          eq(userLessonAccessOverrides.lessonId, lessonId),
        ),
      },
    );

    if (existingOverride) {
      return {
        success: true,
        message: "Lesson access override already exists.",
        error: null,
      };
    }

    // 4. Insert the lesson access override
    await db.insert(userLessonAccessOverrides).values({
      userId: internalUserId,
      lessonId: lessonId,
      courseId: courseId, // Storing courseId for potential denormalization/query convenience
    });

    // Optionally revalidate paths if needed for immediate UI updates elsewhere
    // revalidatePath(`/lesson/${lessonSlug}`);
    // revalidatePath(`/course/${lessonDetailsResult.data.courseSlug}`);

    return {
      success: true,
      message: "Lesson access granted successfully.",
      error: null,
    };
  } catch (err) {
    console.error("Error granting lesson access on signup:", err);
    return {
      success: false,
      error: "An unexpected error occurred while granting lesson access.",
    };
  }
}

/**
 * Checks if the current user has an explicit access override for a specific lesson.
 */
export async function hasLessonAccessOverride(
  lessonId: number,
): Promise<boolean> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    // Not authenticated, so no override possible
    return false;
  }

  const internalUserId = await getInternalUserIdFromClerkId(clerkUserId);
  if (!internalUserId) {
    // No internal user record, so no override possible
    return false;
  }

  if (!lessonId || typeof lessonId !== "number") {
    // Invalid lessonId passed
    console.warn(
      `hasLessonAccessOverride called with invalid lessonId: ${lessonId}`,
    );
    return false;
  }

  try {
    const override = await db.query.userLessonAccessOverrides.findFirst({
      where: and(
        eq(userLessonAccessOverrides.userId, internalUserId),
        eq(userLessonAccessOverrides.lessonId, lessonId),
      ),
      columns: { id: true }, // Only need to check for existence
    });
    return !!override;
  } catch (error) {
    console.error(
      `Error checking lesson access override for lessonId ${lessonId}, userId ${internalUserId}:`,
      error,
    );
    return false; // Fail safe: if error, assume no override
  }
}
