"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAllLessons, deleteLesson } from "@/actions/admin/lesson.actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCourseById } from "@/actions/admin/course.actions";

interface Lesson {
  id: number;
  title: string;
  slug: string;
  courseId: number;
  thumbnail_url?: string | null;
  day_number?: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface Course {
  id: number;
  title: string;
  description?: string | null;
}

export default function CourseLessonsPage() {
  const params = useParams();
  const router = useRouter();
  const courseIdParam = params.courseId as string;

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseIdParam) return;
    const id = parseInt(courseIdParam);
    if (isNaN(id) || id <= 0) {
      setError("Invalid course ID");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const courseResult = await getCourseById(id);
        if (courseResult.error || !courseResult.data) {
          setError(courseResult.error || "Course not found");
          setLoading(false);
          return;
        }
        setCourse(courseResult.data as Course);

        const lessonsResult = await getAllLessons(id);
        if (lessonsResult.error) {
          setError(lessonsResult.error);
        } else if (lessonsResult.data) {
          setLessons(lessonsResult.data as Lesson[]);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load data for this course.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseIdParam]);

  const handleDelete = async (lessonId: number) => {
    if (window.confirm("Are you sure you want to delete this lesson?")) {
      const currentCourseIdNum = parseInt(courseIdParam, 10);
      const result = await deleteLesson(
        lessonId,
        isNaN(currentCourseIdNum) ? undefined : currentCourseIdNum,
      );

      if (result.success) {
        setLessons((prevLessons) =>
          prevLessons.filter((l) => l.id !== lessonId),
        );
        alert(result.message || "Lesson deleted successfully.");
        // The server action handles revalidatePath, so UI updates locally for immediate feedback.
        // Consider router.refresh() if there are other derived states on the page that need updating.
      } else {
        alert(`Error: ${result.message || "Failed to delete lesson."}`);
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (error) {
    return <p className="text-red-500 p-4">Error: {error}</p>;
  }

  if (!course) {
    return <p className="text-orange-500 p-4">Course details not available.</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Lessons for: {course.title}</h1>
          <p className="text-gray-600 mt-1">{course.description}</p>
        </div>
        <div className="space-x-2">
          <Link href={`/admin/courses`}>
            <Button variant="outline">Back to Course</Button>
          </Link>
          <Link href={`/admin/lessons/new?courseId=${courseIdParam}`}>
            <Button>Add New Lesson</Button>
          </Link>
        </div>
      </div>

      {!lessons || lessons.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-gray-500 mb-4">
            No lessons found for this course.
          </p>
          <Link href={`/admin/lessons/new?courseId=${courseIdParam}`}>
            <Button>Create Your First Lesson</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thumbnail
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lesson Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Day #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lessons.map((lesson) => (
                <tr key={lesson.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {lesson.thumbnail_url ? (
                      <img
                        src={lesson.thumbnail_url}
                        alt={lesson.title}
                        className="h-10 w-16 object-cover rounded"
                      />
                    ) : (
                      <div className="h-10 w-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                        No Image
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {lesson.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {lesson.day_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(lesson.createdAt!).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/lessons/${lesson.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(lesson.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
