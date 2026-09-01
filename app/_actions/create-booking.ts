"use server"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { db } from "../_lib/prisma"
import { computeSlotsForDate } from "../_lib/get-slots-for-date"
import { sendWhatsAppTemplate } from "../_lib/whatsapp"
import { toWhatsAppE164BR } from "../_lib/phone"

interface CreateBookingInput {
  professionalId: string
  serviceId: string
  dateISO: string // data + hora já combinadas, ex: 2026-09-03T14:30:00
  clientName: string
  clientPhone: string
}

// Erro "esperado" (serviço inválido / horário ocupado) — distingue de um
// erro de infra de verdade no catch lá embaixo.
class BookingRejected extends Error {}

export async function createBooking(input: CreateBookingInput) {
  const { professionalId, serviceId, dateISO, clientName, clientPhone } = input

  if (!clientName.trim() || !clientPhone.trim()) {
    return { ok: false as const, error: "Preencha nome e WhatsApp." }
  }

  const scheduledAt = new Date(dateISO)
  const hh = String(scheduledAt.getHours()).padStart(2, "0")
  const mm = String(scheduledAt.getMinutes()).padStart(2, "0")

  let booking
  try {
    // Isolamento Serializable: a checagem de horário livre e a criação do
    // agendamento acontecem como se fossem a única coisa rodando no banco
    // nesse instante. Se duas pessoas confirmarem o mesmo horário ao mesmo
    // tempo, o Postgres deixa uma das duas transações completar e força a
    // outra a falhar (em vez das duas passarem pela checagem antes de
    // qualquer uma ter inserido, que é a corrida que só reconferir os slots
    // antes do create — sem transação — não fecha).
    booking = await db.$transaction(
      async (tx) => {
        // Também valida que o serviço é desse profissional e está ativo —
        // sem isso dava pra chamar essa action direto com o serviceId de
        // outro profissional (ou de um serviço pausado) e criar um
        // agendamento com duração/preço de um serviço que não é esse.
        const { service, slots } = await computeSlotsForDate(
          tx,
          professionalId,
          serviceId,
          dateISO,
        )

        if (!service) {
          throw new BookingRejected("Serviço não encontrado ou indisponível.")
        }
        if (!slots.includes(`${hh}:${mm}`)) {
          throw new BookingRejected(
            "Esse horário acabou de ser preenchido. Escolha outro.",
          )
        }

        return tx.booking.create({
          data: {
            professionalId,
            serviceId,
            scheduledAt,
            clientName: clientName.trim(),
            clientPhone: clientPhone.trim(),
          },
          include: { service: true, professional: true },
        })
      },
      { isolationLevel: "Serializable" },
    )
  } catch (error) {
    if (error instanceof BookingRejected) {
      return { ok: false as const, error: error.message }
    }
    // Conflito de serialização do Postgres (a corrida de verdade entre duas
    // transações concorrentes) também cai aqui — pro cliente, é o mesmo
    // "esse horário acabou de ser preenchido".
    console.error("Falha ao criar agendamento:", error)
    return {
      ok: false as const,
      error: "Esse horário acabou de ser preenchido. Escolha outro.",
    }
  }

  // Aviso via WhatsApp Business Platform (Meta Cloud API) pro barbeiro e
  // confirmação pro cliente — nunca deve derrubar a criação do agendamento
  // em si (já concluída acima), por isso tudo aqui é best-effort dentro de
  // um try/catch. Sem WHATSAPP_ACCESS_TOKEN/WHATSAPP_PHONE_NUMBER_ID no
  // .env, sendWhatsAppTemplate só retorna skipped:true e nada é enviado —
  // ver README para o passo a passo de configuração na Meta e o texto dos
  // templates que precisam estar aprovados lá.
  try {
    const siteUrl = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "")
    const calendarUrl = `${siteUrl}/api/bookings/${booking.id}/calendar`
    const dashboardUrl = `${siteUrl}/dashboard`
    const dateLabel = format(booking.scheduledAt, "EEE d/MM", { locale: ptBR })
    const timeLabel = format(booking.scheduledAt, "HH:mm")
    const businessName =
      booking.professional.businessName || booking.professional.name || "Vez"

    const barberPhone = booking.professional.phone
      ? toWhatsAppE164BR(booking.professional.phone)
      : null
    if (barberPhone) {
      const result = await sendWhatsAppTemplate({
        to: barberPhone,
        templateName:
          process.env.WHATSAPP_TEMPLATE_BARBEIRO ?? "novo_agendamento_barbeiro",
        params: [
          clientName.trim(),
          booking.service.name,
          dateLabel,
          timeLabel,
          dashboardUrl,
          calendarUrl,
        ],
      })
      if (!result.skipped) {
        await db.reminderLog.create({
          data: {
            bookingId: booking.id,
            channel: "WHATSAPP",
            status: result.ok ? "SENT" : "FAILED",
          },
        })
      }
    }

    const clientE164 = toWhatsAppE164BR(clientPhone)
    if (clientE164) {
      const result = await sendWhatsAppTemplate({
        to: clientE164,
        templateName:
          process.env.WHATSAPP_TEMPLATE_CLIENTE ??
          "confirmacao_agendamento_cliente",
        params: [businessName, dateLabel, timeLabel, calendarUrl],
      })
      if (!result.skipped) {
        await db.reminderLog.create({
          data: {
            bookingId: booking.id,
            channel: "WHATSAPP",
            status: result.ok ? "SENT" : "FAILED",
          },
        })
      }
    }
  } catch (error) {
    console.error("Falha ao enviar aviso de WhatsApp:", error)
  }

  return { ok: true as const, bookingId: booking.id }
}
