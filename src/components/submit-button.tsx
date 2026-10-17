"use client";
import { useFormStatus } from "react-dom";
export function SubmitButton({
  children,
  pendingText = "Please wait…",
}: {
  children: React.ReactNode;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className="button"
      type="submit"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? pendingText : children}
    </button>
  );
}
