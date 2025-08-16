import { getUsers } from "@/actions/admin/user.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

interface UsersPageProps {
  searchParams: {
    page?: string;
    limit?: string;
    search?: string;
  };
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; limit?: string; search?: string }>;
}) {
  const { page = "1", limit = "50", search = "" } = (await searchParams) || {};

  const { users, pagination, error } = await getUsers({
    page: parseInt(page, 10),
    limit: parseInt(limit, 10) || 50, // Ensure limit is a number with default 10
    search,
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <form action="/admin/users" method="GET" className="flex gap-2">
              <Input
                type="text"
                name="search"
                placeholder="Search users..."
                defaultValue={search}
                className="flex-1"
              />
              <Button type="submit">Search</Button>
            </form>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 text-red-500 p-4 rounded-md mb-4">
            {error}
          </div>
        ) : null}

        <Suspense fallback={<div>Loading users...</div>}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.fullName || "—"}</TableCell>
                      <TableCell>{user.email || "—"}</TableCell>
                      <TableCell>{user.whatsappNumber || "—"}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/users/${user.id}`} prefetch={false}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              title="Edit user"
                            >
                              <PencilIcon size={14} />
                            </Button>
                          </Link>
                          <Link href={`/admin/users/${user.id}/delete`} prefetch={false}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-red-500 border-red-200 hover:bg-red-50"
                              title="Delete user"
                            >
                              <TrashIcon size={14} />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-500">
                Showing{" "}
                {(pagination.currentPage - 1) * (parseInt(limit, 10) || 10) + 1}{" "}
                to{" "}
                {Math.min(
                  pagination.currentPage * (parseInt(limit, 10) || 10),
                  pagination.totalCount,
                )}{" "}
                of {pagination.totalCount} users
              </div>
              <div className="flex gap-2">
                <Link
                  href={{
                    pathname: "/admin/users",
                    query: {
                      page: String(pagination.currentPage - 1),
                      limit,
                      search,
                    },
                  }}
                  className={
                    !pagination.hasPrevPage
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                >
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPrevPage}
                  >
                    <ChevronLeftIcon size={16} />
                    Previous
                  </Button>
                </Link>
                <Link
                  href={{
                    pathname: "/admin/users",
                    query: {
                      page: String(pagination.currentPage + 1),
                      limit,
                      search,
                    },
                  }}
                  className={
                    !pagination.hasNextPage
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                >
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNextPage}
                  >
                    Next
                    <ChevronRightIcon size={16} />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
}
