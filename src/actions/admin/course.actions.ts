// src/actions/admin/course.actions.ts
'use server'

import { db } from '@/db/drizzle';
import { uploadFileToR2, deleteFileFromR2 } from '@/lib/r2';
import { courses } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { generateSlug } from '@/lib/utils';

// Zod schema for validating incoming form data (slug is auto-generated)
const courseFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  thumbnail_url: z.string().url('Invalid URL format').nullable().optional(),
  is_active: z.preprocess(
    // Convert checkbox input value to boolean
    (val) => val === 'on' || val === true || val === 'true',
    z.boolean().default(true)
  ),
  start_date: z.string().optional().nullable().transform(val => val && val !== '' ? new Date(val) : null),
});

// Zod schema for the full course object (including auto-generated slug)
const courseDbSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z.string().min(1, 'Slug cannot be empty after generation').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Generated slug is invalid'),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  thumbnail_url: z.string().url('Invalid URL format').nullable().optional(),
  is_active: z.boolean().default(true),
  start_date: z.date().nullable().optional()
});



export async function getAllCourses() {
  try {
    const data = await db.select().from(courses).orderBy(desc(courses.created_at));
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching courses:', error);
    return { data: [], error: 'Failed to fetch courses.' };
  }
}

export async function getCourseById(id: number) {
  if (isNaN(id) || id <= 0) {
    return { data: null, error: 'Invalid course ID.' };
  }
  try {
    const data = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
    if (data.length === 0) {
      return { data: null, error: 'Course not found.' };
    }
    return { data: data[0], error: null };
  } catch (error) {
    console.error('Error fetching course by ID:', error);
    return { data: null, error: 'Failed to fetch course.' };
  }
}

export async function createCourse(prevState: any, formData: FormData) {
  const thumbnailFile = formData.get('thumbnailFile') as File | null;
  let uploadedThumbnailUrl: string | null = null;

  if (thumbnailFile && thumbnailFile.size > 0) {
    const uploadResult = await uploadFileToR2(thumbnailFile, 'courses/thumbnails');
    if ('error' in uploadResult) {
      return {
        message: 'Upload Error',
        errors: { _form: [uploadResult.error] },
      };
    }
    uploadedThumbnailUrl = uploadResult.url;
  }

  const title = formData.get('title') as string;
  const generatedSlug = generateSlug(title);

  const validatedFormFields = courseFormSchema.safeParse({
    title: title,
    subtitle: formData.get('subtitle'),
    description: formData.get('description'),
    thumbnail_url: uploadedThumbnailUrl, // Corrected: Use the R2 URL or null
    is_active: formData.get('is_active'),
    start_date: formData.get('start_date'),
  });

  if (!validatedFormFields.success) {
    return {
      message: 'Validation Error',
      errors: validatedFormFields.error.flatten().fieldErrors,
    };
  }

  // Combine validated form data with the generated slug
  const courseDataForDb = {
    ...validatedFormFields.data,
    slug: generatedSlug,
  };

  // Optionally, validate the complete object before DB operation (internal check)
  const validatedDbFields = courseDbSchema.safeParse(courseDataForDb);
  if (!validatedDbFields.success) {
    // This would indicate an issue with slug generation or internal logic
    console.error('Internal validation error for DB data (createCourse):', validatedDbFields.error.flatten().fieldErrors);
    return {
      message: 'Internal Server Error',
      errors: { _form: ['Failed to prepare data for database. Invalid generated slug.'] },
    };
  }

  try {
    await db.insert(courses).values(validatedDbFields.data); // Use validatedDbFields
  } catch (error: any) {
    console.error('Error creating course:', error);
    if (error.message?.includes('unique constraint')) {
        if (error.message?.includes('courses_slug_idx') || error.message?.includes('courses_slug_key')) {
            return { message: 'Database Error', errors: { slug: ['Slug already exists.'] } };
        }
        if (error.message?.includes('courses_title_idx') || error.message?.includes('courses_title_key')) {
             return { message: 'Database Error', errors: { title: ['Title already exists.'] } };
        }
    }
    return { message: 'Database Error', errors: { _form: ['Failed to create course. Please try again.'] } };
  }

  revalidatePath('/admin/courses');
  redirect('/admin/courses');
}

export async function updateCourse(id: number, prevState: any, formData: FormData) {
  const thumbnailFile = formData.get('thumbnailFile') as File | null;
  const removeThumbnail = formData.get('removeThumbnail') === 'true';

  if (isNaN(id) || id <= 0) {
    return { message: 'Error', errors: { _form: ['Invalid course ID.'] } };
  }

  // Fetch existing course to get current thumbnail_url
  const existingCourseResult = await getCourseById(id);
  if (existingCourseResult.error || !existingCourseResult.data) {
    return { message: 'Error', errors: { _form: ['Course not found or failed to fetch existing data.'] } };
  }

  const existingCourse = existingCourseResult.data;
  let newThumbnailUrl = existingCourse.thumbnail_url;

  // Handle thumbnail removal if requested
  if (removeThumbnail) {
    if (existingCourse.thumbnail_url) {
      try {
        await deleteFileFromR2(existingCourse.thumbnail_url);
      } catch (deleteError) {
        console.error('Error deleting thumbnail from R2:', deleteError);
        // Continue with update even if thumbnail deletion fails
      }
    }
    newThumbnailUrl = null;
  } 
  // Handle thumbnail upload if provided
  else if (thumbnailFile && thumbnailFile.size > 0) {
    const uploadResult = await uploadFileToR2(thumbnailFile, 'courses/thumbnails');
    if ('error' in uploadResult) {
      return {
        message: 'Upload Error',
        errors: { _form: [uploadResult.error] },
      };
    }
    
    // Delete old thumbnail if it exists and a new one is uploaded
    if (existingCourse.thumbnail_url) {
      try {
        await deleteFileFromR2(existingCourse.thumbnail_url);
      } catch (deleteError) {
        console.error('Error deleting old thumbnail from R2:', deleteError);
        // Continue with update even if old thumbnail deletion fails
      }
    }
    
    newThumbnailUrl = uploadResult.url;
  }

  const title = formData.get('title') as string;
  // Use the existing slug instead of generating a new one
  const slug = existingCourseResult.data.slug;

  const validatedFormFields = courseFormSchema.safeParse({
    title: title,
    subtitle: formData.get('subtitle'),
    description: formData.get('description'),
    thumbnail_url: newThumbnailUrl, // Corrected: Use the derived R2 URL, existing URL, or null
    is_active: formData.get('is_active'),
    start_date: formData.get('start_date'),
  });

  if (!validatedFormFields.success) {
    return {
      message: 'Validation Error',
      errors: validatedFormFields.error.flatten().fieldErrors,
    };
  }

  // Combine validated form data with the existing slug
  const courseDataForDb = {
    ...validatedFormFields.data,
    slug: slug,
  };

  // Optionally, validate the complete object before DB operation (internal check)
  const validatedDbFields = courseDbSchema.safeParse(courseDataForDb);
  if (!validatedDbFields.success) {
    // This would indicate an issue with slug generation or internal logic
    console.error('Internal validation error for DB data (updateCourse):', validatedDbFields.error.flatten().fieldErrors);
    return {
      message: 'Internal Server Error',
      errors: { _form: ['Failed to prepare data for database. Invalid generated slug.'] },
    };
  }

  try {
    const existingCourse = await db.select({ id: courses.id }).from(courses).where(eq(courses.id, id)).limit(1);
    if (existingCourse.length === 0) {
        return { message: 'Error', errors: { _form: ['Course not found.'] } };
    }

    await db.update(courses).set({
      ...validatedDbFields.data, // Use validatedDbFields
      updated_at: new Date(),
    }).where(eq(courses.id, id));

  } catch (error: any) {
    console.error('Error updating course:', error);
    if (error.message?.includes('unique constraint')) {
        if (error.message?.includes('courses_slug_idx') || error.message?.includes('courses_slug_key')) {
            return { message: 'Database Error', errors: { slug: ['Slug already exists for another course.'] } };
        }
        if (error.message?.includes('courses_title_idx') || error.message?.includes('courses_title_key')) {
             return { message: 'Database Error', errors: { title: ['Title already exists for another course.'] } };
        }
    }
    return { message: 'Database Error', errors: { _form: ['Failed to update course. Please try again.'] } };
  }

  revalidatePath('/admin/courses');
  revalidatePath(`/admin/courses/${id}/edit`);
  redirect('/admin/courses');
}

export async function deleteCourse(id: number) {
  if (isNaN(id) || id <= 0) {
    return { success: false, message: 'Invalid course ID.' };
  }

  try {
    // First, get the course to delete its thumbnail from R2 if it exists
    const [course] = await db.select({ thumbnail_url: courses.thumbnail_url })
      .from(courses)
      .where(eq(courses.id, id));

    // Delete the thumbnail from R2 if it exists
    if (course?.thumbnail_url) {
      try {
        await deleteFileFromR2(course.thumbnail_url);
      } catch (error) {
        console.error('Error deleting thumbnail from R2:', error);
        // Continue with course deletion even if thumbnail deletion fails
      }
    }

    // Then delete the course from the database
    await db.delete(courses).where(eq(courses.id, id));
    
    // Revalidate the courses page
    revalidatePath('/admin/courses');
    
    return { success: true, message: 'Course deleted successfully.' };
  } catch (error) {
    console.error('Error deleting course:', error);
    return { success: false, message: 'Failed to delete course. Please try again.' };
  }
}

// Type for public-facing course data
import { lessons } from '@/db/schema'; // Added import for lessons table
import { and } from 'drizzle-orm'; // Added for potential future complex queries

export type PublicCourse = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  slug: string;
  isActive: boolean;
  startDate: Date | null;
};

export async function getPublicCourses(): Promise<{ data: PublicCourse[]; error: string | null }> {
  try {
    const courseData = await db
      .select({
        id: courses.id,
        title: courses.title,
        subtitle: courses.subtitle,
        description: courses.description,
        thumbnailUrl: courses.thumbnail_url, // Alias to match CourseCard prop
        slug: courses.slug,
        isActive: courses.is_active,
        startDate: courses.start_date,
      })
      .from(courses)
      .orderBy((courses.created_at)) // Show newest first
      .where(eq(courses.is_active, true)); // Only return active courses

    const processedData: PublicCourse[] = courseData.map(course => ({
      ...course,
      id: String(course.id), // Ensure id is a string
      description: course.description ?? null,
      thumbnailUrl: course.thumbnailUrl ?? null,
      isActive: course.isActive,
      startDate: course.startDate,
    }));

    return { data: processedData, error: null };
  } catch (error) {
    console.error('Error fetching public courses:', error);
    return { data: [], error: 'Failed to fetch courses. Please try again later.' };
  }
}

export type PublicLessonForCoursePage = {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  dayNumber: number;
  // videoUrl: string; // Not immediately needed for VideoCard, but available
};

export type CourseWithLessons = {
  id: number;
  title: string;
  description: string | null;
  slug: string;
};

export async function getCourseWithLessonsBySlug(courseSlug: string): Promise<{
  course: CourseWithLessons | null;
  lessons: PublicLessonForCoursePage[];
  error: string | null;
}> {
  try {
    const courseData = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        slug: courses.slug,
      })
      .from(courses)
      .where(eq(courses.slug, courseSlug))
      .limit(1);

    if (courseData.length === 0) {
      return { course: null, lessons: [], error: 'Course not found.' };
    }

    const course = courseData[0];

    const lessonsData = await db
      .select({
        id: lessons.id,
        title: lessons.title,
        slug: lessons.slug,
        thumbnailUrl: lessons.thumbnail_url,
        dayNumber: lessons.day_number,
        // videoUrl: lessons.video_url, // Available if needed later
      })
      .from(lessons)
      .where(eq(lessons.course_id, course.id))
      .orderBy(lessons.day_number); // Order lessons by day number

    const processedLessons: PublicLessonForCoursePage[] = lessonsData.map(lesson => ({
      ...lesson,
      id: String(lesson.id), // Ensure id is a string for keys/props
      thumbnailUrl: lesson.thumbnailUrl ?? null,
    }));

    return { course, lessons: processedLessons, error: null };
  } catch (error) {
    console.error(`Error fetching course with lessons by slug (${courseSlug}):`, error);
    return { course: null, lessons: [], error: 'Failed to fetch course details. Please try again later.' };
  }
}

export async function getCoursesForSelection() {
  try {
    const data = await db.select({
      id: courses.id,
      title: courses.title
    })
    .from(courses)
    .orderBy(courses.title);
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching courses for selection:', error);
    return { data: null, error: 'Failed to fetch courses' };
  }
}
