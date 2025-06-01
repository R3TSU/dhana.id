// src/components/admin/LessonForm.tsx
"use client";

import { useActionState, useState, useEffect } from "react";
import { SubmitButton } from "./SubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { lessons, courses as CoursesType } from "@/db/schema"; // Import types
import Link from "next/link";

interface InitialValues {
  course_id?: number;
  title?: string;
  description?: string;
  workbook?: string;
  video_url?: string;
  thumbnail_url?: string | null;
  day_number?: number | null;
}

interface LessonFormProps {
  action: any; // Server action - using 'any' to avoid type issues with server actions
  courses: Array<Pick<typeof CoursesType.$inferSelect, "id" | "title">>; // For course selection dropdown
  initialData?: typeof lessons.$inferSelect | null; // Drizzle's inferred select type for lessons
  initialValues?: InitialValues; // For setting initial form values programmatically
  buttonText?: string;
  pendingButtonText?: string;
  courseIdForCancelLink?: number; // For the cancel link destination
}

// Define proper type for form state
interface FormState {
  message: string | null;
  errors: {
    course_id?: string[];
    title?: string[];
    description?: string[];
    workbook?: string[];
    video_url?: string[];
    thumbnail_url?: string[];
    thumbnailFile?: string[];
    day_number?: string[];
    _form?: string[];
  };
}

const initialState: FormState = { message: null, errors: {} };

export function LessonForm({
  action,
  courses,
  initialData,
  initialValues, // Note: initialValues might need to be considered for thumbnail if used
  buttonText = "Save Lesson",
  pendingButtonText = "Saving Lesson...",
  courseIdForCancelLink,
}: LessonFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const cancelHref = courseIdForCancelLink
    ? `/admin/courses/${courseIdForCancelLink}/lessons`
    : "/admin/courses"; // Fallback to all lessons page if no specific courseId is provided
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(
    initialData?.thumbnail_url || null,
  );
  const [removeThumbnailFlag, setRemoveThumbnailFlag] =
    useState<boolean>(false);

  useEffect(() => {
    if (
      initialData?.thumbnail_url &&
      !thumbnailPreviewUrl &&
      !removeThumbnailFlag
    ) {
      setThumbnailPreviewUrl(initialData.thumbnail_url);
    }
    // If initialData.thumbnail_url becomes null/undefined (e.g. after an update that removes it elsewhere),
    // and we are not actively trying to remove it or have a new preview, clear the preview.
    if (
      !initialData?.thumbnail_url &&
      !removeThumbnailFlag &&
      !document.querySelector<HTMLInputElement>("#thumbnailFile")?.files?.[0]
    ) {
      setThumbnailPreviewUrl(null);
    }
  }, [initialData?.thumbnail_url, thumbnailPreviewUrl, removeThumbnailFlag]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file.");
        return;
      }
      setThumbnailPreviewUrl(URL.createObjectURL(file));
      setRemoveThumbnailFlag(false); // New file selected, so not removing
    } else {
      // If no file is selected, revert to initial or clear
      // setThumbnailPreviewUrl(initialData?.thumbnail_url || null);
    }
  };

  const handleRemoveThumbnailClick = () => {
    setThumbnailPreviewUrl(null);
    setRemoveThumbnailFlag(true);
    const fileInput = document.getElementById(
      "thumbnailFile",
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ""; // Clear the file input
    }
  };

  return (
    <form
      action={formAction}
      className="space-y-6 bg-white p-8 shadow-md rounded-lg"
    >
      <div>
        <label
          htmlFor="course_id"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Course
        </label>
        <select
          id="course_id"
          name="course_id"
          defaultValue={
            initialData?.course_id || initialValues?.course_id || ""
          }
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="" disabled>
            Select a course
          </option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
        {state.errors?.course_id && (
          <p className="mt-1 text-xs text-red-500">
            {state.errors.course_id.join(", ")}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Lesson Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          defaultValue={initialData?.title || initialValues?.title || ""}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        {state.errors?.title && (
          <p className="mt-1 text-xs text-red-500">
            {state.errors.title.join(", ")}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="video_url"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Video URL
        </label>
        <Input
          id="video_url"
          name="video_url"
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          defaultValue={initialData?.video_url || ""}
          aria-describedby="video_url-error"
          required
        />
        {state.errors?.video_url && (
          <p
            id="video_url-error"
            className="text-sm font-medium text-destructive"
          >
            {state.errors.video_url.join(", ")}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="day_number">Day Number</Label>
        <Input
          id="day_number"
          name="day_number"
          type="number"
          placeholder="1"
          defaultValue={
            initialData?.day_number?.toString() ||
            initialValues?.day_number?.toString() ||
            ""
          }
          aria-describedby="day_number-error"
          min="1"
          required
        />
        <p className="text-sm text-muted-foreground">
          The day number this lesson should become available (e.g., 1 for Day
          1).
        </p>
        {state.errors?.day_number && (
          <p
            id="day_number-error"
            className="text-sm font-medium text-destructive"
          >
            {state.errors.day_number.join(", ")}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description (Optional)
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={
            initialData?.description || initialValues?.description || ""
          }
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        {state.errors?.description && (
          <p className="mt-1 text-xs text-red-500">
            {state.errors.description.join(", ")}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="workbook"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Workbook / Reflection Questions (Optional)
        </label>
        <textarea
          id="workbook"
          name="workbook"
          defaultValue={initialData?.workbook || initialValues?.workbook || ""}
          rows={5}
          placeholder="Enter reflection questions here. Each line will be displayed as a separate question."
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
        />
        <p className="text-sm text-muted-foreground mt-1">
          These questions will be shown alongside the video for students to
          reflect on and answer in their notes.
        </p>
        {state.errors?.workbook && (
          <p className="mt-1 text-xs text-red-500">
            {state.errors.workbook.join(", ")}
          </p>
        )}
      </div>

      {/* Thumbnail Upload Section */}
      <div>
        <Label htmlFor="thumbnailFile">Lesson Thumbnail (Optional)</Label>
        <Input
          id="thumbnailFile"
          name="thumbnailFile"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        <input
          type="hidden"
          name="removeThumbnail"
          value={removeThumbnailFlag ? "true" : "false"}
        />

        {thumbnailPreviewUrl && !removeThumbnailFlag && (
          <div className="mt-4">
            <img
              src={thumbnailPreviewUrl}
              alt="Thumbnail preview"
              className="h-40 w-auto object-cover rounded-md border border-gray-200"
            />
          </div>
        )}

        {(thumbnailPreviewUrl || initialData?.thumbnail_url) &&
          !removeThumbnailFlag && (
            <button
              type="button"
              onClick={handleRemoveThumbnailClick}
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-800 transition-colors duration-150 ease-in-out"
            >
              Remove Thumbnail
            </button>
          )}
        {removeThumbnailFlag && (
          <p className="mt-2 text-sm text-gray-500">
            Thumbnail will be removed on save.
          </p>
        )}
        {state.errors?.thumbnailFile && (
          <p className="mt-1 text-xs text-red-500">
            {state.errors.thumbnailFile.join(", ")}
          </p>
        )}
        {/* Display error for thumbnail_url if it's still relevant (e.g. server-side URL validation if file wasn't main source) */}
        {state.errors?.thumbnail_url && (
          <p className="mt-1 text-xs text-red-500">
            {state.errors.thumbnail_url.join(", ")}
          </p>
        )}
      </div>

      {state.errors?._form && (
        <p className="mt-1 text-sm text-red-600 bg-red-100 p-3 rounded-md">
          {state.errors._form.join(", ")}
        </p>
      )}
      {state.message === "Database Error" && !state.errors?._form && (
        <p className="mt-1 text-sm text-red-600 bg-red-100 p-3 rounded-md">
          An unexpected database error occurred.
        </p>
      )}

      <div className="flex items-center justify-end space-x-4">
        <Link
          href={cancelHref}
          className="text-gray-600 hover:text-gray-800 text-sm font-medium"
        >
          Cancel
        </Link>
        <SubmitButton
          pendingText={pendingButtonText}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
        >
          {buttonText}
        </SubmitButton>
      </div>
    </form>
  );
}
