import Link from "next/link";
import Image from "next/image";
import { ProgressBarLink } from "@/components/progress-bar";

interface CourseCardProps {
  id: string; // Keep id for React key or other non-navigation purposes
  slug: string; // Add slug for navigation
  title: string;
  subtitle?: string | null;
  description: string;
  thumbnailUrl: string;
  isActive?: boolean;
  startDate?: Date | null;
}

const CourseCard = ({
  id,
  slug,
  title,
  subtitle,
  description,
  thumbnailUrl,
  isActive = true,
  startDate = null,
}: CourseCardProps) => {
  // Check if course is available based on start date
  const now = new Date();
  const isAvailable = isActive && (!startDate || new Date(startDate) <= now);

  // Format date for display if needed
  const formattedStartDate = startDate
    ? new Date(startDate).toLocaleDateString()
    : null;

  return (
    <div
      className={`card group h-full flex mb-8 flex-col ${isAvailable ? "cursor-pointer transform transition-all duration-300 hover:scale-105" : "cursor-not-allowed"} bg-transparent`}
    >
      <div className="relative w-full h-full overflow-hidden rounded-lg bg-transparent border-2 border-white flex flex-col">
        {isAvailable ? (
          <ProgressBarLink href={`/course/${slug}`} className="block">
            <div className="bg-black/70 aspect-[4/3]">
              <Image
                src={thumbnailUrl}
                alt="Click here to start your program"
                width={500}
                height={375}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundColor: "transparent" }}
              />
            </div>
            <div className="p-4 bg-white/70 flex flex-col flex-grow min-h-[180px]">
              <h2 className="text-xl font-semibold text-purple-800 line-clamp-2">
                {title}
              </h2>
              {subtitle && (
                <p className="text-gray-600 mt-2 line-clamp-3">{subtitle}</p>
              )}
              <div className="flex-grow"></div>
            </div>
          </ProgressBarLink>
        ) : (
          <div className="block">
            <div className="bg-black/70 aspect-[4/3]">
              <Image
                src={thumbnailUrl}
                alt="Program coming soon"
                width={500}
                height={375}
                className="w-full h-full object-cover opacity-70"
                style={{ backgroundColor: "transparent" }}
              />
            </div>
            <div className="p-4 bg-white/70 flex flex-col flex-grow min-h-[180px]">
              <h2 className="text-xl font-semibold text-purple-800 line-clamp-2">
                {title}
              </h2>
              <p className="text-gray-600 mt-2 line-clamp-3">{description}</p>
              <div className="flex-grow"></div>
            </div>
          </div>
        )}

        {/* Gray overlay for unavailable courses */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-gray-800/70 flex items-center justify-center">
            <div className="text-center p-4"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCard;
