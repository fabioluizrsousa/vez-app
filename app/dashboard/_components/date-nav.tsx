import Link from "next/link"
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  format,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns"
import type { DashboardPeriod } from "../../_data/get-dashboard-data"

// Um passo (pra frente/trás) por tipo de período — dia navega dia a dia,
// semana pula de semana em semana, etc.
function nextByPeriod(period: DashboardPeriod, date: Date): Date {
  switch (period) {
    case "day":
      return addDays(date, 1)
    case "week":
      return addWeeks(date, 1)
    case "month":
      return addMonths(date, 1)
    case "year":
      return addYears(date, 1)
  }
}

function previousByPeriod(period: DashboardPeriod, date: Date): Date {
  switch (period) {
    case "day":
      return subDays(date, 1)
    case "week":
      return subWeeks(date, 1)
    case "month":
      return subMonths(date, 1)
    case "year":
      return subYears(date, 1)
  }
}

function hrefFor(period: DashboardPeriod, date: Date) {
  const params = new URLSearchParams()
  if (period !== "day") params.set("periodo", period)
  params.set("data", format(date, "yyyy-MM-dd"))
  return `/dashboard?${params.toString()}`
}

const ARROW_CLASS =
  "border-border text-muted-foreground hover:text-foreground hover:bg-secondary flex h-7 w-7 items-center justify-center rounded-md border transition-colors"

export default function DateNav({
  period,
  referenceDate,
  isToday,
}: {
  period: DashboardPeriod
  referenceDate: Date
  isToday: boolean
}) {
  return (
    <div className="flex items-center gap-1">
      <Link
        href={hrefFor(period, previousByPeriod(period, referenceDate))}
        aria-label="Período anterior"
        className={ARROW_CLASS}
      >
        ‹
      </Link>
      {!isToday && (
        <Link
          href={period === "day" ? "/dashboard" : `/dashboard?periodo=${period}`}
          className="border-border text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md border px-2 py-1 font-mono text-[11px] tracking-wide uppercase transition-colors"
        >
          Hoje
        </Link>
      )}
      <Link
        href={hrefFor(period, nextByPeriod(period, referenceDate))}
        aria-label="Próximo período"
        className={ARROW_CLASS}
      >
        ›
      </Link>
    </div>
  )
}
