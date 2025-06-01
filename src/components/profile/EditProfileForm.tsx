"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react"; // Changed from react-dom
import { useFormStatus } from "react-dom";
import { updateUserProfile } from "@/actions/user.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

interface EditProfileFormProps {
  user: {
    email: string | null;
    fullName: string | null;
    whatsappNumber: string | null;
    address?: string | null;
    birthDay?: number | null;
    birthMonth?: number | null;
    birthYear?: number | null;
  };
}

const initialState: {
  success: boolean;
  message?: string;
  fieldErrors?: Partial<
    Record<
      | "fullName"
      | "whatsappNumber"
      | "address"
      | "birthDay"
      | "birthMonth"
      | "birthYear",
      string[]
    >
  >;
} = {
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Saving..." : "Save Changes"}
    </Button>
  );
}

export default function EditProfileForm({ user }: EditProfileFormProps) {
  const [state, formAction] = useActionState(updateUserProfile, initialState);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message);
      } else {
        const description = [
          state.fieldErrors?.fullName?.join(", "),
          state.fieldErrors?.whatsappNumber?.join(", "),
          state.fieldErrors?.address?.join(", "),
          state.fieldErrors?.birthDay?.join(", "),
          state.fieldErrors?.birthMonth?.join(", "),
          state.fieldErrors?.birthYear?.join(", "),
        ]
          .filter(Boolean)
          .join("; ");
        toast.error(state.message, {
          description: description || undefined,
        });
      }
    }
  }, [state]);

  return (
    <Card className="w-full max-w-lg mx-auto mt-8">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>
          Update your personal information. Email is read-only.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-6 mb-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email || ""}
              readOnly
              className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name (*)</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              defaultValue={user.fullName || ""} // Use defaultValue for initial render
              required
            />
            {state.fieldErrors?.fullName && (
              <p className="mt-1 text-xs text-red-500">
                {state.fieldErrors.fullName.join(", ")}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsappNumber">WhatsApp Number (*)</Label>
            <Input
              id="whatsappNumber"
              name="whatsappNumber"
              type="text"
              defaultValue={user.whatsappNumber || ""}
              placeholder="Enter your WhatsApp number"
              required // Added required attribute
            />
            {state.fieldErrors?.whatsappNumber && (
              <p className="mt-1 text-xs text-red-500">
                {state.fieldErrors.whatsappNumber.join(", ")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address (City/District) (*)</Label>
            <Input
              id="address"
              name="address"
              type="text"
              defaultValue={user.address || ""}
              placeholder="e.g., Jakarta"
              required
            />
            {state.fieldErrors?.address && (
              <p className="mt-1 text-xs text-red-500">
                {state.fieldErrors.address.join(", ")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="birthDay" className="text-xs">
                  Day (*)
                </Label>
                <Input
                  id="birthDay"
                  name="birthDay"
                  type="number"
                  placeholder="DD"
                  defaultValue={user.birthDay || ""}
                  min="1"
                  max="31"
                  required
                />
                {state.fieldErrors?.birthDay && (
                  <p className="mt-1 text-xs text-red-500">
                    {state.fieldErrors.birthDay.join(", ")}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="birthMonth" className="text-xs">
                  Month (*)
                </Label>
                <Input
                  id="birthMonth"
                  name="birthMonth"
                  type="number"
                  placeholder="MM"
                  defaultValue={user.birthMonth || ""}
                  min="1"
                  max="12"
                  required
                />
                {state.fieldErrors?.birthMonth && (
                  <p className="mt-1 text-xs text-red-500">
                    {state.fieldErrors.birthMonth.join(", ")}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="birthYear" className="text-xs">
                  Year
                </Label>
                <Input
                  id="birthYear"
                  name="birthYear"
                  type="number"
                  placeholder="YYYY"
                  defaultValue={user.birthYear || ""}
                  min="1900"
                  max={new Date().getFullYear()}
                />
                {state.fieldErrors?.birthYear && (
                  <p className="mt-1 text-xs text-red-500">
                    {state.fieldErrors.birthYear.join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Hidden input for fromLessonSlug removed */}
        </CardContent>
        <CardFooter className="border-t pt-6 flex flex-col sm:flex-row sm:justify-end sm:space-x-2">
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
