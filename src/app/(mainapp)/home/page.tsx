// Mock data for courses
import CourseCard from "@/components/home/CourseCard";

const COURSES_DATA = [
  {
    id: "1",
    title: "Web Development Masterclass",
    description: "Learn modern web development with HTML, CSS, JavaScript, React, and more. Build responsive websites and interactive applications.",
    thumbnailUrl: "https://placehold.co/600x200/orange/white",
  },
  {
    id: "2",
    title: "UI/UX Design Fundamentals",
    description: "Master the principles of user interface and user experience design. From wireframing to prototyping, learn to create beautiful designs.",
    thumbnailUrl: "https://placehold.co/600x200/blue/white",
  },
  {
    id: "3",
    title: "Data Science Essentials",
    description: "Explore the world of data science with Python, pandas, machine learning, and visualization techniques for data-driven insights.",
    thumbnailUrl: "https://placehold.co/600x200/green/white",
  },
  {
    id: "4",
    title: "Digital Marketing Strategy",
    description: "Learn effective digital marketing strategies including SEO, social media marketing, content creation, and analytics.",
    thumbnailUrl: "https://placehold.co/600x200/purple/white",
  },
];
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-main">
      {/* <Navbar isScrolled={isScrolled} /> */}
      
      <main className="flex-grow">
        <div className="container mx-auto px-4">

          {/* All Courses */}
          <section className="">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {COURSES_DATA.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.description}
                  thumbnailUrl={course.thumbnailUrl}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
      
      {/* <Footer /> */}
    </div>
  );
}