import { getCurrentInternalUser } from "@/actions/user.actions";
import CompleteProfileForm from "@/components/auth/CompleteProfileForm";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function CompleteProfilePage() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    // This case should ideally be handled by your Clerk middleware
    // redirecting unauthenticated users to sign-in.
    // Adding a safeguard here.
    redirect("/sign-in");
  }

  const internalUser = await getCurrentInternalUser();

  // If the user's internal record exists and they already have a full name,
  // they don't need to complete the profile again.
  if (internalUser && internalUser.fullName) {
    redirect("/home");
  }

  // Prepare initial data for the form, like the user's email.
  const initialData = {
    email:
      clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId,
      )?.emailAddress || "",
    // We don't pre-fill fullName as that's what we're asking for.
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-main p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-xl rounded-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">
            Complete Your Profile
          </h1>
          <p className="mt-2 text-gray-600">
            Welcome, {initialData.email || "User"}! Please tell us a bit more
            about yourself.
          </p>
        </div>
        {/* The CompleteProfileForm will handle the actual form submission */}
        <CompleteProfileForm initialEmail={initialData.email} />
      </div>
    </div>
  );
}
