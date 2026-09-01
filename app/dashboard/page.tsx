import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { requireProfessional } from "../_lib/current-professional"
import { getDayAgenda } from "../_data/get-day-agenda"
import { formatBRL } from "../_lib/format"
import StatusPill from "../_components/status-pill"
import AgendaItemActions from "./agenda-item-actions"

export default async function DashboardPage() {
  const professional = await requireProfessional()
  const today = new Date()
  const { bookings, revenueToday, countToday } = await getDayAgenda(
    professional.id,
    today,
  )

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="font-display text-xl font-extrabold">Agenda do dia</h1>
        <span className="text-muted-foreground font-mono text-xs">
          {format(today, "EEE, d 'de' MMM.", { locale: ptBR })}
        </span>
      </div>

      {bookings.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Nenhum agendamento pra hoje ainda.
        </p>
      )}

      <ul className="divide-border divide-y">
        {bookings.map((booking) => (
          <li key={booking.id} className="flex items-start gap-3 py-3.5">
            <span className="text-muted-foreground w-11 pt-0.5 font-mono text-sm tabular-nums">
              {format(booking.scheduledAt, "HH:mm")}
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold">{booking.clientName}</p>
              <p className="text-muted-foreground text-xs">
                {booking.service.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill status={booking.status} />
              {booking.status === "CONFIRMED" && (
                <AgendaItemActions bookingId={booking.id} />
              )}
            </div>
          </li>
        ))}
      </ul>

      <p className="text-muted-foreground mt-8 mb-2 font-mono text-[11px] tracking-wide uppercase">
        Hoje
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary rounded-lg px-3.5 py-3">
          <p className="font-mono text-lg font-semibold tabular-nums">
            {formatBRL(revenueToday)}
          </p>
          <p className="text-muted-foreground text-[11px]">faturado</p>
        </div>
        <div className="bg-secondary rounded-lg px-3.5 py-3">
          <p className="font-mono text-lg font-semibold tabular-nums">
            {countToday}
          </p>
          <p className="text-muted-foreground text-[11px]">agendamentos</p>
        </div>
      </div>
    </div>
  )
}
