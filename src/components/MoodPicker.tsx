"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { MOODS } from "@/lib/moods";
import { cn } from "@/lib/cn";

export function MoodPicker({ activeMoods }: { activeMoods?: string[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const active = new Set(activeMoods ?? []);

  function toggle(id: string) {
    const next = new Set(active);
    next.has(id) ? next.delete(id) : next.add(id);
    const params = new URLSearchParams(sp.toString());
    params.delete("page");
    if (next.size) params.set("mood", [...next].join(","));
    else params.delete("mood");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function clearAll() {
    const params = new URLSearchParams(sp.toString());
    params.delete("mood");
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="mb-6">
      <p className="text-xs uppercase tracking-wider text-ink-faint mb-3">
        What are you in the mood for?
      </p>
      <div className="flex flex-wrap gap-2">
        {MOODS.map((m) => {
          const isActive = active.has(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(m.id)}
              title={m.desc}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors",
                isActive
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
      {active.size > 0 && (
        <p className="text-xs text-ink-faint mt-2">
          {active.size === 1
            ? MOODS.find((m) => active.has(m.id))?.desc
            : `${active.size} moods selected`}{" "}
          ·{" "}
          <button onClick={clearAll} className="text-accent hover:underline">
            clear
          </button>
        </p>
      )}
    </div>
  );
}
