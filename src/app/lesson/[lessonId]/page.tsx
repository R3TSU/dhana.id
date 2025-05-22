import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from 'next/link'
import Notes from "@/components/lesson/notes";
import ShareButton from "@/components/lesson/ShareButton";
import VideoPlayer from "./VideoPlayer";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>
}) {
  const { lessonId } = await params
    
    return (
      <div className="min-h-screen flex flex-col bg-ivory">
        {/* <Navbar isScrolled={isScrolled} /> */}
        
        <main className="flex-grow pt-24">
          <div className="container mx-auto px-4">
            {/* Back button */}
            <Link href={`/course/${lessonId}`}>
              <Button 
                variant="ghost" 
                className="mb-6 text-indigo hover:text-coral hover:bg-transparent p-0"
              >
                <ArrowLeft size={16} className="mr-2" /> Back to Course
              </Button>
            </Link>
            
            {/* Video Player */}
            <div className="mb-8 bg-black rounded-lg overflow-hidden shadow-xl">
              <VideoPlayer />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Video Content */}
              <div className="lg:col-span-2">
                {/* Video Title and Description */}
                <div className="bg-white rounded-lg p-6 shadow-md mb-6">
                  <h1 className="text-3xl font-bold text-indigo mb-4">{lessonId}</h1>
                  <div className="text-charcoal/80 whitespace-pre-line">
                    {lessonId}
                  </div>
                  
                  {/* Share Buttons */}
                  <ShareButton lessonId={lessonId} />
                </div>
              </div>
              
              {/* Notes Section */}
              <Notes />
            </div>
          </div>
        </main>
        
        {/* <Footer /> */}
      </div>
    );
}