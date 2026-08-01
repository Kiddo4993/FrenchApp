"use client";

import { Volume2 } from "lucide-react";
import { useSpeak } from "@/hooks/useSpeak";
import { cn } from "@/lib/utils";

export function SpeakerButton({
  text,
  className,
  size = "default",
}: {
  text: string;
  className?: string;
  size?: "sm" | "default";
}) {
  const { speak, speaking, supported } = useSpeak();
  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => speak(text)}
      aria-label={`Écouter : ${text}`}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-accent disabled:opacity-50",
        size === "sm" ? "size-7" : "size-9",
        className,
      )}
      disabled={speaking}
    >
      <Volume2 className={cn(size === "sm" ? "size-4" : "size-5", speaking && "animate-pulse")} />
    </button>
  );
}
