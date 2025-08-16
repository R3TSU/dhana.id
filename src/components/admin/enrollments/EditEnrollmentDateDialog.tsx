"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function EditEnrollmentDateDialog({
  open,
  onOpenChange,
  enrollmentId,
  currentDate,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enrollmentId: number;
  currentDate: Date;
  onSave: (
    enrollmentId: number,
    newDate: Date,
  ) => Promise<{ success: boolean; error?: string }>;
}) {
  const [date, setDate] = useState<Date>(currentDate);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!date) return;

    setIsSaving(true);
    setError(null);

    try {
      const result = await onSave(enrollmentId, date);

      if (result.success) {
        onOpenChange(false);
      } else {
        setError(result.error || "Failed to update date");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Error updating enrollment date:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Enrollment Date</DialogTitle>
          <DialogDescription>
            Update the enrollment date for this course.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="enrollmentDate" className="text-right">
              Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] pl-3 text-left font-normal",
                    !date && "text-muted-foreground",
                  )}
                >
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate: Date | undefined) =>
                    newDate && setDate(newDate)
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
