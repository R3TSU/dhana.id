import { getUserById } from "@/actions/admin/user.actions";
import DeleteUserForm from "@/components/admin/DeleteUserForm";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface DeleteUserPageProps {
  params: Promise<{ id: string }>;
}

export default async function DeleteUserPage({ params: paramsPromise }: DeleteUserPageProps) {
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
        <h1 className="text-2xl font-bold mb-6">Delete User</h1>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Warning</h2>
          <p className="text-red-600">
            You are about to delete the user <strong>{user.fullName || user.email}</strong>. 
            This action cannot be undone and will remove all data associated with this user.
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Name</h3>
              <p className="mt-1">{user.fullName || "—"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="mt-1">{user.email || "—"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">WhatsApp</h3>
              <p className="mt-1">{user.whatsappNumber || "—"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Role</h3>
              <p className="mt-1">{user.role}</p>
            </div>
          </div>
          
          <DeleteUserForm userId={user.id} />
        </div>
      </div>
    </div>
  );
}
