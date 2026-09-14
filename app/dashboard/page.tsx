import { isValid, parse } from "date-fns"
import { requireProfessional } from "../_lib/current-professional"
import { db } from "../_lib/prisma"
import {
  getDashboardData,
  type DashboardPeriod,
} from "../_data/get-dashboard-data"
import { formatBRL } from "../_lib/format"
import PeriodSwitcher from "./_components/period-switcher"
import DateNav from "./_components/date-nav"
import StatTile from "./_components/stat-tile"
import DayTimeline from "./_components/day-timeline"
import RevenueBarChart from "./_components/revenue-bar-chart"
import QuickActions from "./_components/quick-actions"

const VALID_PERIODS: DashboardPeriod[] = ["day", "week", "month", "year"]

const DELTA_LABEL: Record<DashboardPeriod, string> = {
  day: "vs. ontem",
  week: "vs. semana passada",
  month: "vs. mês passado",
  year: "vs. ano passado",
}

const REVENUE_LABEL: Record<DashboardPeriod, string> = {
  day: "faturado hoje",
  week: "faturado na semana",
  month: "faturado no mês",
  year: "faturado no ano",
}

const COUNT_LABEL: Record<DashboardPeriod, string> = {
  day: "agendamentos hoje",
  week: "agendamentos na semana",
  month: "agendamentos no mês",
  year: "agendamentos no ano",
}

interface PageProps {
  searchParams: Promise<{ periodo?: string; data?: string }>
}

function parseReferenceDate(raw: string | undefined): Date {
  if (!raw) return new Date()
  const parsed = parse(raw, "yyyy-MM-dd", new Date())
  return isValid(parsed) ? parsed : new Date()
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const professional = await requireProfessional()
  const { periodo, data: dataParam } = await searchParams
  const period: DashboardPeriod = VALID_PERIODS.includes(periodo as DashboardPeriod)
    ? (periodo as DashboardPeriod)
    : "day"
  const referenceDate = parseReferenceDate(dataParam)
  const isToday = !dataParam

  const [dashboardData, services] = await Promise.all([
    getDashboardData(professional.id, period, referenceDate),
    db.service.findMany({
      where: { professionalId: professional.id, active: true },
      select: { id: true, name: true },
      orderBy: { order: "asc" },
    }),
  ])

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold">Agenda</h1>
          <span className="text-muted-foreground font-mono text-xs capitalize">
            {dashboardData.rangeLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <DateNav period={period} referenceDate={referenceDate} isToday={isToday} />
          <PeriodSwitcher active={period} />
        </div>
      </div>

      <QuickActions professionalId={professional.id} services={services} />

      <div className="mb-6 grid grid-cols-2 gap-3">
        <StatTile
          label={REVENUE_LABEL[period]}
          value={formatBRL(dashboardData.kpis.revenue.value)}
          deltaPct={dashboardData.kpis.revenue.deltaPct}
          deltaLabel={DELTA_LABEL[period]}
          sparkline={dashboardData.period === "day" ? dashboardData.sparkline : undefined}
        />
        <StatTile
          label={COUNT_LABEL[period]}
          value={String(dashboardData.kpis.count.value)}
          deltaPct={dashboardData.kpis.count.deltaPct}
          deltaLabel={DELTA_LABEL[period]}
        />
      </div>

      <p className="text-muted-foreground mb-3 font-mono text-[11px] tracking-wide uppercase">
        {dashboardData.period === "day" ? "Linha do tempo" : "Faturamento no período"}
      </p>

      {dashboardData.period === "day" ? (
        <DayTimeline bookings={dashboardData.bookings} manualBlocks={dashboardData.manualBlocks} />
      ) : (
        <RevenueBarChart data={dashboardData.series} />
      )}
    </div>
  )
}
