"use server";

import { db } from "@/db/drizzle";
import { lesson_notes, users } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type LessonNote = typeof lesson_notes.$inferSelect;

async function getInternalUserIdFromClerkId(clerkUserId: string): Promise<number | null> {
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
        eq(lesson_notes.userId, internalUserId)
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
  success: boolean 
}> {
  const { userId } = await auth();

  if (!userId) {
    return { note: null, error: "User not authenticated.", success: false };
  }
  
  const internalUserId = await getInternalUserIdFromClerkId(userId);

  if (!internalUserId) {
    return { note: null, error: "User record not found.", success: false };
  }

  const { lessonId, content } = params;

  try {
    const existingNote = await db.query.lesson_notes.findFirst({
      where: and(
        eq(lesson_notes.lessonId, lessonId),
        eq(lesson_notes.userId, internalUserId)
      ),
    });

    if (existingNote) {
      const updatedNotes = await db
        .update(lesson_notes)
        .set({
          content: content,
          updatedAt: new Date(),
        })
        .where(eq(lesson_notes.id, existingNote.id))
        .returning();
      return { note: updatedNotes[0] || null, error: null, success: true };
    } else {
      const newNotes = await db
        .insert(lesson_notes)
        .values({
          userId: internalUserId,
          lessonId: lessonId,
          content: content,
        })
        .returning();
      // revalidatePath(`/lesson/${lessonId}`); // Potentially revalidate
      return { note: newNotes[0] || null, error: null, success: true };
    }
  } catch (err) {
    console.error("Error upserting lesson note:", err);
    return { note: null, error: "Failed to save lesson note.", success: false };
  }
}
