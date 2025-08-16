"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EditEnrollmentDateDialog } from "@/components/admin/enrollments/EditEnrollmentDateDialog";
import { useRouter } from "next/navigation";

export default function EnrollmentRowActions({
  enrollmentId,
  currentDateIso,
}: {
  enrollmentId: number;
  currentDateIso: string;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleSave = async (
    id: number,
    newDate: Date,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/admin/enrollments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentDate: newDate.toISOString() }),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        router.refresh();
        return { success: true };
      }
      return { success: false, error: json.error || "Failed to update" };
    } catch (e) {
      console.error(e);
      return { success: false, error: "Unexpected error" };
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this enrollment? This cannot be undone.",
      )
    ) {
      return;
    }
    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (!json.success) {
        alert(json.error || "Failed to delete enrollment");
      } else {
        router.refresh();
      }
    } catch (e) {
      console.error(e);
      alert("Unexpected error while deleting");
    } finally {
      setDeleting(false);
    }
  };

  const currentDate = new Date(currentDateIso);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Edit
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={deleting}
      >
        {deleting ? "Deleting..." : "Delete"}
      </Button>
      <EditEnrollmentDateDialog
        open={open}
        onOpenChange={setOpen}
        enrollmentId={enrollmentId}
        currentDate={currentDate}
        onSave={handleSave}
      />
    </div>
  );
}
