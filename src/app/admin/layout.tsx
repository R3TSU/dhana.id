// src/app/admin/layout.tsx
import Link from 'next/link';
import React from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-800 text-white p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Admin Panel</h1>
        <nav>
          <ul className="space-y-2">
            <li>
              <Link href="/admin/courses" className="block hover:bg-gray-700 p-2 rounded">
                Courses
              </Link>
            </li>
            {/* Add more admin links here as needed */}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-gray-100">
        {children}
      </main>
    </div>
  );
}
