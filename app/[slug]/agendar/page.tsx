import { notFound } from "next/navigation"
import { db } from "../../_lib/prisma"
import { getProfessionalBySlug } from "../../_data/get-professional-by-slug"
import BookingWizard from "./booking-wizard"

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ servico?: string }>
}

export default async function AgendarPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { servico } = await searchParams

  const professional = await getProfessionalBySlug(slug)
  if (!professional) notFound()

  const service = servico
    ? await db.service.findFirst({
        where: { id: servico, professionalId: professional.id, active: true },
      })
    : null

  if (!service) notFound()

  return (
    <BookingWizard
      slug={slug}
      professionalId={professional.id}
      service={{
        id: service.id,
        name: service.name,
        price: Number(service.price),
        durationMinutes: service.durationMinutes,
      }}
    />
  )
}
