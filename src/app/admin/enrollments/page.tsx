import Link from 'next/link';
import { Suspense } from 'react';
import { getEnrollmentsForAdminView, getCoursesForAdminFilter, AdminEnrollmentView } from '@/actions/admin/enrollment.actions';
import { PaginationControls } from '@/components/shared/PaginationControls'; // Assuming this exists or will be created
import EnrollmentFilterClient from '@/components/admin/enrollments/EnrollmentFilterClient'; // To be created

interface AdminEnrollmentsPageProps {
  searchParams: {
    page?: string;
    courseId?: string;
  };
}

async function EnrollmentsTable({ currentPage, currentCourseId }: { currentPage: number; currentCourseId?: number }) {
  const { data: enrollments, totalCount, error } = await getEnrollmentsForAdminView({
    page: currentPage,
    courseIdFilter: currentCourseId,
    pageSize: 15, // Or your preferred page size
  });

  if (error) {
    return <p className="text-red-500">Error loading enrollments: {error}</p>;
  }

  if (enrollments.length === 0) {
    return <p>No enrollments found.</p>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-x-auto">
      <table className="min-w-full table-auto">
        <thead className="bg-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment Date</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {enrollments.map((enrollment) => (
            <tr key={enrollment.enrollmentId}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{enrollment.userName || 'N/A'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Link href={`/admin/courses/${enrollment.courseId}/edit`} className="text-sm text-blue-600 hover:underline">
                  {enrollment.courseName}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{new Date(enrollment.enrollmentDate).toLocaleDateString()}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <PaginationControls
        currentPage={currentPage}
        totalCount={totalCount}
        pageSize={15} // Must match pageSize in getEnrollmentsForAdminView
        baseUrl="/admin/enrollments"
        currentFilters={{ courseId: currentCourseId?.toString() }}
      />
    </div>
  );
}

export default async function AdminEnrollmentsPage({ searchParams }: AdminEnrollmentsPageProps) {
  const currentPage = parseInt(searchParams.page || '1', 10);
  const currentCourseId = searchParams.courseId ? parseInt(searchParams.courseId, 10) : undefined;

  const { data: coursesForFilter, error: filterError } = await getCoursesForAdminFilter();

  if (filterError) {
    // Potentially handle this more gracefully, but for now:
    console.error("Error loading courses for filter:", filterError);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Enrollments</h1>
        {/* Optional: Add a button or link here if needed */}
      </div>

      <div className="mb-4">
        <EnrollmentFilterClient 
          courses={coursesForFilter || []} 
          currentCourseId={currentCourseId?.toString()} 
        />
      </div>

      <Suspense fallback={<p>Loading enrollments...</p>}>
        <EnrollmentsTable currentPage={currentPage} currentCourseId={currentCourseId} />
      </Suspense>
    </div>
  );
}
