"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button"; // Added Button
import { useState, useEffect, useCallback, useRef } from "react";
import { getLessonNote, upsertLessonNote } from "@/actions/lessonNotes.actions";
import { useAnalytics } from "@/components/AnalyticsContext";

interface NotesProps {
  lessonId: number;
  lessonTitle?: string;
  hasWorkbook?: boolean;
}

export default function Notes({
  lessonId,
  lessonTitle = "Lesson",
  hasWorkbook = false,
}: NotesProps) {
  const [noteContent, setNoteContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const { trackEvent } = useAnalytics();

  // Track if this is the first save (note creation) or an update
  const initialNoteRef = useRef<string | null>(null);
  const lastSaveTimeRef = useRef<Date | null>(null);

  // Fetch initial note
  useEffect(() => {
    if (!lessonId) return;

    const fetchNote = async () => {
      setIsLoading(true);
      setError(null);
      setStatusMessage(null);
      try {
        const { note, error: fetchError } = await getLessonNote(lessonId);
        if (fetchError) {
          setError(fetchError);
          setStatusMessage("Error loading notes.");
        } else if (note) {
          setNoteContent(note.content || "");
          initialNoteRef.current = note.content || "";
        } else {
          // No existing note found
          initialNoteRef.current = null;
        }
      } catch (e) {
        setError("An unexpected error occurred while fetching notes.");
        setStatusMessage("Error loading notes.");
        console.error(e);
      }
      setIsLoading(false);
    };

    fetchNote();
  }, [lessonId]);

  // Save note
  const handleSaveNote = useCallback(async () => {
    const contentToSave = noteContent.trim(); // Trim whitespace
    console.log(
      "[Notes] Attempting to save note with content length:",
      contentToSave.length,
    );

    if (!lessonId) {
      console.log("[Notes] Error: No lessonId provided");
      return;
    }

    // Validate that content is not empty
    if (!contentToSave) {
      setError("Cannot save empty notes. Please add some content.");
      setStatusMessage("Error: Empty notes");
      console.log("[Notes] Error: Attempted to save empty note");
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    setIsSaving(true);
    setError(null);
    setStatusMessage("Saving...");
    try {
      console.log("[Notes] Calling upsertLessonNote with:", {
        lessonId,
        contentLength: contentToSave.length,
      });

      const {
        note,
        error: saveError,
        success,
      } = await upsertLessonNote({
        lessonId,
        content: contentToSave,
      });

      console.log("[Notes] Save result:", {
        success,
        hasError: !!saveError,
        noteId: note?.id,
      });

      if (saveError || !success) {
        setError(saveError || "Failed to save note.");
        setStatusMessage("Error saving notes.");
      } else {
        setStatusMessage("Notes saved!");

        // Track note creation or update event
        const isFirstSave = initialNoteRef.current === null;
        const timeSinceLastUpdate = lastSaveTimeRef.current
          ? (new Date().getTime() - lastSaveTimeRef.current.getTime()) / 1000
          : 0;

        if (isFirstSave) {
          // This is a new note being created
          trackEvent("note_created", {
            lesson_id: lessonId,
            lesson_title: lessonTitle,
            note_length: contentToSave.length,
            has_workbook: hasWorkbook,
          });
          initialNoteRef.current = contentToSave; // No longer a first save
        } else {
          // This is an update to an existing note
          trackEvent("note_updated", {
            lesson_id: lessonId,
            lesson_title: lessonTitle,
            note_length: contentToSave.length,
            time_since_last_update: timeSinceLastUpdate,
            has_workbook: hasWorkbook,
          });
        }

        lastSaveTimeRef.current = new Date();
        // Optionally update noteContent from returned note if backend modifies it
        // if (note && note.content) setNoteContent(note.content);
      }
    } catch (e) {
      setError("An unexpected error occurred while saving notes.");
      setStatusMessage("Error saving notes.");
      console.error("[Notes] Exception during save:", e);
    }
    setIsSaving(false);
    // Clear status message after a delay
    setTimeout(() => setStatusMessage(null), 3000);
  }, [lessonId, noteContent, trackEvent, lessonTitle, hasWorkbook]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNoteContent(e.target.value);
    setStatusMessage(null); // Clear status on new input
    setError(null); // Clear error on new input
  };

  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-lg p-6 shadow-md h-full flex flex-col">
        <h3 className="text-xl font-semibold text-indigo mb-2">My Journal</h3>
        <p className="text-charcoal/80 text-sm mb-4">
          Take notes as you watch the video. Click the button below to save your
          notes.
        </p>
        <Textarea
          className="min-h-[300px] border-indigo/30 focus:border-indigo text-black flex-grow"
          placeholder={
            isLoading ? "Loading notes..." : "Start typing your notes here..."
          }
          value={noteContent}
          onChange={handleTextChange}
          disabled={isLoading}
        />
        <div className="mt-4 flex justify-between items-center">
          <Button onClick={handleSaveNote} disabled={isLoading || isSaving}>
            {isSaving ? "Saving..." : "Save Notes"}
          </Button>
          <div className="text-xs text-gray-500 h-4 flex-grow text-right">
            {isSaving && <span className="text-blue-500">Saving...</span>}
            {statusMessage && !isSaving && (
              <span className={error ? "text-red-500" : "text-green-500"}>
                {statusMessage}
              </span>
            )}
            {/* Display persistent error if not saving and no other status */}
            {error && !isSaving && !statusMessage && (
              <span className="text-red-500">{error}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
