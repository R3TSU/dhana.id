"use client";

import { updateUser } from "@/actions/admin/user.actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface User {
  id: number;
  clerk_user_id: string;
  email: string | null;
  fullName: string | null;
  whatsappNumber: string | null;
  address: string | null;
  birthDay: number | null;
  birthMonth: number | null;
  birthYear: number | null;
  role: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

interface UserEditFormProps {
  user: User;
}

export default function UserEditForm({ user }: UserEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  // Using Sonner toast directly
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await updateUser(user.id, formData);

      if (result.success) {
        toast.success(result.message || "User updated successfully");
        router.push("/admin/users");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update user");
        if (result.fieldErrors) {
          setErrors(result.fieldErrors);
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            name="fullName"
            defaultValue={user.fullName || ""}
            placeholder="Full Name"
          />
          {errors.fullName && (
            <p className="text-sm text-red-500">{errors.fullName[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={user.email || ""}
            placeholder="Email Address"
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
          <Input
            id="whatsappNumber"
            name="whatsappNumber"
            defaultValue={user.whatsappNumber || ""}
            placeholder="WhatsApp Number"
          />
          {errors.whatsappNumber && (
            <p className="text-sm text-red-500">{errors.whatsappNumber[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            defaultValue={user.address || ""}
            placeholder="City or District"
          />
          {errors.address && (
            <p className="text-sm text-red-500">{errors.address[0]}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="birthDay">Birth Day</Label>
          <Input
            id="birthDay"
            name="birthDay"
            type="number"
            min={1}
            max={31}
            defaultValue={user.birthDay || ""}
            placeholder="Day (1-31)"
          />
          {errors.birthDay && (
            <p className="text-sm text-red-500">{errors.birthDay[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthMonth">Birth Month</Label>
          <Input
            id="birthMonth"
            name="birthMonth"
            type="number"
            min={1}
            max={12}
            defaultValue={user.birthMonth || ""}
            placeholder="Month (1-12)"
          />
          {errors.birthMonth && (
            <p className="text-sm text-red-500">{errors.birthMonth[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthYear">Birth Year</Label>
          <Input
            id="birthYear"
            name="birthYear"
            type="number"
            min={1900}
            max={new Date().getFullYear()}
            defaultValue={user.birthYear || ""}
            placeholder="Year (optional)"
          />
          {errors.birthYear && (
            <p className="text-sm text-red-500">{errors.birthYear[0]}</p>
          )}
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">User Role</h3>
          <p className="text-sm text-gray-500">
            Select the appropriate role for this user. Admin users have full
            access to the admin panel.
          </p>

          <RadioGroup
            defaultValue={user.role || "user"}
            name="role"
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="user" id="user" />
              <Label htmlFor="user" className="cursor-pointer">
                User
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="admin" id="admin" />
              <Label htmlFor="admin" className="cursor-pointer">
                Admin
              </Label>
            </div>
          </RadioGroup>
        </div>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/users")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
