"use client";

import { deleteUser } from "@/actions/admin/user.actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteUserFormProps {
  userId: number;
}

export default function DeleteUserForm({ userId }: DeleteUserFormProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  // Using Sonner toast directly
  const router = useRouter();

  async function handleDelete() {
    setIsDeleting(true);

    try {
      const result = await deleteUser(userId);

      if (result.success) {
        toast.success(result.message || "User deleted successfully");
        router.push("/admin/users");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete user");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex justify-end gap-4 mt-8">
      <Button
        type="button"
        variant="outline"
        onClick={() => router.push("/admin/users")}
        disabled={isDeleting}
      >
        Cancel
      </Button>
      <Button 
        type="button" 
        variant="destructive" 
        onClick={handleDelete} 
        disabled={isDeleting}
        className="bg-red-600 hover:bg-red-700"
      >
        {isDeleting ? "Deleting..." : "Confirm Delete"}
      </Button>
    </div>
  );
}
