import { requireProfessional } from "../../_lib/current-professional"
import { db } from "../../_lib/prisma"
import BusinessProfileForm from "./business-profile-form"
import AvailabilityEditor from "./availability-editor"

export default async function NegocioPage() {
  const professional = await requireProfessional()
  const availability = await db.availability.findMany({
    where: { professionalId: professional.id },
  })

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-display mb-5 text-xl font-extrabold">
          Meu negócio
        </h1>
        <BusinessProfileForm
          slug={professional.slug}
          initial={{
            businessName: professional.businessName ?? "",
            phone: professional.phone ?? "",
            address: professional.address ?? "",
            cancellationWindowHours: professional.cancellationWindowHours,
            googleReviewUrl: professional.googleReviewUrl ?? "",
            image: professional.image,
            logoUrl: professional.logoUrl,
          }}
        />
      </div>

      <div>
        <h2 className="font-display mb-1 text-lg font-extrabold">
          Disponibilidade
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Os dias e horários que você atende — é o que define os horários que
          aparecem pro cliente.
        </p>
        <AvailabilityEditor
          initial={availability.map((a) => ({
            weekday: a.weekday,
            startTime: a.startTime,
            endTime: a.endTime,
          }))}
        />
      </div>
    </div>
  )
}
