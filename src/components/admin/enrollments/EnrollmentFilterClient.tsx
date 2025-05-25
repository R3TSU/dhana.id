"use client";

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

interface CourseSelectItem {
  id: number;
  title: string;
}

interface EnrollmentFilterClientProps {
  courses: CourseSelectItem[];
  currentCourseId?: string;
}

export default function EnrollmentFilterClient({
  courses,
  currentCourseId,
}: EnrollmentFilterClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilterChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newCourseId = event.target.value;
      const current = new URLSearchParams(Array.from(searchParams.entries()));

      if (newCourseId && newCourseId !== 'all') {
        current.set('courseId', newCourseId);
      } else {
        current.delete('courseId');
      }
      current.set('page', '1'); // Reset to page 1 on filter change

      const search = current.toString();
      const query = search ? `?${search}` : '';
      router.push(`${pathname}${query}`);
    },
    [searchParams, pathname, router]
  );

  return (
    <div className="mb-4 p-4 bg-gray-100 rounded-lg shadow">
      <label htmlFor="courseFilter" className="block text-sm font-medium text-gray-700 mb-1">
        Filter by Course:
      </label>
      <select
        id="courseFilter"
        name="courseFilter"
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
        value={currentCourseId || 'all'}
        onChange={handleFilterChange}
      >
        <option value="all">All Courses</option>
        {courses.map((course) => (
          <option key={course.id} value={course.id.toString()}>
            {course.title}
          </option>
        ))}
      </select>
    </div>
  );
}
