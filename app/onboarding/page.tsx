import { redirect } from "next/navigation"
import { requireProfessional } from "../_lib/current-professional"
import Logo from "../_components/logo"
import BusinessProfileForm from "../dashboard/negocio/business-profile-form"

export default async function OnboardingPage() {
  const professional = await requireProfessional()
  if (professional.onboarded) redirect("/dashboard")

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6 py-16">
      <Logo href={null} />
      <div>
        <h1 className="font-display text-xl font-extrabold">
          Vamos preparar sua agenda
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Leva 2 minutos. Depois você configura os serviços e a disponibilidade.
        </p>
      </div>
      <BusinessProfileForm
        slug={null}
        redirectTo="/dashboard/negocio"
                initial={{
          businessName: professional.businessName ?? professional.name ?? "",
          phone: professional.phone ?? "",
          address: professional.address ?? "",
          cancellationWindowHours: professional.cancellationWindowHours,
          googleReviewUrl: professional.googleReviewUrl ?? "",
          image: professional.image,
          logoUrl: professional.logoUrl,
        }}
      />
    </div>
  )
}
