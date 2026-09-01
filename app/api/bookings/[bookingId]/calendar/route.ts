import { NextResponse } from "next/server"
import { addMinutes } from "date-fns"
import { getBookingById } from "../../../../_data/get-booking-by-id"
import { buildICS } from "../../../../_lib/calendar-event"

// GET /api/bookings/[bookingId]/calendar — devolve um .ics pra "adicionar na
// agenda do celular", tanto pro cliente (link na tela de sucesso) quanto pro
// barbeiro (link na agenda do dashboard). O bookingId funciona como acesso
// aqui — mesmo padrão já usado por getBookingById na tela de sucesso, que
// também não exige login: é um UUID não adivinhável, e o dado exposto (um
// evento de agenda) não é sensível.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await params
  const booking = await getBookingById(bookingId)

  if (!booking) {
    return new NextResponse("Agendamento não encontrado.", { status: 404 })
  }

  const businessName =
    booking.professional.businessName || booking.professional.name || "Vez"

  const ics = buildICS({
    uid: `${booking.id}@vez.app`,
    title: `${booking.service.name} — ${businessName}`,
    description: `Agendamento de ${booking.clientName} — ${booking.service.name}.`,
    location: booking.professional.address ?? undefined,
    start: booking.scheduledAt,
    end: addMinutes(booking.scheduledAt, booking.service.durationMinutes),
  })

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="agendamento.ics"',
    },
  })
}
