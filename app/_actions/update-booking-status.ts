"use server"

import { revalidatePath } from "next/cache"
import { db } from "../_lib/prisma"
import { requireProfessional } from "../_lib/current-professional"
import type { BookingStatus } from "@prisma/client"

const ALLOWED: BookingStatus[] = ["COMPLETED", "CANCELED", "NO_SHOW"]

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
) {
  const professional = await requireProfessional()

  if (!ALLOWED.includes(status)) {
    return { ok: false as const, error: "Status inválido." }
  }

  const booking = await db.booking.findFirst({
    where: { id: bookingId, professionalId: professional.id },
    select: { id: true, status: true, scheduledAt: true },
  })

  if (!booking) {
    return { ok: false as const, error: "Agendamento não encontrado." }
  }
  if (booking.status !== "CONFIRMED") {
    return { ok: false as const, error: "Esse agendamento já foi encerrado." }
  }
  if ((status === "COMPLETED" || status === "NO_SHOW") && booking.scheduledAt > new Date()) {
    return { ok: false as const, error: "Aguarde o horário do atendimento para encerrar." }
  }

  await db.booking.update({
    where: { id: booking.id },
    data: {
      status,
      canceledAt: status === "CANCELED" ? new Date() : null,
    },
  })

  revalidatePath("/dashboard")
  return { ok: true as const }
}
