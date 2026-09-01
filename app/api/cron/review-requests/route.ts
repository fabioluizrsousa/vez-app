import { addMinutes, subDays } from "date-fns"
import { db } from "../../../_lib/prisma"
import { sendWhatsAppTemplate } from "../../../_lib/whatsapp"
import { toWhatsAppE164BR } from "../../../_lib/phone"

// Quanto tempo depois do FIM do atendimento esperar antes de pedir avaliação.
const BUFFER_MINUTES = 120
// Não varre agendamentos além disso pra trás — evita reprocessar o histórico
// inteiro toda vez que o cron roda.
const LOOKBACK_DAYS = 14

/**
 * Varredura periódica (ver vercel.json) que manda o convite de avaliação por
 * WhatsApp pros agendamentos que já aconteceram. Não depende do barbeiro
 * marcar "Concluir" manualmente — dispara pra CONFIRMED e COMPLETED, só não
 * pra CANCELED/NO_SHOW.
 *
 * Enquanto o template `avaliacao_pos_atendimento` não estiver aprovado no
 * WhatsApp Manager (ou as credenciais não estiverem no .env), cada envio
 * volta com skipped:true e o agendamento NÃO é marcado como já processado —
 * assim, assim que a aprovação sair, a próxima execução manda o convite pra
 * tudo que ficou pra trás dentro da janela de 14 dias.
 */
export async function GET(request: Request) {
  if (process.env.CRON_SECRET) {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 })
    }
  }

  const now = new Date()
  const siteUrl = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "")

  const candidates = await db.booking.findMany({
    where: {
      status: { in: ["CONFIRMED", "COMPLETED"] },
      reviewRequestedAt: null,
      scheduledAt: { lte: now, gte: subDays(now, LOOKBACK_DAYS) },
    },
    include: { service: true, professional: true },
    take: 200,
  })

  let sent = 0
  let skipped = 0

  for (const booking of candidates) {
    const endsAt = addMinutes(booking.scheduledAt, booking.service.durationMinutes)
    if (addMinutes(endsAt, BUFFER_MINUTES) > now) continue // ainda dentro do buffer

    const clientE164 = toWhatsAppE164BR(booking.clientPhone)
    if (!clientE164) {
      // Telefone não reconhecido nunca vai virar válido sozinho — marca pra
      // não reprocessar à toa.
      await db.booking.update({
        where: { id: booking.id },
        data: { reviewRequestedAt: now },
      })
      continue
    }

    const businessName =
      booking.professional.businessName || booking.professional.name || "Vez"
    const reviewUrl = `${siteUrl}/avaliar/${booking.reviewToken}`

    const result = await sendWhatsAppTemplate({
      to: clientE164,
      templateName:
        process.env.WHATSAPP_TEMPLATE_AVALIACAO ?? "avaliacao_pos_atendimento",
      params: [booking.clientName.split(" ")[0], businessName, reviewUrl],
    })

    if (result.skipped) {
      skipped++
      continue
    }

    await db.booking.update({
      where: { id: booking.id },
      data: { reviewRequestedAt: now },
    })
    await db.reminderLog.create({
      data: {
        bookingId: booking.id,
        channel: "WHATSAPP",
        status: result.ok ? "SENT" : "FAILED",
      },
    })
    sent++
  }

  return Response.json({ checked: candidates.length, sent, skipped })
}
