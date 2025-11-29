import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "./db/drizzle";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

// Define routes that require a completed profile.
// These routes inherently also require authentication.
// Define routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/home(.*)",
  "/course(.*)", // Protects /course/* unless it contains 'preview'
  "/lesson/(.*)", // Full lessons are protected
  "/profile(.*)", // User's own profile page (not /complete-profile)
  "/admin(.*)", // All admin pages
]);

const isAdminRoute = createRouteMatcher([
  "/admin(.*)", // All admin pages
]);

// Define routes that require a completed profile (these also imply authentication)
const routesRequiringCompletedProfile = createRouteMatcher([
  "/home(.*)",
  "/course(.*)",
  "/lesson/(.*)", // Full lessons require completed profile
  "/profile(.*)",
]);

// Public routes (e.g., '/lesson-previews/(.*)') are those not matched by isProtectedRoute.

export default clerkMiddleware(
  async (auth, req) => {
    const { userId, redirectToSignIn } = await auth(); // Use await auth() here

    // Step 1: Handle unauthenticated users trying to access protected routes
    if (!userId && isProtectedRoute(req)) {
      const pathname = req.nextUrl.pathname;

      // If unauthenticated user tries to access a full lesson page, redirect to its preview
      if (pathname.startsWith("/lesson/")) {
        const slug = pathname.substring("/lesson/".length);
        if (slug) {
          const previewUrl = new URL(
            `/lesson-previews/${slug}`,
            req.nextUrl.origin,
          );
          console.log(
            `Unauthenticated user accessing lesson ${slug}. Redirecting to preview: ${previewUrl.toString()}`,
          );
          return NextResponse.redirect(previewUrl);
        }
        // If slug is somehow empty (e.g., /lesson/), fall through to general sign-in redirect
      }

      // For other protected routes, redirect to sign-in
      console.log(
        `User not authenticated for protected route: ${pathname}. Redirecting to sign-in.`,
      );
      return redirectToSignIn({ returnBackUrl: req.url });
    }

    // Step 2: Handle authenticated users
    if (userId) {
      // User is authenticated, fetch their profile data
      const internalUser = await db.query.users.findFirst({
        where: eq(users.clerk_user_id, userId),
        columns: { fullName: true, role: true },
      });

      // Step 3: Handle admin routes - check if user has admin role
      if (isAdminRoute(req)) {
        if (internalUser?.role !== "admin") {
          console.log(
            `Non-admin user attempted to access admin route: ${req.nextUrl.pathname}. Redirecting to /home.`,
          );
          const homeUrl = new URL("/home", req.url);
          return NextResponse.redirect(homeUrl);
        }
        // User is admin, allow access to admin routes
        return NextResponse.next();
      }

      // Step 4: Handle routes requiring completed profile
      if (routesRequiringCompletedProfile(req)) {
        // If profile is not complete (no internal record or no fullName)
        if (!internalUser || !internalUser.fullName) {
          // Prevent redirect loop if already on /complete-profile
          if (req.nextUrl.pathname !== "/complete-profile") {
            console.log(
              `User profile not complete for: ${req.nextUrl.pathname}. Redirecting to /complete-profile.`,
            );
            const completeProfileUrl = new URL("/complete-profile", req.url);
            return NextResponse.redirect(completeProfileUrl);
          }
        }
      }
    }

    // If none of the above conditions caused a redirect, proceed to the requested route.
    // Caching is handled by vercel.json based on URL patterns.
    return NextResponse.next();
  },
  { debug: false },
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
