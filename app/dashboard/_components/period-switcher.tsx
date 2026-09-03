import Link from "next/link"
import { cn } from "../../_lib/utils"
import type { DashboardPeriod } from "../../_data/get-dashboard-data"

const OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "year", label: "Ano" },
]

export default function PeriodSwitcher({ active }: { active: DashboardPeriod }) {
  return (
    <div className="border-border bg-secondary inline-flex shrink-0 rounded-lg border p-0.5">
      {OPTIONS.map((option) => (
        <Link
          key={option.value}
          href={option.value === "day" ? "/dashboard" : `/dashboard?periodo=${option.value}`}
          className={cn(
            "rounded-md px-3 py-1.5 font-mono text-xs tracking-wide uppercase transition-colors",
            active === option.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </Link>
      ))}
    </div>
  )
}
