"use server"

import { revalidatePath } from "next/cache"
import { db } from "../_lib/prisma"
import { requireProfessional } from "../_lib/current-professional"

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd
}

export async function createManualBlock(input: {
  startISO: string
  endISO: string
  reason?: string
}) {
  const professional = await requireProfessional()
  const startAt = new Date(input.startISO)
  const endAt = new Date(input.endISO)

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return { ok: false as const, error: "Data ou horário inválido." }
  }
  if (endAt <= startAt) {
    return {
      ok: false as const,
      error: "O horário final precisa ser depois do horário inicial.",
    }
  }

  const [bookings, overlappingBlock] = await Promise.all([
    db.booking.findMany({
      where: {
        professionalId: professional.id,
        status: "CONFIRMED",
        scheduledAt: { lt: endAt },
      },
      include: { service: { select: { durationMinutes: true } } },
    }),
    db.manualBlock.findFirst({
      where: {
        professionalId: professional.id,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    }),
  ])

  const conflictsWithBooking = bookings.some((booking) => {
    const bookingEnd = new Date(
      booking.scheduledAt.getTime() + booking.service.durationMinutes * 60_000,
    )
    return overlaps(startAt, endAt, booking.scheduledAt, bookingEnd)
  })

  if (conflictsWithBooking) {
    return {
      ok: false as const,
      error: "Existe um agendamento nesse período. Cancele ou reagende antes de bloquear.",
    }
  }

  if (overlappingBlock) {
    return {
      ok: false as const,
      error: "Esse período já possui um bloqueio.",
    }
  }

  await db.manualBlock.create({
    data: {
      professionalId: professional.id,
      startAt,
      endAt,
      reason: input.reason?.trim() || null,
    },
  })

  revalidatePath("/dashboard")
  return { ok: true as const }
}

export async function deleteManualBlock(blockId: string) {
  const professional = await requireProfessional()

  await db.manualBlock.deleteMany({
    where: { id: blockId, professionalId: professional.id },
  })

  revalidatePath("/dashboard")
  return { ok: true as const }
}
