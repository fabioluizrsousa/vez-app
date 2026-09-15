import { format, isValid, parse } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Clock3 } from "lucide-react"
import { requireProfessional } from "../_lib/current-professional"
import { db } from "../_lib/prisma"
import {
  getDashboardData,
  type DashboardPeriod,
} from "../_data/get-dashboard-data"
import { formatBRL, formatDuration } from "../_lib/format"
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

  const agendaRevision =
    dashboardData.period === "day"
      ? [
          ...dashboardData.bookings.map(
            (booking) =>
              `${booking.id}:${booking.status}:${booking.scheduledAt.toISOString()}`,
          ),
          ...dashboardData.manualBlocks.map(
            (block) =>
              `${block.id}:${block.startAt.toISOString()}:${block.endAt.toISOString()}`,
          ),
        ].join("|")
      : `${period}:${referenceDate.toISOString()}`

  const now = new Date()
  const nextBooking =
    dashboardData.period === "day" && isToday
      ? dashboardData.bookings.find((booking) => {
          if (booking.status !== "CONFIRMED") return false
          const endsAt = new Date(
            booking.scheduledAt.getTime() + booking.service.durationMinutes * 60_000,
          )
          return endsAt > now
        })
      : null

  const nextBookingTiming = nextBooking
    ? nextBooking.scheduledAt <= now
      ? "Agora"
      : (() => {
          const minutes = Math.max(
            1,
            Math.round((nextBooking.scheduledAt.getTime() - now.getTime()) / 60_000),
          )
          if (minutes < 60) return `em ${minutes} min`
          const hours = Math.floor(minutes / 60)
          const rest = minutes % 60
          return rest === 0 ? `em ${hours}h` : `em ${hours}h ${rest}min`
        })()
    : null

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

      <QuickActions
        key={agendaRevision}
        professionalId={professional.id}
        services={services}
      />

      {dashboardData.period === "day" && isToday && (
        <div className="border-border bg-card mb-4 rounded-xl border p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-muted-foreground mb-1 font-mono text-[10px] tracking-wide uppercase sm:text-[11px]">
                Próximo atendimento
              </p>
              {nextBooking ? (
                <>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <p className="truncate text-base font-semibold sm:text-lg">
                      {nextBooking.clientName}
                    </p>
                    <span className="text-primary font-mono text-xs font-semibold">
                      {nextBookingTiming}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                    {format(nextBooking.scheduledAt, "HH:mm", { locale: ptBR })} · {nextBooking.service.name} · {formatDuration(nextBooking.service.durationMinutes)}
                  </p>
                </>
              ) : (
                <p className="text-sm font-medium">Nenhum atendimento pendente hoje.</p>
              )}
            </div>
            <div className="bg-secondary text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11">
              <Clock3 className="h-5 w-5" />
            </div>
          </div>
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:gap-3">
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
        {dashboardData.period === "day" ? "Agenda do dia" : "Faturamento no período"}
      </p>

      {dashboardData.period === "day" ? (
        <DayTimeline
          bookings={dashboardData.bookings}
          manualBlocks={dashboardData.manualBlocks}
        />
      ) : (
        <RevenueBarChart data={dashboardData.series} />
      )}
    </div>
  )
}
