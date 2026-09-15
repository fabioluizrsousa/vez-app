"use server"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { revalidatePath } from "next/cache"
import { db } from "../_lib/prisma"
import { requireProfessional } from "../_lib/current-professional"
import { computeSlotsForDate } from "../_lib/get-slots-for-date"
import { isValidWhatsAppBR, toWhatsAppE164BR } from "../_lib/phone"
import { sendWhatsAppTemplate } from "../_lib/whatsapp"

class BookingRejected extends Error {}

function hhmm(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

export async function createProfessionalBooking(input: {
  serviceId: string
  dateISO: string
  clientName: string
  clientPhone: string
  sendConfirmation?: boolean
}) {
  const professional = await requireProfessional()
  const scheduledAt = new Date(input.dateISO)

  if (!input.clientName.trim() || !input.clientPhone.trim()) {
    return { ok: false as const, error: "Preencha nome e WhatsApp." }
  }
  if (!isValidWhatsAppBR(input.clientPhone)) {
    return {
      ok: false as const,
      error: "Informe um celular válido com DDD.",
    }
  }
  if (Number.isNaN(scheduledAt.getTime())) {
    return { ok: false as const, error: "Data ou horário inválido." }
  }

  let booking
  try {
    booking = await db.$transaction(
      async (tx) => {
        const { service, slots } = await computeSlotsForDate(
          tx,
          professional.id,
          input.serviceId,
          input.dateISO,
        )

        if (!service) throw new BookingRejected("Serviço indisponível.")
        if (!slots.includes(hhmm(scheduledAt))) {
          throw new BookingRejected("Esse horário não está mais disponível.")
        }

        return tx.booking.create({
          data: {
            professionalId: professional.id,
            serviceId: input.serviceId,
            scheduledAt,
            clientName: input.clientName.trim(),
            clientPhone: input.clientPhone.trim(),
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
    console.error("Falha ao criar agendamento manual:", error)
    return {
      ok: false as const,
      error: "Não foi possível criar o agendamento. Tente outro horário.",
    }
  }

  let warning: string | undefined
  let whatsappSent = false

  if (input.sendConfirmation !== false) {
    try {
      const clientE164 = toWhatsAppE164BR(input.clientPhone)
      const siteUrl = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "")
      const calendarUrl = `${siteUrl}/api/bookings/${booking.id}/calendar`
      const cancelUrl = `${siteUrl}/cancelar/${booking.cancelToken}`
      const dateLabel = format(booking.scheduledAt, "EEE d/MM", { locale: ptBR })
      const timeLabel = format(booking.scheduledAt, "HH:mm")
      const businessName =
        booking.professional.businessName || booking.professional.name || "Vez"

      if (!clientE164) {
        warning = "Agendamento criado, mas o WhatsApp do cliente é inválido."
      } else {
        const cancellationTemplate =
          process.env.WHATSAPP_TEMPLATE_CLIENTE_CANCELAMENTO ??
          "confirmacao_agendamento_cliente_cancelamento"

        let result = await sendWhatsAppTemplate({
          to: clientE164,
          templateName: cancellationTemplate,
          params: [businessName, dateLabel, timeLabel, calendarUrl, cancelUrl],
        })

        if (!result.ok && !result.skipped) {
          console.error(
            "Falha no template manual com cancelamento; tentando template anterior:",
            result.error,
          )
          result = await sendWhatsAppTemplate({
            to: clientE164,
            templateName:
              process.env.WHATSAPP_TEMPLATE_CLIENTE ??
              "confirmacao_agendamento_cliente",
            params: [businessName, dateLabel, timeLabel, calendarUrl],
          })
        }

        whatsappSent = result.ok
        if (result.skipped) {
          warning = "Agendamento criado, mas o WhatsApp não está configurado."
        } else if (!result.ok) {
          warning = "Agendamento criado, mas não foi possível enviar a confirmação."
          console.error("Falha ao confirmar agendamento manual:", result.error)
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
    } catch (error) {
      warning = "Agendamento criado, mas não foi possível enviar a confirmação."
      console.error("Falha ao enviar confirmação do agendamento manual:", error)
    }
  }

  revalidatePath("/dashboard")
  return { ok: true as const, whatsappSent, warning }
}

export async function getRescheduleSlots(bookingId: string, dateISO: string) {
  const professional = await requireProfessional()
  const booking = await db.booking.findFirst({
    where: {
      id: bookingId,
      professionalId: professional.id,
      status: "CONFIRMED",
    },
    select: { id: true, serviceId: true },
  })

  if (!booking) return [] as string[]

  const { slots } = await computeSlotsForDate(
    db,
    professional.id,
    booking.serviceId,
    dateISO,
    booking.id,
  )
  return slots
}

export async function rescheduleBooking(input: {
  bookingId: string
  dateISO: string
}) {
  const professional = await requireProfessional()
  const scheduledAt = new Date(input.dateISO)

  if (Number.isNaN(scheduledAt.getTime())) {
    return { ok: false as const, error: "Data ou horário inválido." }
  }

  try {
    await db.$transaction(
      async (tx) => {
        const booking = await tx.booking.findFirst({
          where: {
            id: input.bookingId,
            professionalId: professional.id,
            status: "CONFIRMED",
          },
          select: { id: true, serviceId: true },
        })
        if (!booking) {
          throw new BookingRejected("Agendamento não encontrado ou já encerrado.")
        }

        const { service, slots } = await computeSlotsForDate(
          tx,
          professional.id,
          booking.serviceId,
          input.dateISO,
          booking.id,
        )
        if (!service || !slots.includes(hhmm(scheduledAt))) {
          throw new BookingRejected("Esse horário não está mais disponível.")
        }

        await tx.booking.update({
          where: { id: booking.id },
          data: { scheduledAt, canceledAt: null },
        })
      },
      { isolationLevel: "Serializable" },
    )
  } catch (error) {
    if (error instanceof BookingRejected) {
      return { ok: false as const, error: error.message }
    }
    console.error("Falha ao reagendar:", error)
    return {
      ok: false as const,
      error: "Não foi possível reagendar. Escolha outro horário.",
    }
  }

  revalidatePath("/dashboard")
  return { ok: true as const }
}
