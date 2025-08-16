import {
  getAllUsersForAdmin,
  getAllCoursesForAdmin,
  createEnrollmentByAdmin,
} from "@/actions/admin/enrollment.actions";
import { NewEnrollmentForm } from "@/components/admin/enrollments/NewEnrollmentForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NewEnrollmentPage() {
  const [usersResult, coursesResult] = await Promise.all([
    getAllUsersForAdmin(),
    getAllCoursesForAdmin(),
  ]);

  if (usersResult.error || coursesResult.error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-semibold mb-2 text-red-500">
          Error Loading Data
        </h2>
        <p className="mb-4">{usersResult.error || coursesResult.error}</p>
        <Link href="/admin/enrollments">
          <Button variant="outline">Back to Enrollments</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Create New Enrollment</h1>
        <Link href="/admin/enrollments">
          <Button variant="outline">Back to Enrollments</Button>
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <NewEnrollmentForm
          action={createEnrollmentByAdmin}
          users={usersResult.data}
          courses={coursesResult.data}
        />
      </div>
    </div>
  );
}
