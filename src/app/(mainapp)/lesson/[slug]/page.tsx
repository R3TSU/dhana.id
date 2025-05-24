// src/app/(mainapp)/lesson/[slug]/page.tsx
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react"; // Added AlertTriangle
import Link from 'next/link';
import Notes from "@/components/lesson/notes"; // Assuming this path is correct relative to new location
import ShareButton from "@/components/lesson/ShareButton"; // Assuming this path is correct
import VideoPlayer from "./VideoPlayer"; // Will now be in the same [slug] directory
import { getLessonDetailsBySlug } from "@/actions/admin/lesson.actions"; // Import new action
import { Metadata } from "next"; // For dynamic metadata

// Define props for the page
interface LessonPageProps {
  params: { slug: string }; // Corrected type as per Next.js 15+ for awaited params
}

// Dynamic metadata for SEO
export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { slug } = params; // params is already resolved here
  const { data: lessonData, error } = await getLessonDetailsBySlug(slug);

  if (error || !lessonData) {
    return {
      title: "Lesson Not Found",
      description: "The lesson you are looking for could not be found.",
    };
  }

  return {
    title: `${lessonData.title} | Dhana.id`,
    description: lessonData.description?.substring(0, 160) || `Watch the lesson: ${lessonData.title}`,
    openGraph: {
      title: lessonData.title,
      description: lessonData.description?.substring(0, 200) || `Watch the lesson: ${lessonData.title}`,
      images: lessonData.thumbnail_url ? [{ url: lessonData.thumbnail_url }] : [],
      type: 'video.other', // Or 'article' if more appropriate
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/lesson/${lessonData.slug}`, // Ensure NEXT_PUBLIC_BASE_URL is set
    },
    twitter: {
      card: 'summary_large_image',
      title: lessonData.title,
      description: lessonData.description?.substring(0, 200) || `Watch the lesson: ${lessonData.title}`,
      images: lessonData.thumbnail_url ? [lessonData.thumbnail_url] : [],
    },
  };
}


export default async function LessonPage({ params }: LessonPageProps) {
  const { slug } = params; // params is already resolved here
  const { data: lessonData, error } = await getLessonDetailsBySlug(slug);

  // Middleware should handle authentication. This page assumes user is authenticated.
  // Caching for this page (private) will be handled by vercel.json or middleware.

  if (error || !lessonData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-main text-white p-4">
        <AlertTriangle size={48} className="text-yellow-400 mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Lesson Not Found</h1>
        <p className="text-center mb-6">
          {error || "We couldn't find the lesson you're looking for."}
        </p>
        <Link href="/home">
          <Button className="bg-coral hover:bg-coral-dark text-white">
            Go to Home
          </Button>
        </Link>
      </div>
    );
  }
    
  return (
    <div className="min-h-screen flex flex-col bg-gradient-main">
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8"> {/* Added py-8 for padding */}
          {/* Back button */}
          <Link href={lessonData.courseSlug ? `/course/${lessonData.courseSlug}` : '/home'}>
            <Button 
              variant="ghost" 
              className="mb-6 text-indigo hover:text-coral hover:bg-transparent p-0"
            >
              <ArrowLeft size={16} className="mr-2" /> 
              Back to {lessonData.courseSlug ? 'Course' : 'Home'}
            </Button>
          </Link>
          
          <div>
            <h1 className="text-3xl font-bold text-indigo mb-4">{lessonData.title}</h1>
          </div> 

          {/* Video Player */}
          <div className="mb-8 bg-black rounded-lg overflow-hidden shadow-xl">
            <VideoPlayer videoUrl={lessonData.video_url || ''} title={lessonData.title} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Video Content */}
            <div className="lg:col-span-2">
              {/* Video Title and Description */}
              <div className="bg-white rounded-lg p-6 shadow-md mb-6"> {/* Changed bg-gray-100 to bg-white */}
                {lessonData.description && (
                  <div 
                    className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none text-charcoal/80 whitespace-pre-line mb-6"
                    dangerouslySetInnerHTML={{ __html: lessonData.description }} // Assuming description might be HTML
                  />
                )}
                
                {/* Share Buttons */}
                {/* Assuming ShareButton can take slug or id. If it needs numeric ID, use lessonData.id */}
                <ShareButton lessonId={lessonData.slug} /> 
              </div>
            </div>
            
            {/* Notes Section */}
            <Notes lessonId={lessonData.id} /> 
          </div>
        </div>
      </main>
    </div>
  );
}