import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("bg-mint/50 rounded-xl2 p-4 shadow-soft", className)}
      {...props}
    />
  );
}
