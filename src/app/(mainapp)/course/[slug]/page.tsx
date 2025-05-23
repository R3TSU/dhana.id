import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import VideoCard from "@/components/course/VideoCard";
import { getCourseWithLessonsBySlug, type CourseWithLessons, type PublicLessonForCoursePage } from "@/actions/admin/course.actions"; // Adjust path if needed
import { enrollInCourse } from "@/actions/enrollment.actions"; // Import the new action
import { auth, currentUser } from "@clerk/nextjs/server";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>; 
}) {
  const { slug } = await params;
  const { course, lessons: lessonsData, error } = await getCourseWithLessonsBySlug(slug);

  const authResult = await auth(); // Call auth() here
  console.log("Auth result in CoursePage:", JSON.stringify(authResult)); // Log it

  if (error || !course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-main text-red-500 p-4 text-center">
        <h2 className="text-2xl font-semibold mb-2">Oops! Course Not Found.</h2>
        <p>{error || "The course you're looking for doesn't exist or an error occurred."}</p>
        <Link href="/home">
          <Button variant="outline" className="mt-4">Go Back to Courses</Button>
        </Link>
      </div>
    );
  }

  // Attempt to enroll the user in the course (silently)
  // This will create an enrollment record if one doesn't exist for the current user and this course.
  // For now, all enrollments are free and happen automatically upon visiting the course page.
  if (course && course.id) { // Ensure course and course.id are available
    const enrollmentResult = await enrollInCourse(course.id);
    if (enrollmentResult.error) {
      console.warn(`Auto-enrollment check/attempt failed for course ${course.id}: ${enrollmentResult.error} (Message: ${enrollmentResult.message || 'N/A'})`);
    } else if (enrollmentResult.success) {
      console.log(`Enrollment status for course ${course.id}: ${enrollmentResult.message}`);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-main">
      {/* <Navbar isScrolled={isScrolled} /> */}
      
      <main className="flex-grow">
        <div className="container mx-auto px-4">
          {/* Back button */}
          <Link href="/home">
            <Button 
                variant="ghost" 
                className="mb-6 text-indigo hover:text-coral hover:bg-transparent p-0"
            >
                <ArrowLeft size={16} className="mr-2" /> Back to Courses
            </Button>
          </Link>
          
          {/* Course Header */}
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-indigo mb-2">{course.title}</h1>
            <p className="text-lg text-charcoal/80">{course.description ?? 'No description available.'}</p>
          </div>
          
          {/* Lessons Grid */}
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-indigo mb-6">Lessons</h2>
            {lessonsData && lessonsData.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {lessonsData.map((lesson: PublicLessonForCoursePage) => (
                  <VideoCard
                    key={lesson.id}
                    id={lesson.id} // Lesson ID for React key
                    lessonSlug={lesson.slug} // Pass lesson's slug for navigation
                    title={lesson.title}
                    thumbnailUrl={lesson.thumbnailUrl ? lesson.thumbnailUrl : "https://placehold.co/400x200/slate/white?text=No+Image"}
                    // For now, we assume all fetched lessons are available.
                    available={true} 
                    // availableDate can be added to PublicLessonForCoursePage if needed
                  />
                ))}
              </div>
            ) : (
              <p className="text-charcoal/70">No lessons available for this course yet. Check back soon!</p>
            )}
          </div>
        </div>
      </main>
      
    </div>
  );
}