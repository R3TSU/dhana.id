import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { lessons } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { courses } from '@/db/schema';
import { generateSlug } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

// Schema for lesson creation validation
const lessonFormSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }).max(255),
  course_id: z.coerce.number().int().positive({ message: 'Valid course is required' }),
  description: z.string().optional(),
  video_url: z.string().url({ message: 'Valid video URL is required' }),
  thumbnail_url: z.string().url({ message: 'Valid thumbnail URL is required' }).nullable().optional(),
  day_number: z.coerce.number().int().min(1, 'Day number must be at least 1'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate form data
    const validatedFormFields = lessonFormSchema.safeParse(body);
    
    if (!validatedFormFields.success) {
      return NextResponse.json(
        { 
          message: 'Validation Error', 
          errors: validatedFormFields.error.flatten().fieldErrors 
        }, 
        { status: 400 }
      );
    }
    
    // Generate slug from title
    const title = validatedFormFields.data.title;
    const generatedSlug = generateSlug(title);
    
    // Create DB schema with validated fields + generated slug
    const lessonDbSchema = lessonFormSchema.extend({
      slug: z.string(),
    });
    
    const validatedDbFields = lessonDbSchema.safeParse({
      ...validatedFormFields.data,
      slug: generatedSlug,
    });
    
    if (!validatedDbFields.success) {
      return NextResponse.json(
        { 
          message: 'Validation Error', 
          errors: validatedDbFields.error.flatten().fieldErrors 
        }, 
        { status: 400 }
      );
    }
    
    // Check if course exists
    const courseExists = await db.select({id: courses.id})
      .from(courses)
      .where(eq(courses.id, validatedDbFields.data.course_id))
      .limit(1);
      
    if (courseExists.length === 0) {
      return NextResponse.json(
        { 
          message: 'Validation Error', 
          errors: { course_id: ['Selected course does not exist.'] } 
        }, 
        { status: 400 }
      );
    }
    
    // Insert lesson into database
    await db.insert(lessons).values(validatedDbFields.data);
    
    // Get the inserted lesson (since Drizzle with Neon doesn't return insertId)
    const insertedLesson = await db.select()
      .from(lessons)
      .where(eq(lessons.slug, validatedDbFields.data.slug))
      .limit(1);
    
    // Revalidate the lessons page and course-specific lessons page
    revalidatePath('/admin/lessons');
    revalidatePath(`/admin/courses/${validatedDbFields.data.course_id}/lessons`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Lesson created successfully',
      data: insertedLesson[0] || validatedDbFields.data
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating lesson:', error);
    
    // Handle unique constraint violations
    if (error.message?.includes('unique constraint')) {
      if (error.message?.includes('lessons_slug_idx') || error.message?.includes('lessons_slug_key')) {
        return NextResponse.json({ 
          message: 'Database Error', 
          errors: { slug: ['Slug already exists.'] } 
        }, { status: 400 });
      }
      if (error.message?.includes('lessons_title_idx') || error.message?.includes('lessons_title_key')) {
        return NextResponse.json({ 
          message: 'Database Error', 
          errors: { title: ['Title already exists.'] } 
        }, { status: 400 });
      }
    }
    
    return NextResponse.json({ 
      message: 'Database Error', 
      errors: { _form: ['Failed to create lesson. Please try again.'] } 
    }, { status: 500 });
  }
}
