"use client";

import { useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { completeUserProfile } from '@/actions/user.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner'; // Assuming you use sonner for toasts

const initialState: { 
  success: boolean; 
  error?: string; 
  fieldErrors?: Partial<Record<"fullName", string[]>>; 
} = {
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Saving...' : 'Save and Continue'}
    </Button>
  );
}

export default function CompleteProfileForm({ initialEmail }: { initialEmail?: string }) {
  const [state, formAction] = useActionState(completeUserProfile, initialState);

  useEffect(() => {
    if (state.success) {
      // The server action handles redirection, but you could toast a success message here
      // if the redirect was handled differently (e.g., client-side redirect after success)
      // toast.success('Profile updated successfully!');
    }
    if (state.error) {
      toast.error(state.error, { description: state.fieldErrors?.fullName?.join(', ') });
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={initialEmail}
          readOnly
          className="mt-1 bg-gray-100 cursor-not-allowed"
        />
      </div>
      <div>
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          placeholder="Enter your full name"
          required
          className="mt-1"
        />
        {state.fieldErrors?.fullName && (
          <p className="mt-1 text-xs text-red-500">
            {state.fieldErrors.fullName.join(', ')}
          </p>
        )}
      </div>
      
      <SubmitButton />

      {/* General error message not tied to a field */}
      {state.error && !state.fieldErrors && (
         <p className="mt-2 text-sm text-red-600 text-center">{state.error}</p>
      )}
    </form>
  );
}
