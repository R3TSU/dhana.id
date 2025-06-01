"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button"; // Assuming you have a Button component

interface PaginationControlsProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  baseUrl: string;
  currentFilters?: Record<string, string | undefined>;
}

export function PaginationControls({
  currentPage,
  totalCount,
  pageSize,
  baseUrl,
  currentFilters = {},
}: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname(); // Should be same as baseUrl if used correctly
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(totalCount / pageSize);

  if (totalPages <= 1) {
    return null;
  }

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("page", pageNumber.toString());

    // Preserve existing filters
    for (const [key, value] of Object.entries(currentFilters)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key); // Remove filter if value is undefined/null
      }
    }
    // Ensure 'page' is correctly set from currentFilters if it exists, otherwise from pageNumber
    // This logic for 'page' might be redundant if searchParams already contains the correct page from navigation
    // but ensures 'page' is explicitly managed if coming from currentFilters.
    if (currentFilters.page && pageNumber.toString() !== currentFilters.page) {
      params.set("page", pageNumber.toString());
    } else if (
      !currentFilters.page ||
      params.get("page") !== pageNumber.toString()
    ) {
      // if currentFilters doesn't have page, or if searchParams page is not the target pageNumber, set it.
      params.set("page", pageNumber.toString());
    }

    return `${baseUrl}?${params.toString()}`;
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      router.push(createPageURL(currentPage - 1));
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      router.push(createPageURL(currentPage + 1));
    }
  };

  // Simple Previous/Next buttons. Can be expanded to show page numbers.
  return (
    <div className="flex items-center justify-between mt-6 px-4 py-3 sm:px-6">
      <div className="flex-1 flex justify-between sm:hidden">
        <Button
          onClick={handlePrev}
          disabled={currentPage <= 1}
          variant="outline"
        >
          Previous
        </Button>
        <Button
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          variant="outline"
        >
          Next
        </Button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing page <span className="font-medium">{currentPage}</span> of{" "}
            <span className="font-medium">{totalPages}</span> pages (
            {totalCount} items)
          </p>
        </div>
        <div>
          <nav
            className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
            aria-label="Pagination"
          >
            <Button
              onClick={handlePrev}
              disabled={currentPage <= 1}
              variant="outline"
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              Previous
            </Button>
            {/* TODO: Add page number links here if desired */}
            <Button
              onClick={handleNext}
              disabled={currentPage >= totalPages}
              variant="outline"
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              Next
            </Button>
          </nav>
        </div>
      </div>
    </div>
  );
}
