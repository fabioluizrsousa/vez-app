"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateBookingStatus } from "../_actions/update-booking-status"
import { getRescheduleSlots, rescheduleBooking } from "../_actions/professional-bookings"

const ACTION_CLASS =
  "inline-flex min-h-8 items-center justify-center rounded-md border border-input px-2.5 py-1 font-mono text-[10px] font-medium uppercase text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"

export default function AgendaItemActions({
  bookingId,
  canComplete,
}: {
  bookingId: string
  canComplete: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showReschedule, setShowReschedule] = useState(false)
  const [date, setDate] = useState("")
  const [slots, setSlots] = useState<string[]>([])
  const [time, setTime] = useState("")
  const [error, setError] = useState<string | null>(null)

  function setStatus(status: "COMPLETED" | "CANCELED" | "NO_SHOW") {
    setError(null)
    startTransition(async () => {
      const result = await updateBookingStatus(bookingId, status)
      if (!result.ok) setError(result.error)
      router.refresh()
    })
  }

  function loadDate(nextDate: string) {
    setDate(nextDate)
    setTime("")
    setSlots([])
    setError(null)
    if (!nextDate) return
    startTransition(async () => {
      const result = await getRescheduleSlots(bookingId, `${nextDate}T12:00:00`)
      setSlots(result)
    })
  }

  function saveReschedule() {
    if (!date || !time) return
    setError(null)
    startTransition(async () => {
      const result = await rescheduleBooking({ bookingId, dateISO: `${date}T${time}:00` })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setShowReschedule(false)
      setDate("")
      setTime("")
      setSlots([])
      router.refresh()
    })
  }

  return (
    <div className="flex w-full max-w-[360px] flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
        <a
          href={`/api/bookings/${bookingId}/calendar`}
          className={ACTION_CLASS}
        >
          Calendário
        </a>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setShowReschedule((v) => !v)}
          className={ACTION_CLASS}
        >
          Reagendar
        </button>
        {canComplete && (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setStatus("COMPLETED")}
              className={`${ACTION_CLASS} hover:border-success hover:text-success`}
            >
              Concluir
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setStatus("NO_SHOW")}
              className={ACTION_CLASS}
            >
              Faltou
            </button>
          </>
        )}
        <button
          type="button"
          disabled={isPending}
          onClick={() => setStatus("CANCELED")}
          className={`${ACTION_CLASS} hover:border-destructive hover:text-destructive`}
        >
          Cancelar
        </button>
      </div>

      {showReschedule && (
        <div className="bg-secondary w-full rounded-md border p-2 text-left">
          <input
            type="date"
            value={date}
            onChange={(e) => loadDate(e.target.value)}
            className="border-input bg-background w-full rounded border px-2 py-2 text-xs"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {isPending && date && (
              <span className="text-muted-foreground text-xs">Carregando…</span>
            )}
            {slots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setTime(slot)}
                className={`min-h-8 rounded-full border px-2.5 py-1 font-mono text-[10px] ${
                  time === slot ? "bg-foreground text-background" : "bg-background"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
          {error && <p className="text-destructive mt-2 text-xs">{error}</p>}
          <button
            type="button"
            disabled={isPending || !date || !time}
            onClick={saveReschedule}
            className="bg-primary mt-2 min-h-9 rounded-md px-3 text-xs font-semibold text-white disabled:opacity-50"
          >
            Confirmar novo horário
          </button>
        </div>
      )}
      {!showReschedule && error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )
}
