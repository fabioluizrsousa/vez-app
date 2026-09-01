import { db } from "../_lib/prisma"

export async function getProfessionalBySlug(slug: string) {
  const professional = await db.user.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      businessName: true,
      slug: true,
      address: true,
      image: true,
      logoUrl: true,
      cancellationWindowHours: true,
      googleReviewUrl: true,
      services: {
        where: { active: true },
        orderBy: { order: "asc" },
      },
    },
  })

  if (!professional) return null

  // Só entram avaliações de agendamento de verdade (reviewRating setado por
  // quem passou pelo link em app/avaliar/[token]) — por isso dá pra confiar
  // que toda nota exibida veio de alguém que realmente foi atendido.
  const [aggregate, reviews] = await Promise.all([
    db.booking.aggregate({
      where: { professionalId: professional.id, reviewRating: { not: null } },
      _avg: { reviewRating: true },
      _count: { reviewRating: true },
    }),
    db.booking.findMany({
      where: { professionalId: professional.id, reviewRating: { not: null } },
      orderBy: { reviewedAt: "desc" },
      take: 12,
      select: {
        id: true,
        clientName: true,
        reviewRating: true,
        reviewComment: true,
        reviewedAt: true,
        service: { select: { name: true } },
      },
    }),
  ])

  return {
    ...professional,
    reviewCount: aggregate._count.reviewRating,
    reviewAverage: aggregate._avg.reviewRating,
    reviews,
  }
}
