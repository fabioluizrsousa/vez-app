import { notFound } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getBookingByReviewToken } from "../../_data/get-booking-by-id"
import Logo from "../../_components/logo"
import { formatBRL } from "../../_lib/format"
import ReviewForm from "./review-form"

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function AvaliarPage({ params }: PageProps) {
  const { token } = await params
  const booking = await getBookingByReviewToken(token)

  if (!booking) notFound()

  const businessName =
    booking.professional.businessName || booking.professional.name || "o profissional"

  return (
    <div className="min-h-screen bg-background">
      <header className="border-border flex items-center border-b px-4 py-4">
        <Logo href={null} />
      </header>

      <div className="mx-auto max-w-sm px-5 py-10">
        <h1 className="font-display mb-1 text-xl font-extrabold">
          Como foi seu atendimento?
        </h1>
        <p className="text-muted-foreground mb-5 text-sm">
          Sua nota ajuda outras pessoas a conhecerem {businessName}.
        </p>

        <div className="bg-secondary mb-6 flex flex-col gap-1.5 rounded-lg px-3.5 py-3 text-sm">
          <div className="flex justify-between">
            <span>{booking.service.name}</span>
            <span className="font-mono">{formatBRL(booking.service.price)}</span>
          </div>
          <div className="flex justify-between">
            <span>{format(booking.scheduledAt, "EEE, d 'de' MMM.", { locale: ptBR })}</span>
            <span className="font-mono">{format(booking.scheduledAt, "HH:mm")}</span>
          </div>
          <div className="text-muted-foreground text-xs">Com {businessName}</div>
        </div>

        <ReviewForm
          token={token}
          status={booking.status}
          scheduledAt={booking.scheduledAt.toISOString()}
          alreadyReviewed={Boolean(booking.reviewedAt)}
          googleReviewUrl={booking.professional.googleReviewUrl}
        />
      </div>
    </div>
  )
}
