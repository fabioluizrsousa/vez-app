"use client"

import { useTransition } from "react"
import { updateBookingStatus } from "../_actions/update-booking-status"

export default function AgendaItemActions({
  bookingId,
  canComplete,
}: {
  bookingId: string
  // "Concluir" só faz sentido depois que o horário já passou — pra
  // agendamentos futuros (visíveis desde que a agenda ganhou navegação por
  // data) esse botão fica escondido, só o "Cancelar" continua disponível.
  canComplete: boolean
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-1.5">
      <a
        href={`/api/bookings/${bookingId}/calendar`}
        className="text-muted-foreground hover:text-foreground font-mono text-[10.5px] uppercase"
      >
        Agenda
      </a>
      <span className="text-border">·</span>
      {canComplete && (
        <>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(() => updateBookingStatus(bookingId, "COMPLETED"))
            }
            className="text-muted-foreground hover:text-success font-mono text-[10.5px] uppercase"
          >
            Concluir
          </button>
          <span className="text-border">·</span>
        </>
      )}
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(() => updateBookingStatus(bookingId, "CANCELED"))
        }
        className="text-muted-foreground hover:text-destructive font-mono text-[10.5px] uppercase"
      >
        Cancelar
      </button>
    </div>
  )
}
