// src/app/admin/lessons/page.tsx
'use client';

import { Suspense } from 'react';
import LessonsList from './LessonsList';

function LoadingFallback() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      <p className="ml-4 text-lg font-medium text-gray-700">Loading lessons...</p>
    </div>
  );
}

export default function AdminLessonsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LessonsList />
    </Suspense>
  );
}
