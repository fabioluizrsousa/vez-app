"use client"

import { useState } from "react"
import { formatBRL } from "../../_lib/format"
import type { DashboardSeriesPoint } from "../../_data/get-dashboard-data"

export default function RevenueBarChart({
  data,
}: {
  data: DashboardSeriesPoint[]
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div>
      <div className="flex h-36 items-end gap-2">
        {data.map((d, i) => {
          const heightPct = (d.value / max) * 100
          const isHovered = hovered === i
          return (
            <div
              key={`${d.label}-${i}`}
              className="relative flex h-full flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
            >
              {isHovered && (
                <div className="border-border bg-card text-foreground pointer-events-none absolute bottom-full z-10 mb-1.5 rounded-md border px-2 py-1 font-mono text-xs whitespace-nowrap tabular-nums shadow-sm">
                  {formatBRL(d.value)}
                </div>
              )}
              <button
                type="button"
                aria-label={`${d.label}: ${formatBRL(d.value)}`}
                className="w-full max-w-6 rounded-t-[4px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--vz-cobre)]"
                style={{
                  height: `${Math.max(heightPct, d.value > 0 ? 4 : 1)}%`,
                  background: isHovered ? "var(--vz-cobre-alto)" : "var(--vz-cobre)",
                  opacity: d.value > 0 ? 1 : 0.25,
                }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-1.5 flex gap-2">
        {data.map((d, i) => (
          <span
            key={`${d.label}-${i}`}
            className="text-muted-foreground flex-1 text-center font-mono text-[10px] tracking-wide uppercase"
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}
