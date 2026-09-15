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

class BookingRejected extends Error {}

export async function createBooking(input: CreateBookingInput) {
  const { professionalId, serviceId, dateISO, clientName, clientPhone } = input

  if (!clientName.trim() || !clientPhone.trim()) {
    return { ok: false as const, error: "Preencha nome e WhatsApp." }
  }

  const clientE164 = toWhatsAppE164BR(clientPhone)
  if (!clientE164) {
    return {
      ok: false as const,
      error: "Informe um WhatsApp válido com DDD.",
    }
  }

  const scheduledAt = new Date(dateISO)
  const hh = String(scheduledAt.getHours()).padStart(2, "0")
  const mm = String(scheduledAt.getMinutes()).padStart(2, "0")

  let booking
  try {
    booking = await db.$transaction(
      async (tx) => {
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
    console.error("Falha ao criar agendamento:", error)
    return {
      ok: false as const,
      error: "Esse horário acabou de ser preenchido. Escolha outro.",
    }
  }

  try {
    const siteUrl = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "")
    const calendarUrl = `${siteUrl}/api/bookings/${booking.id}/calendar`
    const cancelUrl = `${siteUrl}/cancelar/${booking.cancelToken}`
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
      if (!result.ok && !result.skipped) {
        console.error("Falha ao notificar barbeiro no WhatsApp:", result.error)
      }
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

    const cancellationTemplate =
      process.env.WHATSAPP_TEMPLATE_CLIENTE_CANCELAMENTO ??
      "confirmacao_agendamento_cliente_cancelamento"

    let clientResult = await sendWhatsAppTemplate({
      to: clientE164,
      templateName: cancellationTemplate,
      params: [businessName, dateLabel, timeLabel, calendarUrl, cancelUrl],
    })

    if (!clientResult.ok && !clientResult.skipped) {
      console.error(
        "Falha no template com cancelamento; tentando template anterior:",
        clientResult.error,
      )
      clientResult = await sendWhatsAppTemplate({
        to: clientE164,
        templateName:
          process.env.WHATSAPP_TEMPLATE_CLIENTE ??
          "confirmacao_agendamento_cliente",
        params: [businessName, dateLabel, timeLabel, calendarUrl],
      })
    }

    if (!clientResult.ok && !clientResult.skipped) {
      console.error(
        "Falha ao notificar cliente no WhatsApp:",
        clientResult.error,
      )
    }
    if (!clientResult.skipped) {
      await db.reminderLog.create({
        data: {
          bookingId: booking.id,
          channel: "WHATSAPP",
          status: clientResult.ok ? "SENT" : "FAILED",
        },
      })
    }
  } catch (error) {
    console.error("Falha ao enviar aviso de WhatsApp:", error)
  }

  return { ok: true as const, bookingId: booking.id }
}
