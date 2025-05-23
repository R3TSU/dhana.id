import Link from "next/link";
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
}

const CourseCard = ({ id, title, description, thumbnailUrl }: CourseCardProps) => {
  return (
    <div 
      className="card group h-full flex mb-8 flex-col cursor-pointer transform transition-all duration-300 hover:scale-105"
    >
      <div className="relative w-full h-full overflow-hidden rounded-lg">
        <Link href={`/course/${id}`}>
        <img 
          src={thumbnailUrl} 
          alt="Course thumbnail" 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/90 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300"></div>
        </Link>
      </div>
    </div>
  );
};

export default CourseCard;
