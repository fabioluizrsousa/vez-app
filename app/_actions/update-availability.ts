"use server"

import { revalidatePath } from "next/cache"
import { db } from "../_lib/prisma"
import { requireProfessional } from "../_lib/current-professional"

export interface AvailabilityInput {
  weekday: number
  startTime: string
  endTime: string
}

/** Substitui toda a disponibilidade semanal do profissional pela lista enviada. */
export async function replaceAvailability(items: AvailabilityInput[]) {
  const professional = await requireProfessional()

  await db.$transaction([
    db.availability.deleteMany({ where: { professionalId: professional.id } }),
    db.availability.createMany({
      data: items.map((item) => ({
        professionalId: professional.id,
        weekday: item.weekday,
        startTime: item.startTime,
        endTime: item.endTime,
      })),
    }),
  ])

  revalidatePath("/dashboard/negocio")
}
