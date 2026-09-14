import { format } from "date-fns"
import type { BookingStatus } from "@prisma/client"
import { formatBRL } from "../../_lib/format"
import StatusPill from "../../_components/status-pill"
import AgendaItemActions from "../agenda-item-actions"
import ManualBlockActions from "./manual-block-actions"
import type {
  DashboardBooking,
  DashboardManualBlock,
} from "../../_data/get-dashboard-data"

const STATUS_COLOR: Record<BookingStatus, string> = {
  CONFIRMED: "var(--vz-musgo)",
  COMPLETED: "var(--vz-aco)",
  CANCELED: "var(--vz-tijolo)",
  NO_SHOW: "var(--vz-areia-fraca)",
}

type TimelineItem =
  | { kind: "booking"; at: Date; booking: DashboardBooking }
  | { kind: "block"; at: Date; block: DashboardManualBlock }

export default function DayTimeline({
  bookings,
  manualBlocks,
}: {
  bookings: DashboardBooking[]
  manualBlocks: DashboardManualBlock[]
}) {
  const items: TimelineItem[] = [
    ...bookings.map((booking) => ({ kind: "booking" as const, at: booking.scheduledAt, booking })),
    ...manualBlocks.map((block) => ({ kind: "block" as const, at: block.startAt, block })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime())

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhum agendamento ou bloqueio neste dia.</p>
  }

  return (
    <ol className="flex flex-col">
      {items.map((item, i) => {
        if (item.kind === "block") {
          const { block } = item
          return (
            <li key={`block-${block.id}`} className="relative flex gap-3 pb-5 last:pb-0">
              {i < items.length - 1 && <span aria-hidden className="bg-border absolute top-6 bottom-0 left-[47px] w-px" />}
              <span className="text-muted-foreground w-11 shrink-0 pt-2.5 font-mono text-sm tabular-nums">
                {format(block.startAt, "HH:mm")}
              </span>
              <span aria-hidden className="border-background mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 bg-muted-foreground" />
              <div className="bg-secondary flex flex-1 items-start justify-between gap-3 rounded-lg border py-3 pr-3.5 pl-3">
                <div>
                  <p className="text-sm font-semibold">Bloqueado</p>
                  <p className="text-muted-foreground text-xs">
                    {format(block.startAt, "HH:mm")}–{format(block.endAt, "HH:mm")}
                    {block.reason ? ` · ${block.reason}` : ""}
                  </p>
                </div>
                <ManualBlockActions blockId={block.id} />
              </div>
            </li>
          )
        }

        const { booking } = item
        return (
          <li key={booking.id} className="relative flex gap-3 pb-5 last:pb-0">
            {i < items.length - 1 && <span aria-hidden className="bg-border absolute top-6 bottom-0 left-[47px] w-px" />}
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
              style={{ borderColor: "var(--color-border)", borderLeftColor: STATUS_COLOR[booking.status], borderLeftWidth: 3 }}
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
                  <AgendaItemActions
                    bookingId={booking.id}
                    canComplete={booking.scheduledAt <= new Date()}
                  />
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
