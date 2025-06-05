// src/components/admin/CourseForm.tsx

"use client";

function isValidBlobUrl(url: string): boolean {
  return /^blob:/.test(url);
}

import { useActionState, useState, useEffect, useRef } from "react";
import { SubmitButton } from "./SubmitButton";
import type { courses } from "@/db/schema";
import Link from "next/link";
import imageCompression from "browser-image-compression";

interface CourseFormProps {
  action: (prevState: any, formData: FormData) => Promise<any>; // Server action
  initialData?: typeof courses.$inferSelect | null; // Drizzle's inferred select type
  buttonText?: string;
  pendingButtonText?: string;
}

const initialState = { message: null, errors: {} };

export function CourseForm({
  action,
  initialData,
  buttonText = "Save Course",
  pendingButtonText = "Saving Course...",
}: CourseFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.thumbnail_url || null,
  );
  const [removeThumbnailFlag, setRemoveThumbnailFlag] =
    useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // If the form submission was successful and resulted in a redirect (implied by lack of new errors),
    // or if initialData changes (e.g. navigating to edit a different course), reset preview.
    // This is a basic reset; more robust reset might be needed for SPA-like behavior without full navigation.
    if (!state.errors && initialData?.thumbnail_url !== previewUrl) {
      setPreviewUrl(initialData?.thumbnail_url || null);
      setRemoveThumbnailFlag(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear file input
      }
    }
    // Reset preview if initialData.thumbnail_url is explicitly cleared by an update
    if (
      initialData &&
      initialData.thumbnail_url === null &&
      previewUrl !== null
    ) {
      setPreviewUrl(null);
    }
  }, [state.errors, initialData, previewUrl]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPreviewUrl(initialData?.thumbnail_url || null);
      return;
    }

    try {
      // Compression options
      const options = {
        maxSizeMB: 0.3, // Maximum file size in MB (500KB)
        maxWidthOrHeight: 400, // Maximum width or height (whichever is larger)
        useWebWorker: true, // Use web worker for better performance
        fileType: file.type, // Keep the original file type
        initialQuality: 0.8, // Initial quality (0.8 = 80%)
        maxIteration: 10, // Maximum number of compression iterations
      };

      // Compress the image
      const compressedFile = await imageCompression(file, options);

      // Create preview URL from compressed file
      const previewUrl = URL.createObjectURL(compressedFile);

      // Update the file input with the compressed file
      if (fileInputRef.current) {
        // Create a new DataTransfer object to update the file input
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(
          new File([compressedFile], file.name, { type: compressedFile.type }),
        );
        fileInputRef.current.files = dataTransfer.files;
      }

      setPreviewUrl(previewUrl);
      setRemoveThumbnailFlag(false);
    } catch (error) {
      console.error("Error compressing image:", error);
      // Fallback to original file if compression fails
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveThumbnail = () => {
    setPreviewUrl(null);
    setRemoveThumbnailFlag(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear the file input
    }
  };

  return (
    <form
      action={formAction}
      className="space-y-6 bg-white p-8 shadow-md rounded-lg"
    >
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          defaultValue={initialData?.title || ""}
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
          htmlFor="subtitle"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Subtitle (Optional)
        </label>
        <input
          type="text"
          id="subtitle"
          name="subtitle"
          defaultValue={initialData?.subtitle || ""}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        {state.errors?.subtitle && (
          <p className="mt-1 text-xs text-red-500">
            {state.errors.subtitle.join(", ")}
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
          rows={4}
          defaultValue={initialData?.description || ""}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        {state.errors?.description && (
          <p className="mt-1 text-xs text-red-500">
            {state.errors.description.join(", ")}
          </p>
        )}
      </div>

      <div className="flex space-x-6">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            defaultChecked={initialData?.is_active !== false}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label
            htmlFor="is_active"
            className="ml-2 block text-sm text-gray-700"
          >
            Active
          </label>
          {state.errors?.is_active && (
            <p className="mt-1 text-xs text-red-500">
              {state.errors.is_active.join(", ")}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="start_date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Start Date (Optional)
          </label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            defaultValue={
              initialData?.start_date
                ? new Date(initialData.start_date).toISOString().split("T")[0]
                : ""
            }
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            If set, course will only be available after this date
          </p>
          {state.errors?.start_date && (
            <p className="mt-1 text-xs text-red-500">
              {state.errors.start_date.join(", ")}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="thumbnailFile"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Course Thumbnail
        </label>
        <input
          type="file"
          id="thumbnailFile"
          name="thumbnailFile"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          aria-describedby="file-constraints"
        />
        <p id="file-constraints" className="mt-1 text-xs text-gray-500">
          Images will be automatically compressed to max 400px width/height and
          300KB
        </p>
        {removeThumbnailFlag && (
          <input type="hidden" name="removeThumbnail" value="true" />
        )}
        {previewUrl && isValidBlobUrl(previewUrl) && (
          <div className="mt-4">
            <img
              src={previewUrl}
              alt="Thumbnail preview"
              className="h-32 w-auto object-cover rounded-md border border-gray-300"
            />
            <button
              type="button"
              onClick={handleRemoveThumbnail}
              className="mt-2 text-xs text-red-600 hover:text-red-800"
            >
              Remove Thumbnail
            </button>
          </div>
        )}
        {!previewUrl && initialData?.thumbnail_url && !removeThumbnailFlag && (
          <div className="mt-4">
            <p className="text-xs text-gray-500">Current thumbnail:</p>
            <img
              src={initialData.thumbnail_url}
              alt="Current thumbnail"
              className="h-32 w-auto object-cover rounded-md border border-gray-300"
            />
            <button
              type="button"
              onClick={handleRemoveThumbnail}
              className="mt-2 text-xs text-red-600 hover:text-red-800"
            >
              Remove Thumbnail
            </button>
          </div>
        )}
        {/* Display errors for thumbnail_url if they come from server-side validation of the URL itself (e.g. after upload) */}
        {state.errors?.thumbnail_url && (
          <p className="mt-1 text-xs text-red-500">
            {state.errors.thumbnail_url.join(", ")}
          </p>
        )}
        {/* Display errors for _form if they are specific to file upload process */}
        {state.errors?._form &&
          state.errors._form.some(
            (err: string) =>
              err.toLowerCase().includes("upload") ||
              err.toLowerCase().includes("file"),
          ) && (
            <p className="mt-1 text-xs text-red-500">
              {state.errors._form.find(
                (err: string) =>
                  err.toLowerCase().includes("upload") ||
                  err.toLowerCase().includes("file"),
              )}
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
          href="/admin/courses"
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
