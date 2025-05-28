import { getUserById } from "@/actions/admin/user.actions";
import UserEditForm from "@/components/admin/UserEditForm";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface UserEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserEditPage({ params: paramsPromise }: UserEditPageProps) {
  const { id } = await paramsPromise;
  const userId = parseInt(id, 10);
  
  if (isNaN(userId)) {
    notFound();
  }

  const { user, error } = await getUserById(userId);

  if (error || !user) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/admin/users">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeftIcon size={16} />
            Back to Users
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Edit User</h1>
        <UserEditForm user={user} />
      </div>
    </div>
  );
}
