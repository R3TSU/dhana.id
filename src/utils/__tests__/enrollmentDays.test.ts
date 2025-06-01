// src/utils/__tests__/enrollmentDays.test.ts
import { calculateDaysSinceEnrollment } from '../enrollmentDays';
import { jest } from '@jest/globals';

describe('calculateDaysSinceEnrollment', () => {
  // Mock the current date for consistent testing
  const mockDate = new Date('2025-06-01T10:00:00Z'); // 17:00 UTC+7

  beforeAll(() => {
    // Mock the current date
    jest.useFakeTimers().setSystemTime(mockDate);
  });

  afterAll(() => {
    // Restore the original timer
    jest.useRealTimers();
  });

  it('should return 1 when checking on the same day', () => {
    const enrollDate = '2025-06-01T01:00:00Z'; // 08:00 UTC+7
    expect(calculateDaysSinceEnrollment(enrollDate)).toBe(1);
  });

  it('should return 2 when checking the next day', () => {
    const enrollDate = '2025-05-30T17:00:00Z'; // This is May 31st, 00:00 UTC+7 (enrollment day)
    expect(calculateDaysSinceEnrollment(enrollDate)).toBe(2);
  });

  it('should handle month boundary correctly', () => {
    const enrollDate = '2025-05-30T16:00:00Z'; // 23:00 UTC+7
    expect(calculateDaysSinceEnrollment(enrollDate)).toBe(3);
  });

  it('should handle UTC midnight edge case', () => {
    const enrollDate = '2025-05-31T16:01:00Z'; // 23:01 UTC+7
    expect(calculateDaysSinceEnrollment(enrollDate)).toBe(2);
  });

  it('should handle leap year correctly', () => {
    // Mock date to be in a leap year
    jest.setSystemTime(new Date('2024-03-01T10:00:00Z'));
    const enrollDate = '2024-02-28T16:00:00Z'; // 23:00 UTC+7
    expect(calculateDaysSinceEnrollment(enrollDate)).toBe(3);
  });

  it('should handle DST transition', () => {
    // This test might need adjustment based on actual DST dates
    jest.setSystemTime(new Date('2025-03-30T10:00:00Z'));
    const enrollDate = '2025-03-29T16:00:00Z';
    expect(calculateDaysSinceEnrollment(enrollDate)).toBe(2);
  });
});