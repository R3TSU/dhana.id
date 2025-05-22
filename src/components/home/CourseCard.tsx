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
    <div className="card group h-full flex flex-col">
      <div className="relative overflow-hidden">
        <img 
          src={thumbnailUrl} 
          alt={title} 
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-indigo/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-semibold mb-2 text-indigo group-hover:text-coral transition-colors">{title}</h3>
        <p className="text-charcoal/80 mb-4 flex-grow">
          {description.length > 100 ? `${description.substring(0, 97)}...` : description}
        </p>
        <Link href={`/course/${id}`}>
            <Button 
            className="bg-indigo hover:bg-coral text-white transition-colors w-full"
            >
            View Course <ArrowRight size={16} className="ml-2" />
            </Button>
        </Link>
      </div>
    </div>
  );
};

export default CourseCard;
