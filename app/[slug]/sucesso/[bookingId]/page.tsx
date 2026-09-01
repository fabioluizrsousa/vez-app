import { notFound } from "next/navigation"
import { CheckIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getBookingById } from "../../../_data/get-booking-by-id"
import Logo from "../../../_components/logo"

interface PageProps {
  params: Promise<{ slug: string; bookingId: string }>
}

export default async function SucessoPage({ params }: PageProps) {
  const { bookingId } = await params
  const booking = await getBookingById(bookingId)

  if (!booking) notFound()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-border flex items-center border-b px-4 py-4">
        <Logo href={null} />
      </header>

      <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
        <div className="bg-success text-success-foreground flex h-12 w-12 items-center justify-center rounded-full">
          <CheckIcon className="h-6 w-6" />
        </div>
        <h1 className="font-display text-xl font-extrabold">
          Reserva Confirmada
        </h1>
        <p className="text-muted-foreground max-w-[26ch] text-sm">
          {booking.service.name} com {booking.professional.businessName ||
            booking.professional.name}
          , {format(booking.scheduledAt, "EEE d/MM", { locale: ptBR })} às{" "}
          {format(booking.scheduledAt, "HH:mm")}.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <a
            href={`/api/bookings/${booking.id}/calendar`}
            className="border-border hover:bg-secondary rounded-md border px-3.5 py-2 text-xs font-semibold"
          >
            Adicionar na agenda do celular
          </a>
          {booking.professional.address && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${booking.professional.businessName || booking.professional.name} ${booking.professional.address}`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border hover:bg-secondary rounded-md border px-3.5 py-2 text-xs font-semibold"
            >
              Ver no mapa
            </a>
          )}
        </div>

        <div className="bg-secondary text-muted-foreground max-w-[30ch] rounded-lg px-3.5 py-2.5 text-xs">
          Pode cancelar até {booking.professional.cancellationWindowHours}h
          antes pelo link:{" "}
          <a
            href={`/cancelar/${booking.cancelToken}`}
            className="text-primary underline"
          >
            cancelar agendamento
          </a>
          .
        </div>
      </div>
    </div>
  )
}
