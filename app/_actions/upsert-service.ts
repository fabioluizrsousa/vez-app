"use server"

import { revalidatePath } from "next/cache"
import { db } from "../_lib/prisma"
import { requireProfessional } from "../_lib/current-professional"

export interface ServiceInput {
  id?: string
  name: string
  durationMinutes: number
  price: number
  description?: string
}

export async function upsertService(input: ServiceInput) {
  const professional = await requireProfessional()

  if (!input.name.trim()) {
    return { ok: false as const, error: "Dê um nome ao serviço." }
  }
  if (!Number.isFinite(input.durationMinutes) || input.durationMinutes <= 0) {
    return { ok: false as const, error: "A duração precisa ser maior que zero." }
  }
  if (!Number.isFinite(input.price) || input.price < 0) {
    return { ok: false as const, error: "O preço não pode ser negativo." }
  }

  if (input.id) {
    await db.service.updateMany({
      where: { id: input.id, professionalId: professional.id },
      data: {
        name: input.name.trim(),
        durationMinutes: input.durationMinutes,
        price: input.price,
        description: input.description?.trim() || null,
      },
    })
  } else {
    const count = await db.service.count({
      where: { professionalId: professional.id },
    })
    await db.service.create({
      data: {
        professionalId: professional.id,
        name: input.name.trim(),
        durationMinutes: input.durationMinutes,
        price: input.price,
        description: input.description?.trim() || null,
        order: count,
      },
    })
  }

  revalidatePath("/dashboard/servicos")
  return { ok: true as const }
}

export async function toggleServiceActive(serviceId: string, active: boolean) {
  const professional = await requireProfessional()

  await db.service.updateMany({
    where: { id: serviceId, professionalId: professional.id },
    data: { active },
  })

  revalidatePath("/dashboard/servicos")
}
