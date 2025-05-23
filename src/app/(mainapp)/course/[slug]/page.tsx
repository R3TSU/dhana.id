import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import VideoCard from "@/components/course/VideoCard";
import { getCourseWithLessonsBySlug, type CourseWithLessons, type PublicLessonForCoursePage } from "@/actions/admin/course.actions"; // Adjust path if needed
import { enrollInCourse, getUserEnrollmentForCourse } from "@/actions/enrollment.actions"; // Import new actions

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>; 
}) {
  const { slug } = await params;
  const { course, lessons: lessonsData, error } = await getCourseWithLessonsBySlug(slug);

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
  let daysSinceEnrollment = 0; // Default to 0 if not enrolled or error
  let enrollmentError: string | null = null;

  if (course && course.id) {
    const enrollmentCheck = await enrollInCourse(course.id); // Ensure enrollment record exists
    if (enrollmentCheck.error && !enrollmentCheck.message?.includes("already enrolled")) {
      // Log significant errors, but don't block page load for enrollment issues
      console.warn(`Auto-enrollment check/attempt failed for course ${course.id}: ${enrollmentCheck.error}`);
      enrollmentError = "Could not verify enrollment status. Content may be restricted.";
    } else {
      // Fetch enrollment date to calculate days since enrollment
      const { enrollmentDate, error: fetchEnrollmentError } = await getUserEnrollmentForCourse(course.id);
      if (fetchEnrollmentError) {
        console.warn(`Failed to fetch enrollment date for course ${course.id}: ${fetchEnrollmentError}`);
        // If user is enrolled (by enrollInCourse) but we can't get date, assume day 1 to be safe
        // This might happen if there's a slight delay or issue fetching immediately after creation
        daysSinceEnrollment = enrollmentCheck.success ? 1 : 0;
        if (!enrollmentCheck.success) enrollmentError = "Could not fetch enrollment details. Content may be restricted.";
      } else if (enrollmentDate) {
        const today = new Date();
        const enrollDate = new Date(enrollmentDate);
        // Normalize to start of day for comparison
        today.setHours(0, 0, 0, 0);
        enrollDate.setHours(0, 0, 0, 0);
        const diffTime = Math.abs(today.getTime() - enrollDate.getTime());
        daysSinceEnrollment = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Day of enrollment is Day 1
      } else {
        // Not enrolled or no enrollment date found, treat as not started for dripping
        daysSinceEnrollment = 0; 
      }
    }
  }

  const processedLessons = lessonsData
    .map(lesson => {
      let availabilityStatus: 'available' | 'coming_soon' | 'hidden' = 'hidden';
      const dayNumber = lesson.dayNumber || 1; // Default to 1 if not set

      if (daysSinceEnrollment >= dayNumber) {
        availabilityStatus = 'available';
      } else if (dayNumber - daysSinceEnrollment === 1) {
        availabilityStatus = 'coming_soon';
      }
      // else it remains 'hidden'

      return {
        ...lesson,
        availabilityStatus,
        dayNumber, // ensure dayNumber is passed
      };
    })
    .filter(lesson => lesson.availabilityStatus !== 'hidden');

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
            {enrollmentError && <p className='text-sm text-red-500 mb-4'>{enrollmentError}</p>}
            {processedLessons && processedLessons.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {processedLessons.map((lesson) => (
                  <VideoCard
                    key={lesson.id}
                    id={String(lesson.id)} // Ensure id is string for VideoCard prop
                    lessonSlug={lesson.slug}
                    title={lesson.title}
                    thumbnailUrl={lesson.thumbnailUrl ? lesson.thumbnailUrl : "https://placehold.co/400x200/slate/white?text=No+Image"}
                    availabilityStatus={lesson.availabilityStatus as 'available' | 'coming_soon'} // Cast because filter removes 'hidden'
                    dayNumber={lesson.dayNumber}
                    daysSinceEnrollment={daysSinceEnrollment} // Pass for potential display in VideoCard
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