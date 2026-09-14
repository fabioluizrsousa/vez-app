import { NextResponse } from "next/server"
import { addMinutes, format } from "date-fns"
import { getBookingById } from "../../../../_data/get-booking-by-id"
import { buildICS } from "../../../../_lib/calendar-event"

// Nome de arquivo descritivo (ex: "corte-fabio-14-09.ics") em vez do genérico
// "agendamento.ics" — assim quem baixa vários agendamentos consegue
// diferenciar os arquivos só pelo nome. Remove acentos e qualquer caractere
// fora de a-z0-9 pra ficar seguro em qualquer sistema de arquivos/header.
function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function buildFileName(serviceName: string, clientName: string, date: Date): string {
  const slug = [slugify(serviceName), slugify(clientName), format(date, "dd-MM")]
    .filter(Boolean)
    .join("-")
  return `${slug || "agendamento"}.ics`
}

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

  const fileName = buildFileName(
    booking.service.name,
    booking.clientName,
    booking.scheduledAt,
  )

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  })
}
