// src/app/admin/courses/[id]/edit/page.tsx
import { CourseForm } from '@/components/admin/CourseForm';
import { getCourseById, updateCourse } from '@/actions/admin/course.actions';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EditCoursePage({ params }: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params

  if (isNaN(parseInt(courseId)) || parseInt(courseId) <= 0) {
    return <p className="text-red-500">Error: Invalid course ID</p>;
  }

  const { data: course, error } = await getCourseById(parseInt(courseId));

  if (error || !course) {
    // Handle error display, perhaps a more user-friendly message or redirect
    console.error(error);
    notFound(); // Or return <p>Course not found or an error occurred.</p>;
  }

  // Bind the courseId to the updateCourse server action
  const updateCourseWithId = updateCourse.bind(null, course.id);

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/courses" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
          &larr; Back to Courses
        </Link>
        <h1 className="text-3xl font-bold mt-2">Edit Course: {course.title}</h1>
      </div>
      <CourseForm
        action={updateCourseWithId}
        initialData={course}
        buttonText="Update Course"
        pendingButtonText="Updating Course..."
      />
    </div>
  );
}
