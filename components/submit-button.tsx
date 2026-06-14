"use client";

import { useFormStatus } from "react-dom";
import { Dots } from "./dots";

export function SubmitButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className ?? ""} ${
        pending ? "opacity-80 cursor-progress" : ""
      }`}
    >
      {pending ? <Dots /> : children}
    </button>
  );
}
