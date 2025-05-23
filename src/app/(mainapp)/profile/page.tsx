import { getCurrentInternalUser } from '@/actions/user.actions';
import EditProfileForm from '@/components/profile/EditProfileForm';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const internalUser = await getCurrentInternalUser();

  if (!internalUser) {
    // This should ideally be caught by middleware for unauthenticated users,
    // but as a safeguard, redirect if no internal user record found.
    // If they are authenticated but have no internal record, they should have been
    // redirected to /complete-profile by the middleware already.
    redirect('/sign-in'); 
  }

  // Ensure email and fullName are passed, even if null, EditProfileForm handles null display
  const userData = {
    email: internalUser.email || null,
    fullName: internalUser.fullName || null,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <EditProfileForm user={userData} />
    </div>
  );
}

