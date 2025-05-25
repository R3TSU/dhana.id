import CourseCard from "@/components/home/CourseCard";
import { getPublicCourses, type PublicCourse } from "@/actions/admin/course.actions"; // Adjust path if action moved

export default async function Home() {
  const { data: coursesData, error } = await getPublicCourses();

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-main text-red-500 p-4 text-center">
        <h2 className="text-2xl font-semibold mb-2">Oops! Something went wrong.</h2>
        <p>We couldn't load the courses at the moment: {error}</p>
        <p>Please try refreshing the page or check back later.</p>
      </div>
    );
  }

  if (!coursesData || coursesData.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-main p-4 text-center">
        <h2 className="text-2xl font-semibold mb-2">No Courses Yet!</h2>
        <p>There are currently no courses available. Please check back soon!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-purple-800 text-white">
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-12"> {/* Added py-12 for vertical spacing */}
          <h1 className="text-4xl font-bold text-center text-white mb-10">Explore Our Courses</h1>
          <section className="">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"> {/* Increased gap */}
              {coursesData.map((course: PublicCourse) => (
                <CourseCard
                  key={course.id}
                  id={course.id} // Keep id for React key
                  slug={course.slug} // Pass slug for navigation
                  title={course.title}
                  description={course.description ?? "No description available."}
                  thumbnailUrl={course.thumbnailUrl ?? "https://placehold.co/600x200/slate/white?text=No+Image"} // Default placeholder
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}