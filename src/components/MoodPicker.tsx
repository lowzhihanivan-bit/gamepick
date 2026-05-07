"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { MOODS } from "@/lib/moods";
import { cn } from "@/lib/cn";

export function MoodPicker({ activeMood }: { activeMood?: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  function pick(id: string) {
    const params = new URLSearchParams(sp.toString());
    if (params.get("mood") === id) {
      params.delete("mood");
    } else {
      params.set("mood", id);
      params.delete("page");
    }
    startTransition(() => router.push(`/?${params.toString()}`));
  }

  return (
    <div className="mb-6">
      <p className="text-xs uppercase tracking-wider text-ink-faint mb-3">
        What are you in the mood for?
      </p>
      <div className="flex flex-wrap gap-2">
        {MOODS.map((m) => {
          const active = activeMood === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => pick(m.id)}
              title={m.desc}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors",
                active
                  ? "bg-accent text-bg border-accent font-medium"
                  : "bg-bg-soft border-white/5 text-ink-dim hover:border-accent/50 hover:text-ink"
              )}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>
      {activeMood && (
        <p className="text-xs text-ink-faint mt-2">
          {MOODS.find((m) => m.id === activeMood)?.desc} ·{" "}
          <button
            onClick={() => pick(activeMood)}
            className="text-accent hover:underline"
          >
            clear
          </button>
        </p>
      )}
    </div>
  );
}
