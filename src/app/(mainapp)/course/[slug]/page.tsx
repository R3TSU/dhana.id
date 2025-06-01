import { Button } from "@/components/ui/button";
import VideoCard from "@/components/course/VideoCard";
import {
  getCourseWithLessonsBySlug,
  type CourseWithLessons,
  type PublicLessonForCoursePage,
} from "@/actions/admin/course.actions"; // Adjust path if needed
import {
  enrollInCourse,
  getUserEnrollmentForCourse,
  hasLessonAccessOverride,
} from "@/actions/enrollment.actions"; // Import new actions
import PageHeaderWithBackLink from "@/components/layout/PageHeaderWithBackLink";
import BackgroundOverlay from "@/components/layout/BackgroundOverlay";
import { ProgressBarLink } from "@/components/progress-bar";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const {
    course,
    lessons: lessonsData,
    error,
  } = await getCourseWithLessonsBySlug(slug);

  if (error || !course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-main text-red-500 p-4 text-center">
        <h2 className="text-2xl font-semibold mb-2">Oops! Course Not Found.</h2>
        <p>
          {error ||
            "The course you're looking for doesn't exist or an error occurred."}
        </p>
        <ProgressBarLink href="/home">
          <Button variant="outline" className="mt-4">
            Go Back to Courses
          </Button>
        </ProgressBarLink>
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
    if (
      enrollmentCheck.error &&
      !enrollmentCheck.message?.includes("already enrolled")
    ) {
      // Log significant errors, but don't block page load for enrollment issues
      console.warn(
        `Auto-enrollment check/attempt failed for course ${course.id}: ${enrollmentCheck.error}`,
      );
      enrollmentError =
        "Could not verify enrollment status. Content may be restricted.";
    } else {
      // Fetch enrollment date to calculate days since enrollment
      const { enrollmentDate, error: fetchEnrollmentError } =
        await getUserEnrollmentForCourse(course.id);
      if (fetchEnrollmentError) {
        console.warn(
          `Failed to fetch enrollment date for course ${course.id}: ${fetchEnrollmentError}`,
        );
        // If user is enrolled (by enrollInCourse) but we can't get date, assume day 1 to be safe
        // This might happen if there's a slight delay or issue fetching immediately after creation
        daysSinceEnrollment = enrollmentCheck.success ? 1 : 0;
        if (!enrollmentCheck.success)
          enrollmentError =
            "Could not fetch enrollment details. Content may be restricted.";
      } else if (enrollmentDate) {
        // Get current time in UTC
        const now = new Date();

        // Convert current time to UTC+7 by adding 7 hours
        const nowUTC7 = new Date(now.getTime() + 7 * 60 * 60 * 1000);

        // Create a date object for the start of the day in UTC+7
        const todayUTC7 = new Date(
          Date.UTC(
            nowUTC7.getUTCFullYear(),
            nowUTC7.getUTCMonth(),
            nowUTC7.getUTCDate(),
          ),
        );

        // Convert enrollment date to UTC+7
        const enrollDate = new Date(enrollmentDate);
        const enrollDateUTC7 = new Date(
          enrollDate.getTime() + 7 * 60 * 60 * 1000,
        );

        // Set both dates to start of their respective days in UTC+7
        const enrollDateStart = new Date(
          Date.UTC(
            enrollDateUTC7.getUTCFullYear(),
            enrollDateUTC7.getUTCMonth(),
            enrollDateUTC7.getUTCDate(),
          ),
        );

        // Calculate difference in days
        const diffTime = todayUTC7.getTime() - enrollDateStart.getTime();
        daysSinceEnrollment = Math.max(
          1,
          Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1,
        );

        console.log("now (UTC):", now.toISOString());
        console.log("nowUTC7:", nowUTC7.toISOString());
        console.log("todayUTC7 (start of day UTC+7):", todayUTC7.toISOString());
        console.log("enrollDate (UTC):", enrollDate.toISOString());
        console.log("enrollDateUTC7:", enrollDateUTC7.toISOString());
        console.log(
          "enrollDateStart (start of day UTC+7):",
          enrollDateStart.toISOString(),
        );
      } else {
        // Not enrolled or no enrollment date found, treat as not started for dripping
        daysSinceEnrollment = 0;
      }

      console.log("daysSinceEnrollment", daysSinceEnrollment);
    }
  }

  const processedLessonsPromises = lessonsData.map(async (lesson) => {
    let availabilityStatus: "available" | "coming_soon" | "hidden" = "hidden";
    const dayNumber = lesson.dayNumber || 1; // Default to 1 if not set

    if (daysSinceEnrollment >= dayNumber) {
      availabilityStatus = "available";
    } else {
      // Not available by drip, check for override
      const lessonIdAsNumber = parseInt(lesson.id, 10);
      if (!isNaN(lessonIdAsNumber)) {
        const hasOverride = await hasLessonAccessOverride(lessonIdAsNumber);
        if (hasOverride) {
          availabilityStatus = "available";
        }
      } else {
        console.warn(
          `Invalid lesson ID encountered during override check: ${lesson.id}`,
        );
      }

      // If still not 'available' (neither by drip nor override), check for 'coming_soon'
      if (
        availabilityStatus !== "available" &&
        dayNumber - daysSinceEnrollment === 1
      ) {
        availabilityStatus = "coming_soon";
      }
      // If none of the above, it remains 'hidden' by default
    }

    return {
      ...lesson,
      availabilityStatus,
      dayNumber, // ensure dayNumber is passed
    };
  });

  const processedLessonsWithOverrides = (
    await Promise.all(processedLessonsPromises)
  ).filter((lesson) => lesson.availabilityStatus !== "hidden");

  return (
    <div className="flex flex-col min-h-screen bg-purple-800 text-white">
      <main className="flex-grow relative">
        <BackgroundOverlay />
        <div className="relative z-10">
          <PageHeaderWithBackLink href="/home" linkText="Back to Courses" />
          <div className="container mx-auto px-4">
            {/* Course Header */}
            <div className="bg-white/90 rounded-lg p-6 mb-8 shadow-md h-full flex flex-col">
              <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
              <p className="text-lg text-black whitespace-pre-line">
                {course.description ?? "No description available."}
              </p>
            </div>

            {/* Lessons Grid */}
            <div className="mb-16">
              {enrollmentError && (
                <p className="text-sm text-red-500 mb-4">{enrollmentError}</p>
              )}
              {processedLessonsWithOverrides &&
              processedLessonsWithOverrides.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {processedLessonsWithOverrides.map((lesson) => (
                    <VideoCard
                      key={lesson.id}
                      id={String(lesson.id)} // Ensure id is string for VideoCard prop
                      lessonSlug={lesson.slug}
                      title={lesson.title}
                      thumbnailUrl={
                        lesson.thumbnailUrl
                          ? lesson.thumbnailUrl
                          : "https://placehold.co/400x200/slate/white?text=No+Image"
                      }
                      availabilityStatus={
                        lesson.availabilityStatus as "available" | "coming_soon"
                      } // Cast because filter removes 'hidden'
                      dayNumber={lesson.dayNumber}
                      daysSinceEnrollment={daysSinceEnrollment} // Pass for potential display in VideoCard
                    />
                  ))}
                </div>
              ) : (
                <p className="text-white text-lg opacity-70">
                  No lessons available for this course yet. Check back soon!
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
