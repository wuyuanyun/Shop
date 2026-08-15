import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "brand" | "accent" | "muted" | "danger" | "mint";

const tones: Record<Tone, string> = {
  brand: "bg-brand/10 text-brand ring-1 ring-brand/20",
  accent: "bg-accent/10 text-accent ring-1 ring-accent/20",
  muted: "bg-line text-muted ring-1 ring-line",
  danger: "bg-danger/10 text-danger ring-1 ring-danger/20",
  mint: "bg-mint text-brand ring-1 ring-brand/15",
};

const dots: Record<Tone, string> = {
  brand: "bg-brand",
  accent: "bg-accent",
  muted: "bg-muted",
  danger: "bg-danger",
  mint: "bg-brand",
};

export function Badge({
  tone = "brand",
  dot = false,
  children,
  className,
}: {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className
      )}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", dots[tone])} />}
      {children}
    </span>
  );
}
