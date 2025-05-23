"use client";

import { useEffect } from 'react';
import { useActionState } from 'react'; // Changed from react-dom
import { useFormStatus } from 'react-dom';
import { updateUserProfile } from '@/actions/user.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface EditProfileFormProps {
  user: {
    email: string | null;
    fullName: string | null;
  };
}

const initialState: {
  success: boolean;
  message?: string;
  fieldErrors?: Partial<Record<"fullName", string[]>>;
} = {
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? 'Saving...' : 'Save Changes'}
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
        toast.error(state.message, { 
          description: state.fieldErrors?.fullName?.join(', ')
        });
      }
    }
  }, [state]);

  return (
    <Card className="w-full max-w-lg mx-auto mt-8 mb-12">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>Update your personal information. Email is read-only.</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email || ''} // Use defaultValue for initial render with server data
              readOnly
              className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              defaultValue={user.fullName || ''} // Use defaultValue for initial render
              required
            />
            {state.fieldErrors?.fullName && (
              <p className="mt-1 text-xs text-red-500">
                {state.fieldErrors.fullName.join(', ')}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6 flex flex-col sm:flex-row sm:justify-end sm:space-x-2">
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
