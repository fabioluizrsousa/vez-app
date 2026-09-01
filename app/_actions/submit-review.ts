"use server"

import { revalidatePath } from "next/cache"
import { db } from "../_lib/prisma"

export async function submitReview(
  token: string,
  rating: number,
  comment: string,
) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false as const, error: "Escolha uma nota de 1 a 5." }
  }

  const booking = await db.booking.findUnique({
    where: { reviewToken: token },
    include: { professional: true },
  })

  if (!booking) {
    return { ok: false as const, error: "Avaliação não encontrada." }
  }
  if (booking.status === "CANCELED") {
    return { ok: false as const, error: "Esse agendamento foi cancelado." }
  }
  if (booking.scheduledAt > new Date()) {
    return {
      ok: false as const,
      error: "Ainda não é possível avaliar — o atendimento ainda não aconteceu.",
    }
  }
  if (booking.reviewedAt) {
    return { ok: false as const, error: "Você já avaliou esse atendimento." }
  }

  await db.booking.update({
    where: { id: booking.id },
    data: {
      reviewRating: rating,
      reviewComment: comment.trim() || null,
      reviewedAt: new Date(),
    },
  })

  if (booking.professional.slug) {
    revalidatePath(`/${booking.professional.slug}`)
  }

  return {
    ok: true as const,
    googleReviewUrl: booking.professional.googleReviewUrl,
  }
}
