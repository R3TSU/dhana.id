// Mock data for courses
import { Separator } from "@/components/ui/separator";
import CourseCard from "@/components/home/CourseCard";

const COURSES_DATA = [
  {
    id: "1",
    title: "Web Development Masterclass",
    description: "Learn modern web development with HTML, CSS, JavaScript, React, and more. Build responsive websites and interactive applications.",
    thumbnailUrl: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&q=80",
  },
  {
    id: "2",
    title: "UI/UX Design Fundamentals",
    description: "Master the principles of user interface and user experience design. From wireframing to prototyping, learn to create beautiful designs.",
    thumbnailUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80",
  },
  {
    id: "3",
    title: "Data Science Essentials",
    description: "Explore the world of data science with Python, pandas, machine learning, and visualization techniques for data-driven insights.",
    thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80",
  },
  {
    id: "4",
    title: "Digital Marketing Strategy",
    description: "Learn effective digital marketing strategies including SEO, social media marketing, content creation, and analytics.",
    thumbnailUrl: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&q=80",
  },
];
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      {/* <Navbar isScrolled={isScrolled} /> */}
      
      <main className="flex-grow pt-24">
        <div className="container mx-auto px-4">
          {/* Welcome Section */}
          <section className="mb-12">
            <h1 className="text-4xl font-bold text-indigo mb-2">
              {/* Welcome back, {user?.firstName || 'Student'}! */}
              Welcome back, Student!
            </h1>
            <p className="text-lg text-charcoal/80">
              Continue your learning journey with these courses.
            </p>
          </section>
          
          <Separator className="mb-12" />
          
          {/* Featured Courses */}
          <section className="mb-16">
            <h2 className="text-2xl font-semibold text-indigo mb-6">
              Featured Courses
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {COURSES_DATA.slice(0, 3).map((course) => (
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
          
          {/* All Courses */}
          <section className="mb-16">
            <h2 className="text-2xl font-semibold text-indigo mb-6">
              All Courses
            </h2>
            
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