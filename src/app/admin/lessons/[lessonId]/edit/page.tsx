// src/app/admin/lessons/[id]/edit/page.tsx
import { LessonForm } from '@/components/admin/LessonForm';
import { getLessonById, updateLesson, getCoursesForSelection } from '@/actions/admin/lesson.actions';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EditLessonPage({ params }: {
  params: Promise<{ lessonId: string }>
}) {
  const { lessonId } = await params


  if (isNaN(parseInt(lessonId))) {
    notFound();
  }

  const lessonResult = await getLessonById(parseInt(lessonId));
  const coursesResult = await getCoursesForSelection();

  if (lessonResult.error || !lessonResult.data) {
    console.error(lessonResult.error);
    notFound(); // Lesson not found or error fetching
  }

  if (coursesResult.error) {
    // This is a bit trickier. The form needs courses. 
    // We could show an error or try to render the form without course selection (less ideal).
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Edit Lesson: {lessonResult.data.title}</h1>
            <p className="text-red-500">Error fetching courses: {coursesResult.error}</p>
            <p>Cannot edit the lesson without a list of courses. Please try again later.</p>
            <Link href={lessonResult.data ? `/admin/courses/${lessonResult.data.course_id}/lessons` : '/admin/courses'} className="text-indigo-600 hover:text-indigo-800 mt-4 inline-block">
            &larr; Back to Lessons
            </Link>
        </div>
    );
  }
  
  if (!coursesResult.data || coursesResult.data.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Edit Lesson: {lessonResult.data.title}</h1>
        <p className="text-orange-500">No courses available to assign this lesson to.</p>
        <p>Please <Link href="/admin/courses/new" className="text-indigo-600 hover:text-indigo-800">create a course</Link> first.</p>
        <Link href={lessonResult.data ? `/admin/courses/${lessonResult.data.course_id}/lessons` : '/admin/courses'} className="text-indigo-600 hover:text-indigo-800 mt-4 inline-block">
          &larr; Back to Lessons
        </Link>
      </div>
    );
  }

  const lesson = lessonResult.data;
  const courses = coursesResult.data;

  // Bind the lessonId to the updateLesson server action
  const updateLessonWithId = updateLesson.bind(null, lesson.id);

  return (
    <div>
      <div className="mb-6">
        <Link href={lesson ? `/admin/courses/${lesson.course_id}/lessons` : '/admin/courses'} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
          &larr; Back to Lessons
        </Link>
        <h1 className="text-3xl font-bold mt-2">Edit Lesson: {lesson.title}</h1>
      </div>
      <LessonForm
        action={updateLessonWithId}
        initialData={lesson}
        courses={courses}
        buttonText="Update Lesson"
        pendingButtonText="Updating Lesson..."
      />
    </div>
  );
}
