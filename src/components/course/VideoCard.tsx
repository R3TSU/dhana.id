import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface VideoCardProps {
    id: string;
    title: string;
    thumbnailUrl: string;
    available: boolean;
    availableDate?: string;
  }
  
  const VideoCard = ({ id, title, thumbnailUrl, available, availableDate }: VideoCardProps) => {
  
    return (
      <div className={cn(
        "card group h-full flex flex-col",
        !available && "opacity-75"
      )}>
        <div className="relative overflow-hidden">
          <img 
            src={thumbnailUrl} 
            alt={title} 
            className={cn(
              "w-full h-40 object-cover transition-transform duration-300",
              available && "group-hover:scale-105",
              !available && "filter grayscale"
            )}
          />
          {available ? (
            <div className="absolute inset-0 bg-indigo/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-12 h-12 bg-coral rounded-full flex items-center justify-center">
                <Play size={20} className="text-white ml-1" />
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-charcoal/50 flex flex-col items-center justify-center">
              <div className="bg-indigo/90 px-4 py-2 rounded-md">
                <p className="text-white font-medium">Available {availableDate}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-lg font-medium mb-3 text-indigo group-hover:text-coral transition-colors">{title}</h3>
          
          {available ? (
            <Link href={`/lesson/${id}`}>
            <Button 
              className="bg-indigo hover:bg-coral text-white transition-colors mt-auto"
            >
              Watch Now <Play size={16} className="ml-2" />
            </Button>
            </Link>
          ) : (
            <Button 
              className="bg-gray-300 text-gray-600 cursor-not-allowed mt-auto"
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
  