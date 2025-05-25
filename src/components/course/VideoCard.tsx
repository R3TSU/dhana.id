import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface VideoCardProps {
    id: string; // For React key
    lessonSlug: string; // For navigation
    title: string;
    thumbnailUrl: string;
    availabilityStatus: 'available' | 'coming_soon';
    dayNumber: number;
    daysSinceEnrollment: number; // For more detailed messaging if needed
  }
  
  const VideoCard = ({ id, lessonSlug, title, thumbnailUrl, availabilityStatus, dayNumber, daysSinceEnrollment }: VideoCardProps) => {
    const isAvailable = availabilityStatus === 'available';
  
    return (
      <div className={cn(
        "card group h-full flex flex-col bg-white shadow-lg rounded-lg overflow-hidden",
        !isAvailable && "opacity-80"
      )}>
        <div className="relative overflow-hidden">
          <img 
            src={thumbnailUrl} 
            alt={title} 
            className={cn(
              "w-full h-40 object-cover transition-transform duration-300",
              isAvailable && "group-hover:scale-105",
              !isAvailable && "filter grayscale"
            )}
          />
          {isAvailable ? (
            <Link href={`/lesson/${lessonSlug}`} className="absolute inset-0">
              <div className="absolute inset-0 bg-violet-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-12 h-12 bg-coral rounded-full flex items-center justify-center">
                  <Play size={20} className="text-white ml-1" />
                </div>
              </div>
            </Link>
          ) : (
            // Coming Soon state (availabilityStatus === 'coming_soon')
            <div className="absolute inset-0 bg-slate-700/70 flex flex-col items-center justify-center p-4 text-center">
              <div className="bg-slate-800/90 px-4 py-3 rounded-md shadow-xl">
                <p className="text-white font-semibold text-sm">Unlocks on Day {dayNumber}</p>
                {/* Optional: More detailed message like 'Available in X days' can be calculated using daysSinceEnrollment and dayNumber */}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 flex flex-col flex-grow">
          <h2 className="text-xl font-semibold text-orange-500">{title}</h2>
          {/* short desc if needed */}
          {/* <p className="text-gray-600 mt-2">
            {title}
          </p> */}
          {isAvailable ? (
            <Link href={`/lesson/${lessonSlug}`}>
            <Button 
              className="w-full bg-purple-600 text-white transition-colors mt-auto"
              // Link wrapper handles navigation
            >
              Watch Now <Play size={16} className="ml-2" />
            </Button>
            </Link>
          ) : (
            // Coming Soon state
            <Button 
              className="mt-auto w-full bg-slate-300 text-slate-500 cursor-not-allowed"
              disabled
            >
              Coming Soon
            </Button>
          )}
        </div>
      </div>
    );
  };
  
  export default VideoCard;
  