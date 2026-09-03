import { format } from "date-fns"
import type { BookingStatus } from "@prisma/client"
import { formatBRL } from "../../_lib/format"
import StatusPill from "../../_components/status-pill"
import AgendaItemActions from "../agenda-item-actions"
import type { DashboardBooking } from "../../_data/get-dashboard-data"

const STATUS_COLOR: Record<BookingStatus, string> = {
  CONFIRMED: "var(--vz-musgo)",
  COMPLETED: "var(--vz-aco)",
  CANCELED: "var(--vz-tijolo)",
  NO_SHOW: "var(--vz-areia-fraca)",
}

export default function DayTimeline({
  bookings,
}: {
  bookings: DashboardBooking[]
}) {
  if (bookings.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nenhum agendamento pra hoje ainda.
      </p>
    )
  }

  return (
    <ol className="flex flex-col">
      {bookings.map((booking, i) => (
        <li key={booking.id} className="relative flex gap-3 pb-5 last:pb-0">
          {i < bookings.length - 1 && (
            <span
              aria-hidden
              className="bg-border absolute top-6 bottom-0 left-[47px] w-px"
            />
          )}
          <span className="text-muted-foreground w-11 shrink-0 pt-2.5 font-mono text-sm tabular-nums">
            {format(booking.scheduledAt, "HH:mm")}
          </span>
          <span
            aria-hidden
            className="border-background mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full border-2"
            style={{ background: STATUS_COLOR[booking.status] }}
          />
          <div
            className="bg-card flex flex-1 items-start justify-between gap-3 rounded-lg border py-3 pr-3.5 pl-3"
            style={{
              borderColor: "var(--color-border)",
              borderLeftColor: STATUS_COLOR[booking.status],
              borderLeftWidth: 3,
            }}
          >
            <div>
              <p className="text-sm font-semibold">{booking.clientName}</p>
              <p className="text-muted-foreground text-xs">
                {booking.service.name} · {formatBRL(booking.service.price)}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <StatusPill status={booking.status} />
              {booking.status === "CONFIRMED" && (
                <AgendaItemActions bookingId={booking.id} />
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
