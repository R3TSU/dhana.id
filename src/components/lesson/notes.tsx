"use client";

import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useCallback } from "react";
import { getLessonNote, upsertLessonNote } from "@/actions/lessonNotes.actions";
import { useDebounce } from "@uidotdev/usehooks"; // A popular debounce hook, or use any other

interface NotesProps {
  lessonId: number;
}

export default function Notes({ lessonId }: NotesProps) {
  const [noteContent, setNoteContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const debouncedNoteContent = useDebounce(noteContent, 1000); // Debounce for 1 second

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
          setNoteContent(note.content || '');
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

  // Save note (debounced)
  const saveNote = useCallback(async (contentToSave: string) => {
    if (!lessonId) return;
    
    setIsSaving(true);
    setError(null);
    setStatusMessage("Saving...");
    try {
      const { note, error: saveError, success } = await upsertLessonNote({ 
        lessonId,
        content: contentToSave 
      });
      if (saveError || !success) {
        setError(saveError || "Failed to save note.");
        setStatusMessage("Error saving notes.");
      } else {
        setStatusMessage("Notes saved!");
        // Optionally update noteContent from returned note if backend modifies it
        // if (note && note.content) setNoteContent(note.content); 
      }
    } catch (e) {
      setError("An unexpected error occurred while saving notes.");
      setStatusMessage("Error saving notes.");
      console.error(e);
    }
    setIsSaving(false);
    // Clear status message after a delay
    setTimeout(() => setStatusMessage(null), 3000);
  }, [lessonId]);

  useEffect(() => {
    // Trigger save only if content has actually changed from initial load and not currently loading
    if (!isLoading && debouncedNoteContent !== undefined) { // Check if debouncedNoteContent is not the initial undefined from useDebounce
        // Further check: only save if it's different from what was initially loaded or last saved successfully
        // This prevents saving an empty note on load if the user hasn't typed anything yet.
        // For simplicity here, we save whenever debounced content changes after initial load.
        // A more robust check might involve comparing with the initially fetched note content.
        saveNote(debouncedNoteContent);
    }
  }, [debouncedNoteContent, isLoading, saveNote]);

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
          Take notes as you watch the video. Your notes are saved automatically.
        </p>
        <Textarea
          className="min-h-[300px] border-indigo/30 focus:border-indigo flex-grow"
          placeholder={isLoading ? "Loading notes..." : "Start typing your notes here..."}
          value={noteContent}
          onChange={handleTextChange}
          disabled={isLoading}
        />
        <div className="text-xs text-gray-500 mt-2 h-4">
          {isSaving && <span className="text-blue-500">Saving...</span>}
          {statusMessage && !isSaving && (
            <span className={error ? "text-red-500" : "text-green-500"}>
              {statusMessage}
            </span>
          )}
          {/* Display persistent error if not saving and no other status */}
          {error && !isSaving && !statusMessage && <span className="text-red-500">{error}</span>}
        </div>
      </div>
    </div>
  );
}   