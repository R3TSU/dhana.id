// src/components/admin/SubmitButton.tsx
"use client";

import { useFormStatus } from "react-dom";

interface SubmitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pendingText?: string;
  children: React.ReactNode;
}

export function SubmitButton({
  children,
  pendingText = "Saving...",
  className,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-disabled={pending}
      disabled={pending}
      className={
        className ||
        "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
      }
      {...props}
    >
      {pending ? pendingText : children}
    </button>
  );
}
