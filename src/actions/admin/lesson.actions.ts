// src/actions/admin/lesson.actions.ts
"use server";

import { db } from "@/db/drizzle"; // Assuming db connection is in @/db
import { lessons, courses } from "@/db/schema";
import { eq, asc, desc, getTableColumns } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { generateSlug } from "@/lib/utils";
import { uploadFileToR2, deleteFileFromR2 } from "@/lib/r2"; // Added R2 imports

// Zod schema for form validation (input from user, slug is generated)
const lessonFormSchema = z.object({
  thumbnailFile: z.instanceof(File).optional(),
  removeThumbnail: z.string().optional(), // From FormData, 'true' or undefined
  title: z.string().min(3, "Title must be at least 3 characters"),
  course_id: z.coerce
    .number()
    .int()
    .positive("Course ID must be a positive number"),
  description: z.string().optional(),
  workbook: z.string().optional(), // Added workbook field for reflection questions
  thumbnail_url: z
    .string()
    .url("Invalid URL format")
    .optional()
    .or(z.literal("")), // Allow empty string or valid URL
  video_url: z
    .string()
    .url("Video URL must be a valid URL")
    .min(5, "Video URL is required"),
  day_number: z.coerce.number().int().min(1, "Day number must be at least 1"),
});

// Zod schema for database interaction (includes generated slug)
const lessonDbSchema = lessonFormSchema.extend({
  slug: z
    .string()
    .min(1, "Slug cannot be empty")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase and hyphenated",
    ),
});

export async function getAllLessons(courseId?: number) {
  try {
    let query = db
      .select({
        id: lessons.id,
        title: lessons.title,
        slug: lessons.slug,
        courseId: lessons.course_id, // Corrected: schema uses course_id
        courseTitle: courses.title,
        thumbnail_url: lessons.thumbnail_url,
        day_number: lessons.day_number,
        createdAt: lessons.created_at, // Corrected: schema uses created_at
        updatedAt: lessons.updated_at, // Corrected: schema uses updated_at
      })
      .from(lessons)
      .leftJoin(courses, eq(lessons.course_id, courses.id))
      .orderBy(desc(lessons.day_number));

    if (courseId && !isNaN(courseId) && courseId > 0) {
      const data = await query.where(eq(lessons.course_id, courseId)); // Corrected: schema uses course_id
      return { data, error: null };
    }
    const data = await query;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return { data: [], error: "Failed to fetch lessons." };
  }
}

export async function getLessonById(id: number) {
  if (isNaN(id) || id <= 0) {
    return { data: null, error: "Invalid lesson ID." };
  }
  try {
    const data = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, id))
      .limit(1);
    if (data.length === 0) {
      return { data: null, error: "Lesson not found." };
    }
    return { data: data[0], error: null };
  } catch (error) {
    console.error("Error fetching lesson by ID:", error);
    return { data: null, error: "Failed to fetch lesson." };
  }
}

export async function getLessonDetailsBySlug(lessonSlug: string): Promise<{
  data:
    | (typeof lessons.$inferSelect & {
        courseSlug: string | null;
        courseTitle: string | null;
      })
    | null; // Added courseSlug and courseTitle
  error: string | null;
}> {
  if (
    !lessonSlug ||
    typeof lessonSlug !== "string" ||
    lessonSlug.trim() === ""
  ) {
    return { data: null, error: "Invalid lesson slug provided." };
  }
  try {
    const result = await db
      .select({
        ...getTableColumns(lessons), // Select all fields from lessons table
        courseSlug: courses.slug, // Select slug from courses table
        courseTitle: courses.title, // Select title from courses table
      })
      .from(lessons)
      .leftJoin(courses, eq(lessons.course_id, courses.id)) // Join with courses table
      .where(eq(lessons.slug, lessonSlug))
      .limit(1);

    if (result.length === 0) {
      return { data: null, error: "Lesson not found." };
    }
    // The result[0] will have all lesson columns and the courseSlug directly
    return { data: result[0], error: null };
  } catch (error) {
    console.error("Error fetching lesson by slug:", error);
    return { data: null, error: "Failed to fetch lesson details." };
  }
}

export async function createLesson(prevState: any, formData: FormData) {
  const thumbnailFile = formData.get("thumbnailFile") as File | null;
  const title = formData.get("title") as string;
  const generatedSlug = generateSlug(title);

  const validatedFormFields = lessonFormSchema.safeParse({
    title: title,
    course_id: formData.get("course_id"),
    description: formData.get("description"),
    workbook: formData.get("workbook"), // Added workbook field
    // thumbnail_url: formData.get('thumbnail_url'),
    video_url: formData.get("video_url"),
    day_number: formData.get("day_number"),
  });

  if (!validatedFormFields.success) {
    return {
      message: "Validation Error",
      errors: validatedFormFields.error.flatten().fieldErrors,
    };
  }

  // Now combine with generated slug and validate for DB
  const validatedDbFields = lessonDbSchema.safeParse({
    ...validatedFormFields.data,
    slug: generatedSlug,
  });

  if (!validatedDbFields.success) {
    // This should ideally not happen if generateSlug is robust and form schema is a subset
    return {
      message: "Internal Validation Error",
      errors: validatedDbFields.error.flatten().fieldErrors,
    };
  }

  try {
    const courseExists = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.id, validatedDbFields.data.course_id))
      .limit(1);
    if (courseExists.length === 0) {
      return {
        message: "Validation Error",
        errors: { course_id: ["Selected course does not exist."] },
      };
    }

    let finalData = { ...validatedDbFields.data };

    if (thumbnailFile && thumbnailFile.size > 0) {
      const uploadResult = await uploadFileToR2(
        thumbnailFile,
        "lessons/thumbnails",
      );
      if ("error" in uploadResult) {
        return {
          message: "Upload Error",
          errors: { thumbnailFile: [uploadResult.error] },
        };
      }
      finalData.thumbnail_url = uploadResult.url;
    } else {
      // Ensure thumbnail_url is explicitly set if no file, respecting optionality or empty string
      finalData.thumbnail_url = validatedDbFields.data.thumbnail_url || "";
    }

    // Remove helper fields not in DB schema before insert
    const { thumbnailFile: _tf, removeThumbnail: _rt, ...dbData } = finalData;

    await db.insert(lessons).values(dbData);
  } catch (error: any) {
    console.error("Error creating lesson:", error);
    if (error.message?.includes("unique constraint")) {
      if (
        error.message?.includes("lessons_slug_idx") ||
        error.message?.includes("lessons_slug_key")
      ) {
        return {
          message: "Database Error",
          errors: { slug: ["Slug already exists."] },
        };
      }
      if (
        error.message?.includes("lessons_title_idx") ||
        error.message?.includes("lessons_title_key")
      ) {
        return {
          message: "Database Error",
          errors: { title: ["Title already exists."] },
        };
      }
    }
    return {
      message: "Database Error",
      errors: { _form: ["Failed to create lesson. Please try again."] },
    };
  }

  revalidatePath(`/admin/courses/${validatedDbFields.data.course_id}/lessons`);
  revalidatePath(`/admin/courses/${validatedDbFields.data.course_id}/edit`); // Use validatedDbFields
  redirect(`/admin/courses/${validatedDbFields.data.course_id}/lessons`);
}

export async function updateLesson(
  id: number,
  prevState: any,
  formData: FormData,
) {
  const thumbnailFile = formData.get("thumbnailFile") as File | null;
  const removeThumbnail = formData.get("removeThumbnail") === "true";
  if (isNaN(id) || id <= 0) {
    return { message: "Error", errors: { _form: ["Invalid lesson ID."] } };
  }

  // Get the existing lesson to preserve its slug
  const existingLesson = await getLessonById(id);
  if (existingLesson.error || !existingLesson.data) {
    return { message: "Error", errors: { _form: ["Lesson not found."] } };
  }

  const title = formData.get("title") as string;
  // Use the existing slug instead of generating a new one
  const slug = existingLesson.data.slug;

  const validatedFormFields = lessonFormSchema.safeParse({
    title: title,
    course_id: formData.get("course_id"),
    description: formData.get("description"),
    workbook: formData.get("workbook"), // Added workbook field
    video_url: formData.get("video_url"),
    day_number: formData.get("day_number"),
  });

  if (!validatedFormFields.success) {
    return {
      message: "Validation Error",
      errors: validatedFormFields.error.flatten().fieldErrors,
    };
  }

  // Now combine with existing slug and validate for DB
  const validatedDbFields = lessonDbSchema.safeParse({
    ...validatedFormFields.data,
    slug: slug,
  });

  if (!validatedDbFields.success) {
    return {
      message: "Internal Validation Error",
      errors: validatedDbFields.error.flatten().fieldErrors,
    };
  }

  try {
    const courseExists = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.id, validatedDbFields.data.course_id))
      .limit(1);
    if (courseExists.length === 0) {
      return {
        message: "Validation Error",
        errors: { course_id: ["Selected course does not exist."] },
      };
    }

    let dataToUpdate = { ...validatedDbFields.data };
    const currentThumbnailUrl = existingLesson.data.thumbnail_url;

    if (removeThumbnail) {
      if (currentThumbnailUrl) {
        const deleteResult = await deleteFileFromR2(currentThumbnailUrl);
        if ("error" in deleteResult) {
          // Log error but proceed to nullify DB record, or return error based on severity
          console.warn(
            `Failed to delete old thumbnail from R2: ${deleteResult.error}`,
          );
        }
      }
      dataToUpdate.thumbnail_url = ""; // Set to empty string or null based on schema preference
    } else if (thumbnailFile && thumbnailFile.size > 0) {
      if (currentThumbnailUrl) {
        const deleteResult = await deleteFileFromR2(currentThumbnailUrl);
        if ("error" in deleteResult) {
          console.warn(
            `Failed to delete old thumbnail from R2 during replacement: ${deleteResult.error}`,
          );
        }
      }
      const uploadResult = await uploadFileToR2(
        thumbnailFile,
        "lessons/thumbnails",
      );
      if ("error" in uploadResult) {
        return {
          message: "Upload Error",
          errors: { thumbnailFile: [uploadResult.error] },
        };
      }
      dataToUpdate.thumbnail_url = uploadResult.url;
    } else {
      // If no new file and not removing, keep existing or validated form value
      dataToUpdate.thumbnail_url =
        validatedDbFields.data.thumbnail_url || currentThumbnailUrl || "";
    }

    // Remove helper fields not in DB schema before update
    const {
      thumbnailFile: _tf,
      removeThumbnail: _rtf,
      ...dbDataForUpdate
    } = dataToUpdate;

    await db
      .update(lessons)
      .set({
        ...dbDataForUpdate,
        updated_at: new Date(),
      })
      .where(eq(lessons.id, id));
  } catch (error: any) {
    console.error("Error updating lesson:", error);
    if (error.message?.includes("unique constraint")) {
      if (
        error.message?.includes("lessons_slug_idx") ||
        error.message?.includes("lessons_slug_key")
      ) {
        return {
          message: "Database Error",
          errors: { slug: ["Slug already exists for another lesson."] },
        };
      }
      if (
        error.message?.includes("lessons_title_idx") ||
        error.message?.includes("lessons_title_key")
      ) {
        return {
          message: "Database Error",
          errors: { title: ["Title already exists for another lesson."] },
        };
      }
    }
    return {
      message: "Database Error",
      errors: { _form: ["Failed to update lesson. Please try again."] },
    };
  }

  revalidatePath(`/admin/courses/${validatedDbFields.data.course_id}/lessons`);
  revalidatePath(`/admin/lessons/${id}/edit`);
  revalidatePath(`/admin/courses/${validatedDbFields.data.course_id}/edit`); // Use validatedDbFields
  redirect(`/admin/courses/${validatedDbFields.data.course_id}/lessons`);
}

export async function deleteLesson(id: number, course_id?: number) {
  if (isNaN(id) || id <= 0) {
    return { success: false, message: "Invalid lesson ID." };
  }
  try {
    const lessonData = await db
      .select({
        thumbnail_url: lessons.thumbnail_url,
        course_id: lessons.course_id,
      })
      .from(lessons)
      .where(eq(lessons.id, id))
      .limit(1);

    if (lessonData.length === 0) {
      return { success: false, message: "Lesson not found." };
    }

    const { thumbnail_url, course_id: lessonCourseId } = lessonData[0];
    const finalCourseId = course_id || lessonCourseId;

    if (thumbnail_url) {
      const deleteResult = await deleteFileFromR2(thumbnail_url);
      if ("error" in deleteResult) {
        // Log error but proceed with DB deletion
        console.warn(
          `Failed to delete thumbnail from R2 for lesson ${id}: ${deleteResult.error}`,
        );
      }
    }

    await db.delete(lessons).where(eq(lessons.id, id));

    if (finalCourseId) {
      revalidatePath(`/admin/courses/${finalCourseId}/lessons`);
      revalidatePath(`/admin/courses/${finalCourseId}/edit`);
    } else {
      // Fallback if course_id couldn't be determined, though less ideal
      revalidatePath("/admin/lessons");
      revalidatePath("/admin/courses");
    }

    return { success: true, message: "Lesson deleted successfully." };
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return { success: false, message: "Failed to delete lesson." };
  }
}

export async function getCoursesForSelection() {
  try {
    const data = await db
      .select({ id: courses.id, title: courses.title })
      .from(courses)
      .orderBy(asc(courses.title));
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching courses for selection:", error);
    return { data: [], error: "Failed to fetch courses for selection." };
  }
}
