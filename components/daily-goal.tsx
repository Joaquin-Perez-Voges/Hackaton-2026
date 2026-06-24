"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const metas = [3, 5, 10, 15];
const KEY = "nextself:dailyGoal";

export function DailyGoal() {
  const [goal, setGoal] = useState<number | null>(null);

  useEffect(() => {
    const s = localStorage.getItem(KEY);
    setGoal(s ? Number(s) : 5);
  }, []);

  function pick(g: number) {
    setGoal(g);
    localStorage.setItem(KEY, String(g));
  }

  return (
    <div className="flex gap-2">
      {metas.map((g) => (
        <button
          key={g}
          type="button"
          onClick={() => pick(g)}
          className={cn(
            "rounded-xl border px-4 py-2 text-sm font-medium transition",
            goal === g
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          {g}
        </button>
      ))}
    </div>
  );
}
