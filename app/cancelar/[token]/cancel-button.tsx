"use client"

import { useState, useTransition } from "react"
import type { BookingStatus } from "@prisma/client"
import { cancelBookingByToken } from "../../_actions/cancel-booking"
import { Button } from "../../_components/ui/button"

export default function CancelButton({
  token,
  status,
}: {
  token: string
  status: BookingStatus
}) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<
    { ok: true } | { ok: false; error: string } | null
  >(null)

  if (status !== "CONFIRMED") {
    return (
      <p className="text-muted-foreground text-sm">
        Esse agendamento já não está mais ativo.
      </p>
    )
  }

  if (result?.ok) {
    return (
      <p className="text-sm">
        Agendamento cancelado. O profissional foi avisado.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {result && !result.ok && (
        <p className="text-destructive text-sm">{result.error}</p>
      )}
      <Button
        variant="destructive"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const r = await cancelBookingByToken(token)
            setResult(r)
          })
        }
      >
        {isPending ? "Cancelando…" : "Confirmar cancelamento"}
      </Button>
    </div>
  )
}
