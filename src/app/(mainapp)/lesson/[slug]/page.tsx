// src/app/(mainapp)/lesson/[slug]/page.tsx
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react"; // Added AlertTriangle
import Notes from "@/components/lesson/notes"; // Assuming this path is correct relative to new location
import ShareButton from "@/components/lesson/ShareButton"; // Assuming this path is correct
import WorkbookQuestions from "@/components/lesson/WorkbookQuestions"; // Added workbook component
import VideoPlayer from "./VideoPlayer"; // Will now be in the same [slug] directory
import { getLessonDetailsBySlug } from "@/actions/admin/lesson.actions"; // Import new action
import {
  hasLessonAccessOverride,
  getUserEnrollmentForCourse,
} from "@/actions/enrollment.actions";
import { Metadata } from "next"; // For dynamic metadata
import PageHeaderWithBackLink from "@/components/layout/PageHeaderWithBackLink";
import BackgroundOverlay from "@/components/layout/BackgroundOverlay";
import { ProgressBarLink } from "@/components/progress-bar";

// Define props for the page
interface LessonPageProps {
  params: Promise<{ slug: string }>;
}

// Dynamic metadata for SEO
export async function generateMetadata({
  params,
}: LessonPageProps): Promise<Metadata> {
  const { slug } = await params; // params is already resolved here
  const { data: lessonData, error } = await getLessonDetailsBySlug(slug);

  if (error || !lessonData) {
    return {
      title: "Lesson Not Found",
      description: "The lesson you are looking for could not be found.",
    };
  }

  return {
    title: `${lessonData.title}`,
    description:
      lessonData.description?.substring(0, 160) ||
      `Watch the lesson: ${lessonData.title}`,
    openGraph: {
      title: lessonData.title,
      description:
        lessonData.description?.substring(0, 200) ||
        `Watch the lesson: ${lessonData.title}`,
      images: lessonData.thumbnail_url
        ? [{ url: lessonData.thumbnail_url }]
        : [],
      type: "video.other", // Or 'article' if more appropriate
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/lesson/${lessonData.slug}`, // Ensure NEXT_PUBLIC_BASE_URL is set
    },
    twitter: {
      card: "summary_large_image",
      title: lessonData.title,
      description:
        lessonData.description?.substring(0, 200) ||
        `Watch the lesson: ${lessonData.title}`,
      images: lessonData.thumbnail_url ? [lessonData.thumbnail_url] : [],
    },
  };
}

export default async function LessonPage({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await paramsPromise; // Await the promise to get slug
  const { data: lessonData, error } = await getLessonDetailsBySlug(slug);

  // Middleware should handle authentication. This page assumes user is authenticated.
  // Caching for this page (private) will be handled by vercel.json or middleware.

  let canViewLesson = false;
  if (lessonData) {
    const lessonId = lessonData.id;
    const courseId = lessonData.course_id;
    const dayNumber = lessonData.day_number || 1;

    if (courseId) {
      const { enrollmentDate, error: enrollmentError } =
        await getUserEnrollmentForCourse(courseId);
      let daysSinceEnrollment = 0;
      if (enrollmentDate && !enrollmentError) {
        const today = new Date();
        const enrollDate = new Date(enrollmentDate);
        today.setHours(0, 0, 0, 0);
        enrollDate.setHours(0, 0, 0, 0);
        const diffTime = Math.abs(today.getTime() - enrollDate.getTime());
        daysSinceEnrollment = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Day of enrollment is Day 1
      } else {
        // If error fetching enrollment, or no date, assume not enrolled for drip purposes
        // Override can still grant access.
        if (enrollmentError) {
          console.warn(
            `Error fetching enrollment for course ${courseId} on lesson page ${slug}: ${enrollmentError}`,
          );
        }
      }
      const isAvailableByDrip = daysSinceEnrollment >= dayNumber;
      const hasOverride = await hasLessonAccessOverride(lessonId);
      canViewLesson = isAvailableByDrip || hasOverride;
    } else {
      // If lesson somehow has no course_id, only override can grant access
      console.warn(
        `Lesson ${slug} (ID: ${lessonId}) has no course_id. Checking for override only.`,
      );
      const hasOverride = await hasLessonAccessOverride(lessonId);
      canViewLesson = hasOverride;
    }
  }

  if (error || !lessonData || !canViewLesson) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-main text-white p-4">
        <AlertTriangle size={48} className="text-yellow-400 mb-4" />
        <h1 className="text-2xl font-semibold mb-2">
          {error || !lessonData ? "Lesson Not Found" : "Access Denied"}
        </h1>
        <p className="text-center mb-6">
          {error ||
            (!lessonData
              ? "We couldn't find the lesson you're looking for."
              : "You do not have access to this lesson yet, or it's not available.")}
        </p>
        <ProgressBarLink href="/home">
          <Button className="bg-coral hover:bg-coral-dark text-white">
            Go to Home
          </Button>
        </ProgressBarLink>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-purple-800 text-white">
      <main className="flex-grow relative">
        <BackgroundOverlay />
        <div className="relative z-10">
          <PageHeaderWithBackLink
            href={
              lessonData.courseSlug
                ? `/course/${lessonData.courseSlug}`
                : "/home"
            }
            linkText={`Back to ${lessonData.courseSlug ? "Program" : "Home"}`}
          />

          <div className="container mx-auto px-4 py-8">
            {" "}
            {/* Added py-8 for padding */}
            {/* Back button */}
            <div>
              <h1 className="text-3xl font-bold text-white mb-4">
                {lessonData.title}
              </h1>
            </div>
            {/* Video Player */}
            <div className="mb-8">
              <VideoPlayer
                videoUrl={lessonData.video_url || ""}
                title={lessonData.title}
                lessonId={lessonData.id}
                courseId={lessonData.course_id}
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Video Content */}
              <div className="lg:col-span-2">
                {/* Video Title and Description */}
                <div className="bg-white rounded-lg p-6 shadow-md mb-6">
                  {" "}
                  {/* Changed bg-gray-100 to bg-white */}
                  {lessonData.description && (
                    <div
                      className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none text-charcoal/80 whitespace-pre-line mb-6"
                      dangerouslySetInnerHTML={{
                        __html: lessonData.description,
                      }} // Assuming description might be HTML
                    />
                  )}
                  {/* Share Buttons */}
                  {/* Assuming ShareButton can take slug or id. If it needs numeric ID, use lessonData.id */}
                  <ShareButton
                    lessonSlug={lessonData.slug}
                    lessonTitle={lessonData.title}
                  />
                </div>

                {/* Workbook Questions */}
                <WorkbookQuestions
                  workbook={lessonData.workbook}
                  lessonId={lessonData.id}
                  lessonTitle={lessonData.title}
                />
              </div>

              {/* Notes Section */}
              <Notes
                lessonId={lessonData.id}
                lessonTitle={lessonData.title}
                hasWorkbook={
                  !!lessonData.workbook && lessonData.workbook.trim() !== ""
                }
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
