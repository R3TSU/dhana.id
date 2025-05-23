// src/app/admin/lessons/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAllLessons, deleteLesson } from '@/actions/admin/lesson.actions';
import { getCoursesForSelection } from '@/actions/admin/course.actions';
import Link from 'next/link';
// import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Lesson {
  id: number;
  title: string;
  slug: string;
  courseId: number;
  courseTitle?: string | null;
  thumbnail_url?: string | null;
  day_number?: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export default function AdminLessonsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [courses, setCourses] = useState<{id: number, title: string}[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>('all');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch courses for the filter dropdown
                const coursesData = await getCoursesForSelection();
                if (coursesData.data) {
                    setCourses(coursesData.data);
                }

                // Get courseId from URL if present
                const courseId = searchParams.get('courseId');
                if (courseId) {
                    setSelectedCourse(courseId);
                }

                // Fetch lessons with optional course filter
                const { data, error } = await getAllLessons(courseId ? parseInt(courseId) : undefined);
                
                if (error) {
                    setError(error);
                } else if (data) {
                    setLessons(data);
                }
            } catch (err) {
                setError('Failed to load lessons');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [searchParams]);

    const handleCourseChange = (value: string) => {
        setSelectedCourse(value);
        if (value === 'all') {
            router.push('/admin/lessons');
        } else {
            router.push(`/admin/lessons?courseId=${value}`);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8">Loading...</div>;
    }

    if (error) {
        return <p className="text-red-500 p-4">Error: {error}</p>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Manage Lessons</h1>
                <div className="flex items-center space-x-4">
                    <div className="w-64">
                        <Select value={selectedCourse} onValueChange={handleCourseChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by course" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Courses</SelectItem>
                                {courses.map(course => (
                                    <SelectItem key={course.id} value={String(course.id)}>
                                        {course.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Link href={selectedCourse !== 'all' ? `/admin/lessons/new?courseId=${selectedCourse}` : '/admin/lessons/new'}>
                        <Button>
                            Add New Lesson
                        </Button>
                    </Link>
                </div>
            </div>

            {(!lessons || lessons.length === 0) ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <p className="text-gray-500 mb-4">
                        {selectedCourse === 'all' 
                            ? 'No lessons found. Create your first lesson!'
                            : 'No lessons found for this course.'}
                    </p>
                    <Link href={selectedCourse !== 'all' ? `/admin/lessons/new?courseId=${selectedCourse}` : '/admin/lessons/new'}>
                        <Button>Create New Lesson</Button>
                    </Link>
                </div>
            ) : (
                <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                    <table className="min-w-full table-auto">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thumbnail</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lesson Title</th>
                                {selectedCourse === 'all' && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                                )}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day #</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {lessons.map((lesson) => (
                                <tr key={lesson.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {lesson.thumbnail_url ? (
                                            <img src={lesson.thumbnail_url} alt={lesson.title} className="h-10 w-16 object-cover rounded" />
                                        ) : (
                                            <div className="h-10 w-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">No Image</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{lesson.title}</div>
                                    </td>
                                    {selectedCourse === 'all' && (
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                {lesson.courseTitle || 'N/A'}
                                            </div>
                                        </td>
                                    )}
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
