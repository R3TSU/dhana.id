import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from './db/drizzle'; 
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

// Define routes that require a completed profile.
// These routes inherently also require authentication.
const routesRequiringCompletedProfile = createRouteMatcher([
  '/home(.*)',
  '/course(.*)', // Example: allow /course/public-preview/*, protect others
  '/lesson(.*)', // Assuming all lessons need completed profile
  '/profile(.*)', // User's own profile page (not /complete-profile)
]);
const isProtectedRoute = createRouteMatcher([
  '/public-preview(.*)',
  '/home(.*)',
  '/course(.*)', // Example: allow /course/public-preview/*, protect others
  '/lesson(.*)', // Assuming all lessons need completed profile
  '/profile(.*)', // User's own profile page (not /complete-profile)
  '/admin(.*)', // All admin pages
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth();

    // Step 1: Ensure user is authenticated. 
    // If no userId, protect() will handle redirection to sign-in.
    if (!userId && isProtectedRoute(req)) {
      // Add custom logic to run before redirecting
      console.log("User is not authenticated and is trying to access a protected route.");
      return redirectToSignIn();
    }

  // If the current route requires a completed profile:
  if (routesRequiringCompletedProfile(req)) {
    // Step 2.1: User MUST be authenticated to access these routes.
    // If userId is null here, it means they weren't caught by the general isProtectedRoute check,
    // or this route isn't in isProtectedRoute but *does* require a completed profile (which implies auth).
    if (!userId) {
      // Redirect to sign-in if not authenticated.
      return redirectToSignIn({ returnBackUrl: req.url });
    }

    // Now TypeScript knows userId is a string.
    // Step 2.2: User is authenticated (userId exists). Check for profile completion.
    const internalUser = await db.query.users.findFirst({
      where: eq(users.clerk_user_id, userId),
      columns: { fullName: true } // Only fetch fullName, it's all we need for the check
    });

    // If profile is not complete (no internal record or no fullName)
    if (!internalUser || !internalUser.fullName) {
      const completeProfileUrl = new URL('/complete-profile', req.url);
      // Important: Ensure we are not already on /complete-profile to prevent redirect loops,
      // though /complete-profile should NOT be in routesRequiringCompletedProfile.
      if (req.nextUrl.pathname !== '/complete-profile') {
        return NextResponse.redirect(completeProfileUrl);
      }
    }

    // Step 3: If profile is complete
  }
}, { debug: false });

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
