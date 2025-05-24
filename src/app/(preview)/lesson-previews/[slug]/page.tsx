import Link from 'next/link';
import { Metadata } from 'next';
import { getLessonDetailsBySlug } from '@/actions/admin/lesson.actions'; // Assuming this can fetch basic details
import { Button } from '@/components/ui/button';
import { AlertTriangle, Eye, Lock } from 'lucide-react';

interface LessonPreviewPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: LessonPreviewPageProps): Promise<Metadata> {
  const { slug } = params;
  // Fetch minimal data for metadata, or adjust getLessonDetailsBySlug if it's too heavy
  const { data: lessonData, error } = await getLessonDetailsBySlug(slug);

  if (error || !lessonData) {
    return {
      title: 'Lesson Preview Not Found',
      description: 'This lesson preview is currently unavailable.',
    };
  }

  const description = lessonData.description ? lessonData.description.substring(0, 160) : `Preview of lesson: ${lessonData.title}`;

  return {
    title: `Preview: ${lessonData.title}`,
    description: description,
    openGraph: {
      title: `Preview: ${lessonData.title}`,
      description: description,
      type: 'article',
      url: `/lesson-previews/${slug}`,
      images: lessonData.thumbnail_url ? [lessonData.thumbnail_url] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Preview: ${lessonData.title}`,
      description: description,
      images: lessonData.thumbnail_url ? [lessonData.thumbnail_url] : [],
    },
  };
}

export default async function LessonPreviewPage({ params }: LessonPreviewPageProps) {
  const { slug } = params;
  const { data: lessonData, error } = await getLessonDetailsBySlug(slug);

  if (error || !lessonData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <AlertTriangle size={48} className="text-yellow-500 mb-4" />
        <h1 className="text-2xl font-semibold mb-2 text-gray-800">Lesson Preview Not Available</h1>
        <p className="text-center text-gray-600 mb-6">
          We couldn't load the preview for this lesson. It might have been moved or no longer exists.
        </p>
        <Link href="/"> {/* Or your main courses listing page */}
          <Button variant="outline">
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  // Construct the sign-up URL with the fromLesson parameter
  const signUpUrl = `/sign-up?fromLesson=${slug}`;
  // Construct the sign-in URL to redirect back to the full lesson after login
  const fullLessonUrl = `/lesson/${slug}`;
  const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(fullLessonUrl)}`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {lessonData.thumbnail_url && (
          <img 
            src={lessonData.thumbnail_url} 
            alt={`Thumbnail for ${lessonData.title}`} 
            className="w-full h-64 object-cover"
          />
        )}
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">{lessonData.title}</h1>
          <p className="text-gray-600 mb-2 text-xl">{lessonData.courseTitle || 'N/A'}</p>
          
          <div className="prose prose-lg max-w-none text-gray-700 mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">What you'll learn (preview)</h2>
            {/* Display a short description or key points as a teaser */}
            <p>{lessonData.description ? lessonData.description.substring(0, 300) + '...' : 'No preview description available.'}</p>
            {/* You could also list a few bullet points from the lesson if available */}
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <Lock className="h-5 w-5 text-blue-500" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  This is just a preview. Sign up or log in to access the full lesson content, videos, and materials.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href={signUpUrl} className="flex-1">
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                Sign Up to Unlock Full Lesson
              </Button>
            </Link>
            <Link href={signInUrl} className="flex-1">
              <Button variant="outline" className="w-full">
                Already a Member? Log In
              </Button>
            </Link>
          </div>
          
          <div className="mt-6 text-center">
            <Link href={`/course/${(lessonData as any).course_slug || '#'}`} className="text-sm text-indigo-600 hover:text-indigo-500">
              &larr; Back to Course Overview
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
