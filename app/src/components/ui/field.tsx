import type { ReactNode } from "react";
import { Label } from "./label";
import { cn } from "@/lib/utils";

interface FieldProps {
  className?: string;
  children: ReactNode;
  "data-invalid"?: boolean;
}

export function Field({ className, children, "data-invalid": dataInvalid }: FieldProps) {
  return (
    <div
      className={cn("flex flex-col gap-2", className)}
      data-invalid={dataInvalid}
    >
      {children}
    </div>
  );
}

export function FieldLabel({ children, ...props }: { children: ReactNode; htmlFor?: string }) {
  return (
    <Label {...props}>
      {children}
    </Label>
  );
}

export function FieldDescription({ children }: { children: ReactNode }) {
  return <p className="text-xs text-gray-400">{children}</p>;
}

export function FieldError({ errors }: { errors: Array<{ message: string }> }) {
  if (!errors || errors.length === 0) return null;
  return (
    <p className="text-sm text-destructive">
      {errors[0]?.message}
    </p>
  );
}

