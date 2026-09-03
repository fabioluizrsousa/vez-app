import { requireProfessional } from "../_lib/current-professional"
import {
  getDashboardData,
  type DashboardPeriod,
} from "../_data/get-dashboard-data"
import { formatBRL } from "../_lib/format"
import PeriodSwitcher from "./_components/period-switcher"
import StatTile from "./_components/stat-tile"
import DayTimeline from "./_components/day-timeline"
import RevenueBarChart from "./_components/revenue-bar-chart"

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
  searchParams: Promise<{ periodo?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const professional = await requireProfessional()
  const { periodo } = await searchParams
  const period: DashboardPeriod = VALID_PERIODS.includes(
    periodo as DashboardPeriod,
  )
    ? (periodo as DashboardPeriod)
    : "day"

  const data = await getDashboardData(professional.id, period, new Date())

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold">Agenda</h1>
          <span className="text-muted-foreground font-mono text-xs capitalize">
            {data.rangeLabel}
          </span>
        </div>
        <PeriodSwitcher active={period} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <StatTile
          label={REVENUE_LABEL[period]}
          value={formatBRL(data.kpis.revenue.value)}
          deltaPct={data.kpis.revenue.deltaPct}
          deltaLabel={DELTA_LABEL[period]}
          sparkline={data.period === "day" ? data.sparkline : undefined}
        />
        <StatTile
          label={COUNT_LABEL[period]}
          value={String(data.kpis.count.value)}
          deltaPct={data.kpis.count.deltaPct}
          deltaLabel={DELTA_LABEL[period]}
        />
      </div>

      <p className="text-muted-foreground mb-3 font-mono text-[11px] tracking-wide uppercase">
        {data.period === "day" ? "Linha do tempo" : "Faturamento no período"}
      </p>

      {data.period === "day" ? (
        <DayTimeline bookings={data.bookings} />
      ) : (
        <RevenueBarChart data={data.series} />
      )}
    </div>
  )
}
