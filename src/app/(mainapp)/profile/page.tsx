import { UserProfile } from "@clerk/nextjs";

const ProfilePage = () => {
  return (
    <div className="flex justify-center items-center min-h-screen py-8">
      <UserProfile routing="hash" />
    </div>
  );
};

export default ProfilePage;
