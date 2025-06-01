"use client";

import { BookOpen, Library, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProgressBarLink } from "./progress-bar";

const MobileMenu = () => {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      icon: BookOpen,
      label: "Home",
      path: "/home",
    },
    {
      icon: Library,
      label: "Library",
      path: "/library",
      disabled: true,
    },
    {
      icon: User,
      label: "Profile",
      path: "/profile", // This would ideally link to a user profile page
    },
  ];

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-gray-800">
      <nav className="grid grid-cols-3 items-center">
        {menuItems.map((item) =>
          item.disabled ? (
            <Popover key={item.label}>
              <PopoverTrigger asChild>
                <Button
                  className={cn(
                    "flex flex-col items-center justify-center px-6 py-6 w-full bg-gray-800 hover:bg-gray-700",
                    isActive(item.path)
                      ? "text-purple-400 opacity-70"
                      : "text-white opacity-70",
                  )}
                >
                  <item.icon size={20} />
                  <span className="text-xs mt-1">{item.label}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 text-center bg-gray-800 border-gray-700 text-white">
                <p className="py-2">Coming Soon!</p>
              </PopoverContent>
            </Popover>
          ) : (
            <ProgressBarLink key={item.label} href={item.path}>
              <Button
                className={cn(
                  "flex flex-col items-center justify-center px-6 py-6 w-full cursor-pointer bg-gray-800 hover:bg-gray-700",
                  isActive(item.path) ? "text-purple-400" : "text-white",
                )}
              >
                <item.icon size={20} />
                <span className="text-xs mt-1">{item.label}</span>
              </Button>
            </ProgressBarLink>
          ),
        )}
      </nav>
    </footer>
  );
};

export default MobileMenu;
