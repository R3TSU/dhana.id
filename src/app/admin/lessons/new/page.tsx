"use client";

import { Suspense } from "react";
import NewLessonFormLoader from "./NewLessonFormLoader";

function LoadingFallback() {
  return (
    <div className="flex justify-center items-center min-h-screen p-6">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      <p className="ml-4 text-lg font-medium text-gray-700">Loading form...</p>
    </div>
  );
}

export default function NewLessonPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NewLessonFormLoader />
    </Suspense>
  );
}
