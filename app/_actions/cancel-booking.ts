"use server"

import { differenceInHours } from "date-fns"
import { db } from "../_lib/prisma"

export async function cancelBookingByToken(token: string) {
  const booking = await db.booking.findUnique({
    where: { cancelToken: token },
    include: { professional: true },
  })

  if (!booking) {
    return { ok: false as const, error: "Agendamento não encontrado." }
  }
  if (booking.status !== "CONFIRMED") {
    return { ok: false as const, error: "Esse agendamento já não está mais ativo." }
  }

  const hoursUntil = differenceInHours(booking.scheduledAt, new Date())
  if (hoursUntil < booking.professional.cancellationWindowHours) {
    return {
      ok: false as const,
      error: `Esse agendamento só pode ser cancelado até ${booking.professional.cancellationWindowHours}h antes do horário.`,
    }
  }

  await db.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELED", canceledAt: new Date() },
  })

  return { ok: true as const }
}
