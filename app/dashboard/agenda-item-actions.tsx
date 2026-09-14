"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateBookingStatus } from "../_actions/update-booking-status"
import { getRescheduleSlots, rescheduleBooking } from "../_actions/professional-bookings"

const ACTION_CLASS =
  "inline-flex h-5 items-center p-0 font-mono text-[10.5px] leading-none uppercase text-muted-foreground"

const SEPARATOR_CLASS =
  "text-border inline-flex h-5 items-center font-mono text-[10.5px] leading-none"

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
    <div className="flex max-w-[270px] flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-x-1.5 gap-y-1">
        <a
          href={`/api/bookings/${bookingId}/calendar`}
          className={`${ACTION_CLASS} hover:text-foreground`}
        >
          Agenda
        </a>
        <span aria-hidden className={SEPARATOR_CLASS}>·</span>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setShowReschedule((v) => !v)}
          className={`${ACTION_CLASS} hover:text-foreground`}
        >
          Reagendar
        </button>
        {canComplete && (
          <>
            <span aria-hidden className={SEPARATOR_CLASS}>·</span>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setStatus("COMPLETED")}
              className={`${ACTION_CLASS} hover:text-success`}
            >
              Concluir
            </button>
            <span aria-hidden className={SEPARATOR_CLASS}>·</span>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setStatus("NO_SHOW")}
              className={`${ACTION_CLASS} hover:text-foreground`}
            >
              Faltou
            </button>
          </>
        )}
        <span aria-hidden className={SEPARATOR_CLASS}>·</span>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setStatus("CANCELED")}
          className={`${ACTION_CLASS} hover:text-destructive`}
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
            className="border-input bg-background w-full rounded border px-2 py-1.5 text-xs"
          />
          <div className="mt-2 flex flex-wrap gap-1">
            {isPending && date && (
              <span className="text-muted-foreground text-xs">Carregando…</span>
            )}
            {slots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setTime(slot)}
                className={`rounded-full border px-2 py-1 font-mono text-[10px] ${
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
            className="text-primary mt-2 text-xs font-semibold"
          >
            Confirmar novo horário
          </button>
        </div>
      )}
      {!showReschedule && error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )
}
