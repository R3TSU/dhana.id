import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import VideoCard from "@/components/course/VideoCard";

type Props = {
    params: {
        courseId: string;
    };
};

// Mock data for videos
const COURSES = {
"1": {
    id: "1",
    title: "Web Development Masterclass",
    description: "Learn modern web development with HTML, CSS, JavaScript, React, and more. Build responsive websites and interactive applications.",
    videos: [
    {
        id: "101",
        title: "Introduction to HTML",
        thumbnailUrl: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80",
        available: true
    },
    {
        id: "102",
        title: "CSS Fundamentals",
        thumbnailUrl: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&q=80",
        available: true
    },
    {
        id: "103",
        title: "JavaScript Basics",
        thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80",
        available: true
    },
    {
        id: "104",
        title: "Responsive Design",
        thumbnailUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80",
        available: false,
        availableDate: "Tomorrow"
    }
    ]
},
"2": {
    id: "2",
    title: "UI/UX Design Fundamentals",
    description: "Master the principles of user interface and user experience design. From wireframing to prototyping, learn to create beautiful designs.",
    videos: [
    {
        id: "201",
        title: "Design Principles",
        thumbnailUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80",
        available: true
    },
    {
        id: "202",
        title: "User Research",
        thumbnailUrl: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&q=80",
        available: true
    },
    {
        id: "203",
        title: "Prototyping Tools",
        thumbnailUrl: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80",
        available: false,
        availableDate: "in 2 days"
    }
    ]
}
};

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params;
    const course = courseId ? COURSES[courseId as keyof typeof COURSES] : null;

    return (
        <div className="min-h-screen flex flex-col bg-ivory">
          {/* <Navbar isScrolled={isScrolled} /> */}
          
          <main className="flex-grow pt-24">
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
                <h1 className="text-3xl font-bold text-indigo mb-2">{course?.title}</h1>
                <p className="text-lg text-charcoal/80">{course?.description}</p>
              </div>
              
              {/* Videos Grid */}
              <div className="mb-16">
                <h2 className="text-2xl font-semibold text-indigo mb-6">Course Content</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {course?.videos.map((video) => (
                    <VideoCard
                      key={video.id}
                      id={video.id}
                      title={video.title}
                      thumbnailUrl={video.thumbnailUrl}
                      available={video.available}
                      availableDate={video.availableDate}
                    />
                  ))}
                </div>
              </div>
            </div>
          </main>
          
        </div>
      );
}