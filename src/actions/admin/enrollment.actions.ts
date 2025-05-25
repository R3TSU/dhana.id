"use server";

import { db } from "@/db/drizzle";
import { users, courses, course_enrollments } from "@/db/schema";
import { eq, desc, count, asc } from "drizzle-orm";

export type AdminEnrollmentView = {
  enrollmentId: number;
  userId: number;
  userName: string | null;
  courseId: number;
  courseName: string;
  enrollmentDate: Date;
};

export async function getEnrollmentsForAdminView({
  courseIdFilter,
  page = 1,
  pageSize = 20,
}: {
  courseIdFilter?: number;
  page?: number;
  pageSize?: number;
}): Promise<{
  data: AdminEnrollmentView[];
  totalCount: number;
  error: string | null;
}> {
  try {
    // Base query for data
    let queryBuilder = db
      .select({
        enrollmentId: course_enrollments.id,
        userId: users.id,
        userName: users.fullName,
        courseId: courses.id,
        courseName: courses.title,
        enrollmentDate: course_enrollments.enrollmentDate,
      })
      .from(course_enrollments)
      .innerJoin(users, eq(course_enrollments.userId, users.id))
      .innerJoin(courses, eq(course_enrollments.courseId, courses.id));

    // Base query for count
    let countQueryBuilder = db
      .select({ value: count() })
      .from(course_enrollments);

    // Apply filter if present
    if (courseIdFilter) {
      // @ts-ignore Drizzle's dynamic query builder type can be tricky for TS here
      queryBuilder = queryBuilder.where(eq(course_enrollments.courseId, courseIdFilter));
      // @ts-ignore
      countQueryBuilder = countQueryBuilder.where(eq(course_enrollments.courseId, courseIdFilter));
    }
    
    // Finalize data query with ordering and pagination
    const data = await queryBuilder
      .orderBy(desc(course_enrollments.enrollmentDate))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // Finalize and execute count query
    const totalResult = await countQueryBuilder;
    const totalCount = totalResult[0]?.value || 0;

    return { data, totalCount, error: null };
  } catch (error) {
    console.error("Error fetching enrollments for admin view:", error);
    return { data: [], totalCount: 0, error: "Failed to fetch enrollments." };
  }
}

export async function getCoursesForAdminFilter(): Promise<{
  data: { id: number; title: string }[];
  error: string | null;
}> {
  try {
    const courseList = await db
      .select({
        id: courses.id,
        title: courses.title,
      })
      .from(courses)
      .orderBy(asc(courses.title));
    return { data: courseList, error: null };
  } catch (error) {
    console.error("Error fetching courses for admin filter:", error);
    return { data: [], error: "Failed to fetch courses." };
  }
}
