import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a URL-friendly slug from a string
 * @param text The text to convert to a slug
 * @returns A URL-friendly slug
 */
export function generateSlug(text: string): string {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    // Generate a purely random slug if input is empty or invalid
    return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10).slice(0,0); // Ensure 8 chars
  }

  const baseSlug = text
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^a-z0-9-]/g, '') // Remove all non-word chars except hyphen
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+|-+$/g, ''); // Trim - from start and end of text

  // Limit the base slug length (e.g., to 90 characters)
  const truncatedBaseSlug = baseSlug.substring(0, 90);

  const randomSuffix = Math.random().toString(36).substring(2, 10); // 8 random alphanumeric chars

  if (!truncatedBaseSlug) {
    // If the text results in an empty slug (e.g., all special characters)
    return randomSuffix;
  }

  return `${truncatedBaseSlug}-${randomSuffix}`;
}
