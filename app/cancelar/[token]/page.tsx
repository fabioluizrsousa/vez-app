import { notFound } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getBookingByCancelToken } from "../../_data/get-booking-by-id"
import Logo from "../../_components/logo"
import { formatBRL } from "../../_lib/format"
import CancelButton from "./cancel-button"

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function CancelarPage({ params }: PageProps) {
  const { token } = await params
  const booking = await getBookingByCancelToken(token)

  if (!booking) notFound()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-border flex items-center border-b px-4 py-4">
        <Logo href={null} />
      </header>

      <div className="mx-auto max-w-sm px-5 py-10">
        <h1 className="font-display mb-5 text-xl font-extrabold">
          Cancelar agendamento
        </h1>

        <div className="bg-secondary mb-6 flex flex-col gap-1.5 rounded-lg px-3.5 py-3 text-sm">
          <div className="flex justify-between">
            <span>{booking.service.name}</span>
            <span className="font-mono">{formatBRL(booking.service.price)}</span>
          </div>
          <div className="flex justify-between">
            <span>{format(booking.scheduledAt, "EEE, d 'de' MMM.", { locale: ptBR })}</span>
            <span className="font-mono">{format(booking.scheduledAt, "HH:mm")}</span>
          </div>
          <div className="text-muted-foreground text-xs">
            Com {booking.professional.businessName || booking.professional.name}
          </div>
        </div>

        <CancelButton token={token} status={booking.status} />
      </div>
    </div>
  )
}
