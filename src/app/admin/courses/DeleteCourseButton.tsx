"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { deleteCourse } from "@/actions/admin/course.actions";

interface DeleteCourseButtonProps {
  courseId: number;
}

export function DeleteCourseButton({ courseId }: DeleteCourseButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this course? This action cannot be undone. Associated lessons might also be affected.",
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteCourse(courseId);

      if (result.success) {
        alert(result.message || "Course deleted successfully.");
        router.refresh(); // Re-fetch data for the page
      } else {
        throw new Error(result.message || "Failed to delete course");
      }
    } catch (err) {
      console.error("Error deleting course:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </Button>
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </>
  );
}
