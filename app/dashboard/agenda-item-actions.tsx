"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateBookingStatus } from "../_actions/update-booking-status"
import { getRescheduleSlots, rescheduleBooking } from "../_actions/professional-bookings"

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
      <div className="flex flex-wrap justify-end gap-1.5">
        <a href={`/api/bookings/${bookingId}/calendar`} className="text-muted-foreground hover:text-foreground font-mono text-[10.5px] uppercase">
          Agenda
        </a>
        <span className="text-border">·</span>
        <button type="button" disabled={isPending} onClick={() => setShowReschedule((v) => !v)} className="text-muted-foreground hover:text-foreground font-mono text-[10.5px] uppercase">
          Reagendar
        </button>
        {canComplete && (
          <>
            <span className="text-border">·</span>
            <button type="button" disabled={isPending} onClick={() => setStatus("COMPLETED")} className="text-muted-foreground hover:text-success font-mono text-[10.5px] uppercase">
              Concluir
            </button>
            <span className="text-border">·</span>
            <button type="button" disabled={isPending} onClick={() => setStatus("NO_SHOW")} className="text-muted-foreground hover:text-foreground font-mono text-[10.5px] uppercase">
              Faltou
            </button>
          </>
        )}
        <span className="text-border">·</span>
        <button type="button" disabled={isPending} onClick={() => setStatus("CANCELED")} className="text-muted-foreground hover:text-destructive font-mono text-[10.5px] uppercase">
          Cancelar
        </button>
      </div>

      {showReschedule && (
        <div className="bg-secondary w-full rounded-md border p-2 text-left">
          <input type="date" value={date} onChange={(e) => loadDate(e.target.value)} className="border-input bg-background w-full rounded border px-2 py-1.5 text-xs" />
          <div className="mt-2 flex flex-wrap gap-1">
            {isPending && date && <span className="text-muted-foreground text-xs">Carregando…</span>}
            {slots.map((slot) => (
              <button key={slot} type="button" onClick={() => setTime(slot)} className={`rounded-full border px-2 py-1 font-mono text-[10px] ${time === slot ? "bg-foreground text-background" : "bg-background"}`}>
                {slot}
              </button>
            ))}
          </div>
          {error && <p className="text-destructive mt-2 text-xs">{error}</p>}
          <button type="button" disabled={isPending || !date || !time} onClick={saveReschedule} className="text-primary mt-2 text-xs font-semibold">
            Confirmar novo horário
          </button>
        </div>
      )}
      {!showReschedule && error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )
}
