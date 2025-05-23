'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface DeleteCourseButtonProps {
  courseId: number;
}

export function DeleteCourseButton({ courseId }: DeleteCourseButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    // Ask for confirmation
    const confirmed = window.confirm('Are you sure you want to delete this course? This action cannot be undone.');
    
    if (!confirmed) {
      return; // User cancelled the action
    }
    
    setIsDeleting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete course');
      }
      
      // Refresh the page to show updated course list
      router.refresh();
    } catch (err) {
      console.error('Error deleting course:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <>
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? 'Deleting...' : 'Delete'}
      </Button>
      {error && (
        <div className="text-red-500 text-xs mt-1">{error}</div>
      )}
    </>
  );
}
