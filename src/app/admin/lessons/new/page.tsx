'use client';

import { LessonForm } from '@/components/admin/LessonForm';
import { getCoursesForSelection } from '@/actions/admin/course.actions';
import { createLesson } from '@/actions/admin/lesson.actions';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface Course {
  id: number;
  title: string;
}

export default function NewLessonPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get('courseId');

  // Use React Query to fetch courses
  const { data: coursesData, isLoading, error } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error: fetchError } = await getCoursesForSelection();
      if (fetchError) {
        throw new Error(fetchError);
      }
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // If we have a courseId in the URL, pre-select it in the form
  const initialValues = courseId ? { course_id: parseInt(courseId, 10) } : undefined;

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-pulse">Loading courses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Add New Lesson</h1>
        <p className="text-red-500">Error fetching courses: {error instanceof Error ? error.message : 'Unknown error'}</p>
        <p className="mt-2">Cannot add a lesson without a list of courses. Please ensure courses are available or try again later.</p>
        <Link 
          href={courseId ? `/admin/courses/${courseId}/lessons` : '/admin/courses'} 
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mt-4 transition-colors"
        >
          <span className="mr-1">&larr;</span> Back to Lessons
        </Link>
      </div>
    );
  }
  
  if (!coursesData || coursesData.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Add New Lesson</h1>
        <p className="text-amber-600">No courses available. Please create a course first before adding lessons.</p>
        <div className="mt-4 flex space-x-4">
          <Link 
            href="/admin/courses/new" 
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create a Course
          </Link>
          <Link 
          href={courseId ? `/admin/courses/${courseId}/lessons` : '/admin/courses'} 
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back to Lessons
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href={courseId ? `/admin/courses/${courseId}/lessons` : '/admin/courses'} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
          &larr; Back to Lessons
        </Link>
        <h1 className="text-3xl font-bold mt-2">Add New Lesson</h1>
      </div>
      <LessonForm 
        action={createLesson}
        courses={coursesData || []}
        initialValues={initialValues}
        buttonText="Create Lesson"
        pendingButtonText="Creating Lesson..."
      />
    </div>
  );
}
