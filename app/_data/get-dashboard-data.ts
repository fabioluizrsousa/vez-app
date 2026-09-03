import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  format,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import type { BookingStatus } from "@prisma/client"
import { db } from "../_lib/prisma"

export type DashboardPeriod = "day" | "week" | "month" | "year"

// Bucket usado pra série de barras (semana/mês/ano) — cada item vira uma barra.
export type DashboardSeriesPoint = { label: string; value: number }

export type DashboardBooking = {
  id: string
  scheduledAt: Date
  clientName: string
  status: BookingStatus
  service: { name: string; price: { toString(): string } }
}

type KpiValue = { value: number; deltaPct: number | null }
type Kpis = { revenue: KpiValue; count: KpiValue }

type DayDashboardData = {
  period: "day"
  rangeLabel: string
  kpis: Kpis
  sparkline: number[]
  bookings: DashboardBooking[]
}

type SeriesDashboardData = {
  period: "week" | "month" | "year"
  rangeLabel: string
  kpis: Kpis
  series: DashboardSeriesPoint[]
}

export type DashboardData = DayDashboardData | SeriesDashboardData

const WEEK_OPTS = { weekStartsOn: 1 as const }

function getRange(period: DashboardPeriod, ref: Date) {
  switch (period) {
    case "day":
      return { start: startOfDay(ref), end: endOfDay(ref) }
    case "week":
      return {
        start: startOfWeek(ref, WEEK_OPTS),
        end: endOfWeek(ref, WEEK_OPTS),
      }
    case "month":
      return { start: startOfMonth(ref), end: endOfMonth(ref) }
    case "year":
      return { start: startOfYear(ref), end: endOfYear(ref) }
  }
}

function getPreviousRef(period: DashboardPeriod, ref: Date) {
  switch (period) {
    case "day":
      return subDays(ref, 1)
    case "week":
      return subWeeks(ref, 1)
    case "month":
      return subMonths(ref, 1)
    case "year":
      return subYears(ref, 1)
  }
}

function sumRevenue(bookings: { status: BookingStatus; service: { price: unknown } }[]) {
  return bookings
    .filter((b) => b.status === "COMPLETED")
    .reduce((sum, b) => sum + Number(b.service.price), 0)
}

function countActive(bookings: { status: BookingStatus }[]) {
  return bookings.filter((b) => b.status !== "CANCELED").length
}

// null = sem base de comparação (período anterior zerado) — o StatTile mostra
// "Novo" nesse caso em vez de uma % sem sentido (divisão por zero).
function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / previous) * 100
}

function stripTrailingDot(s: string) {
  return s.replace(/\.$/, "")
}

function formatRangeLabel(period: DashboardPeriod, ref: Date) {
  if (period === "day") {
    return format(ref, "EEE, d 'de' MMM.", { locale: ptBR })
  }
  if (period === "week") {
    const { start, end } = getRange("week", ref)
    return `${format(start, "d 'de' MMM.", { locale: ptBR })} – ${format(end, "d 'de' MMM.", { locale: ptBR })}`
  }
  if (period === "month") {
    return format(ref, "MMMM 'de' yyyy", { locale: ptBR })
  }
  return format(ref, "yyyy")
}

/**
 * Dados prontos pra Agenda do dashboard: KPIs (com variação vs. período
 * anterior) e, dependendo do período, a linha do tempo do dia ou uma série
 * pra gráfico de barras (semana = por dia, mês = por semana, ano = por mês).
 */
export async function getDashboardData(
  professionalId: string,
  period: DashboardPeriod,
  referenceDate: Date = new Date(),
): Promise<DashboardData> {
  const { start, end } = getRange(period, referenceDate)
  const prevRef = getPreviousRef(period, referenceDate)
  const { start: prevStart, end: prevEnd } = getRange(period, prevRef)

  const [currentBookings, previousBookings] = await Promise.all([
    db.booking.findMany({
      where: { professionalId, scheduledAt: { gte: start, lte: end } },
      include: { service: { select: { name: true, price: true } } },
      orderBy: { scheduledAt: "asc" },
    }),
    db.booking.findMany({
      where: { professionalId, scheduledAt: { gte: prevStart, lte: prevEnd } },
      select: { status: true, service: { select: { price: true } } },
    }),
  ])

  const revenue = sumRevenue(currentBookings)
  const count = countActive(currentBookings)
  const previousRevenue = sumRevenue(previousBookings)
  const previousCount = countActive(previousBookings)

  const kpis: Kpis = {
    revenue: { value: revenue, deltaPct: deltaPct(revenue, previousRevenue) },
    count: { value: count, deltaPct: deltaPct(count, previousCount) },
  }

  const rangeLabel = formatRangeLabel(period, referenceDate)

  if (period === "day") {
    const sparklineStart = startOfDay(subDays(referenceDate, 6))
    const sparklineBookings = await db.booking.findMany({
      where: {
        professionalId,
        status: "COMPLETED",
        scheduledAt: { gte: sparklineStart, lte: end },
      },
      select: { scheduledAt: true, service: { select: { price: true } } },
    })
    const days = eachDayOfInterval({ start: sparklineStart, end })
    const sparkline = days.map((day) => {
      const dayStart = startOfDay(day).getTime()
      return sparklineBookings
        .filter((b) => startOfDay(b.scheduledAt).getTime() === dayStart)
        .reduce((sum, b) => sum + Number(b.service.price), 0)
    })

    return { period, rangeLabel, kpis, sparkline, bookings: currentBookings }
  }

  let buckets: { key: number; label: string }[]

  function weekBucketKey(scheduledAt: Date) {
    return startOfDay(scheduledAt).getTime()
  }
  function monthBucketKey(scheduledAt: Date) {
    return startOfWeek(scheduledAt, WEEK_OPTS).getTime()
  }
  function yearBucketKey(scheduledAt: Date) {
    return startOfMonth(scheduledAt).getTime()
  }

  if (period === "week") {
    buckets = eachDayOfInterval({ start, end }).map((d) => ({
      key: startOfDay(d).getTime(),
      label: stripTrailingDot(format(d, "EEE", { locale: ptBR })),
    }))
  } else if (period === "month") {
    buckets = eachWeekOfInterval({ start, end }, WEEK_OPTS).map((d, i) => ({
      key: startOfWeek(d, WEEK_OPTS).getTime(),
      label: `Sem ${i + 1}`,
    }))
  } else {
    buckets = eachMonthOfInterval({ start, end }).map((d) => ({
      key: startOfMonth(d).getTime(),
      label: stripTrailingDot(format(d, "MMM", { locale: ptBR })),
    }))
  }

  const bucketKeyOf =
    period === "week"
      ? weekBucketKey
      : period === "month"
        ? monthBucketKey
        : yearBucketKey

  const completed = currentBookings.filter((b) => b.status === "COMPLETED")
  const series: DashboardSeriesPoint[] = buckets.map(({ key, label }) => ({
    label,
    value: completed
      .filter((b) => bucketKeyOf(b.scheduledAt) === key)
      .reduce((sum, b) => sum + Number(b.service.price), 0),
  }))

  return { period, rangeLabel, kpis, series }
}
