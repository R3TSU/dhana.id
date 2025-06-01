"use server";

import { db } from "@/db/drizzle";
import { lesson_notes, users } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type LessonNote = typeof lesson_notes.$inferSelect;

async function getInternalUserIdFromClerkId(
  clerkUserId: string,
): Promise<number | null> {
  if (!clerkUserId) return null;
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.clerk_user_id, clerkUserId),
      columns: { id: true },
    });
    return user ? user.id : null;
  } catch (error) {
    console.error("Error fetching internal user ID:", error);
    return null;
  }
}

export async function getLessonNote(lessonId: number): Promise<{
  note: LessonNote | null;
  error: string | null;
}> {
  const { userId } = await auth();

  if (!userId) {
    return { note: null, error: "User not authenticated." };
  }

  const internalUserId = await getInternalUserIdFromClerkId(userId);

  if (!internalUserId) {
    return { note: null, error: "User record not found." };
  }

  try {
    const note = await db.query.lesson_notes.findFirst({
      where: and(
        eq(lesson_notes.lessonId, lessonId),
        eq(lesson_notes.userId, internalUserId),
      ),
    });
    return { note: note || null, error: null };
  } catch (err) {
    console.error("Error fetching lesson note:", err);
    return { note: null, error: "Failed to fetch lesson note." };
  }
}

export async function upsertLessonNote(params: {
  lessonId: number;
  content: string;
}): Promise<{
  note: LessonNote | null;
  error: string | null;
  success: boolean;
}> {
  console.log("[upsertLessonNote] Starting with params:", {
    lessonId: params.lessonId,
    contentLength: params.content?.length || 0,
  });

  const { userId } = await auth();
  console.log("[upsertLessonNote] Clerk userId:", userId);

  if (!userId) {
    console.log("[upsertLessonNote] Error: User not authenticated");
    return { note: null, error: "User not authenticated.", success: false };
  }

  const internalUserId = await getInternalUserIdFromClerkId(userId);
  console.log("[upsertLessonNote] Internal userId:", internalUserId);

  if (!internalUserId) {
    console.log(
      "[upsertLessonNote] Error: User record not found for clerk ID",
      userId,
    );
    return { note: null, error: "User record not found.", success: false };
  }

  const { lessonId, content } = params;
  const trimmedContent = content?.trim() || "";

  // Validate content is not empty
  if (!trimmedContent) {
    console.log("[upsertLessonNote] Error: Empty content provided");
    return { note: null, error: "Cannot save empty notes.", success: false };
  }

  try {
    const existingNote = await db.query.lesson_notes.findFirst({
      where: and(
        eq(lesson_notes.lessonId, lessonId),
        eq(lesson_notes.userId, internalUserId),
      ),
    });

    if (existingNote) {
      const updatedNotes = await db
        .update(lesson_notes)
        .set({
          content: trimmedContent,
          updatedAt: new Date(),
        })
        .where(eq(lesson_notes.id, existingNote.id))
        .returning();

      console.log(
        "[upsertLessonNote] Update successful:",
        !!updatedNotes[0],
        updatedNotes[0]
          ? {
              noteId: updatedNotes[0].id,
              contentLength: updatedNotes[0].content?.length || 0,
            }
          : null,
      );

      // Revalidate the path to ensure UI updates
      revalidatePath(`/lesson/${lessonId}`);

      return { note: updatedNotes[0] || null, error: null, success: true };
    } else {
      const newNotes = await db
        .insert(lesson_notes)
        .values({
          userId: internalUserId,
          lessonId: lessonId,
          content: trimmedContent,
        })
        .returning();

      // Revalidate the path to ensure UI updates
      revalidatePath(`/lesson/${lessonId}`);

      return { note: newNotes[0] || null, error: null, success: true };
    }
  } catch (err) {
    console.error("Error upserting lesson note:", err);
    // Log more details about the error
    if (err instanceof Error) {
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);
    }
    return { note: null, error: "Failed to save lesson note.", success: false };
  }
}
