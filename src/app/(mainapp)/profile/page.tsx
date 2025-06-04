import { getCurrentInternalUser } from "@/actions/user.actions";
import EditProfileForm from "@/components/profile/EditProfileForm";
import { redirect } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BackgroundOverlay from "@/components/layout/BackgroundOverlay";

export default async function ProfilePage() {
  const internalUser = await getCurrentInternalUser();

  if (!internalUser) {
    // This should ideally be caught by middleware for unauthenticated users,
    // but as a safeguard, redirect if no internal user record found.
    // If they are authenticated but have no internal record, they should have been
    // redirected to /complete-profile by the middleware already.
    redirect("/sign-in");
  }

  // Ensure email and fullName are passed, even if null, EditProfileForm handles null display
  const userData = {
    email: internalUser.email || null,
    fullName: internalUser.fullName || null,
    whatsappNumber: internalUser.whatsappNumber || null,
    address: internalUser.address || null,
    birthDay: internalUser.birthDay || null,
    birthMonth: internalUser.birthMonth || null,
    birthYear: internalUser.birthYear || null,
  };

  return (
    <div className="flex flex-col min-h-screen bg-purple-800 text-white relative">
      <BackgroundOverlay />
      <div className="container mx-auto px-4 py-12 relative z-10">
        <EditProfileForm user={userData} />
        <div className="w-full max-w-lg mx-auto mt-8 mb-12">
          <SignOutButton>
            <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white cursor-pointer">Sign Out</Button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
