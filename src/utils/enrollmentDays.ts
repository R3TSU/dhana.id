// src/utils/enrollmentDays.ts
export function calculateDaysSinceEnrollment(
  enrollmentDate: Date | string,
  currentDate: Date = new Date()
): number {
  // Convert to Date objects if strings are provided
  const enrollDate = new Date(enrollmentDate);
  const now = new Date(currentDate);
  
  // Convert to UTC+7 by adding 7 hours
  const nowUTC7 = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  const enrollDateUTC7 = new Date(enrollDate.getTime() + (7 * 60 * 60 * 1000));
  
  // Set to start of day in UTC+7
  const todayUTC7 = new Date(Date.UTC(
    nowUTC7.getUTCFullYear(),
    nowUTC7.getUTCMonth(),
    nowUTC7.getUTCDate()
  ));
  
  const enrollDateStart = new Date(Date.UTC(
    enrollDateUTC7.getUTCFullYear(),
    enrollDateUTC7.getUTCMonth(),
    enrollDateUTC7.getUTCDate()
  ));
  
  // Calculate difference in days
  const diffTime = todayUTC7.getTime() - enrollDateStart.getTime();
  return Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);
}