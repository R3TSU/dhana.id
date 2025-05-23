// src/app/admin/courses/new/page.tsx
import { CourseForm } from '@/components/admin/CourseForm';
import { createCourse } from '@/actions/admin/course.actions';
import Link from 'next/link';

export default function NewCoursePage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/courses" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
          &larr; Back to Courses
        </Link>
        <h1 className="text-3xl font-bold mt-2">Add New Course</h1>
      </div>
      <CourseForm 
        action={createCourse} 
        buttonText="Create Course"
        pendingButtonText="Creating Course..."
      />
    </div>
  );
}
