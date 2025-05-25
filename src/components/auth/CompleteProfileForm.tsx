"use client";

import { useEffect, useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { completeUserProfile } from '@/actions/user.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner'; // Assuming you use sonner for toasts

const initialState: { 
  success: boolean; 
  error?: string; 
  fieldErrors?: Partial<Record<"fullName" | "whatsappNumber" | "address" | "birthDay" | "birthMonth" | "birthYear", string[]>>; 
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
  const [fromLessonSlugForForm, setFromLessonSlugForForm] = useState('');
  const [state, formAction] = useActionState(completeUserProfile, initialState);

  useEffect(() => {
    // Get lesson slug from session storage on mount
    const slug = sessionStorage.getItem('fromLessonSlug');
    if (slug) {
      setFromLessonSlugForForm(slug);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    if (state.success) {
      // The server action handles redirection.
      // Clear the session storage item on successful profile completion.
      if (sessionStorage.getItem('fromLessonSlug')) {
        sessionStorage.removeItem('fromLessonSlug');
        setFromLessonSlugForForm(''); // Clear state as well
      }
      // toast.success('Profile completed successfully!'); // Optional: if redirect allows toast to show
    }
    if (state.error || (state.fieldErrors && (state.fieldErrors.fullName || state.fieldErrors.whatsappNumber || state.fieldErrors.address || state.fieldErrors.birthDay || state.fieldErrors.birthMonth || state.fieldErrors.birthYear))) {
      const description = [
        state.fieldErrors?.fullName?.join(', '),
        state.fieldErrors?.whatsappNumber?.join(', '),
        state.fieldErrors?.address?.join(', '),
        state.fieldErrors?.birthDay?.join(', '),
        state.fieldErrors?.birthMonth?.join(', '),
        state.fieldErrors?.birthYear?.join(', ')
      ].filter(Boolean).join('; ');
      toast.error(state.error, { description: description || undefined });
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

      <div>
        <Label htmlFor="whatsappNumber">WhatsApp Number (*)</Label>
        <Input
          id="whatsappNumber"
          name="whatsappNumber"
          type="text"
          placeholder="Enter your WhatsApp number"
          required // Added required attribute
          className="mt-1"
        />
        {state.fieldErrors?.whatsappNumber && (
          <p className="mt-1 text-xs text-red-500">
            {state.fieldErrors.whatsappNumber.join(', ')}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="address">Address (City/District - Optional)</Label>
        <Input
          id="address"
          name="address"
          type="text"
          placeholder="e.g., San Francisco"
          className="mt-1"
        />
        {state.fieldErrors?.address && (
          <p className="mt-1 text-xs text-red-500">
            {state.fieldErrors.address.join(', ')}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Date of Birth (Optional)</Label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="birthDay" className="text-xs">Day</Label>
            <Input id="birthDay" name="birthDay" type="number" placeholder="DD" min="1" max="31" className="mt-1" />
            {state.fieldErrors?.birthDay && (
              <p className="mt-1 text-xs text-red-500">
                {state.fieldErrors.birthDay.join(', ')}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="birthMonth" className="text-xs">Month</Label>
            <Input id="birthMonth" name="birthMonth" type="number" placeholder="MM" min="1" max="12" className="mt-1" />
            {state.fieldErrors?.birthMonth && (
              <p className="mt-1 text-xs text-red-500">
                {state.fieldErrors.birthMonth.join(', ')}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="birthYear" className="text-xs">Year (Optional)</Label>
            <Input id="birthYear" name="birthYear" type="number" placeholder="YYYY" min="1900" max={new Date().getFullYear()} className="mt-1" />
            {state.fieldErrors?.birthYear && (
              <p className="mt-1 text-xs text-red-500">
                {state.fieldErrors.birthYear.join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>

      <input type="hidden" name="fromLessonSlug" value={fromLessonSlugForForm} />
      
      <SubmitButton />

      {/* General error message not tied to a field */}
      {state.error && !state.fieldErrors && (
         <p className="mt-2 text-sm text-red-600 text-center">{state.error}</p>
      )}
    </form>
  );
}
