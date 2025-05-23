import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { courses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { deleteFileFromR2 } from '@/lib/r2';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id); // Access id directly from params
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { message: 'Invalid course ID' },
        { status: 400 }
      );
    }
    
    // First, get the course to check if it exists and to get the thumbnail URL
    const courseToDelete = await db.select({
      id: courses.id,
      thumbnail_url: courses.thumbnail_url
    })
    .from(courses)
    .where(eq(courses.id, id))
    .limit(1);
    
    if (courseToDelete.length === 0) {
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Delete thumbnail from R2 if it exists
    if (courseToDelete[0].thumbnail_url) {
      try {
        // Extract the key from the URL (assuming the URL format is consistent)
        const thumbnailUrl = courseToDelete[0].thumbnail_url;
        const key = thumbnailUrl.substring(thumbnailUrl.lastIndexOf('/') + 1);
        await deleteFileFromR2(key);
      } catch (error) {
        console.error('Error deleting thumbnail from R2:', error);
        // Continue with course deletion even if thumbnail deletion fails
      }
    }
    
    // Delete the course from the database
    await db.delete(courses).where(eq(courses.id, id));
    
    // Revalidate the courses page
    revalidatePath('/admin/courses');
    
    return NextResponse.json(
      { message: 'Course deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { message: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
