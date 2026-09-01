import { endOfDay, startOfDay } from "date-fns"
import type { Prisma, PrismaClient } from "@prisma/client"
import { getAvailableSlots } from "./slots"

// Aceita tanto o client normal (`db`) quanto um client de transação
// (`tx` dentro de `db.$transaction(async (tx) => ...)`) — é por isso que
// essa lógica não vive direto em get-available-slots.ts (que é "use server"
// e não pode ganhar um parâmetro extra não serializável sem risco de quebrar
// a chamada como Server Action a partir do client).
type QueryClient = PrismaClient | Prisma.TransactionClient

/**
 * Busca o serviço (já validando que pertence a esse profissional e está
 * ativo — sem isso dava pra agendar o serviço de outro profissional, ou um
 * serviço pausado, chamando a Server Action direto) e calcula os horários
 * livres do dia pra ele.
 */
export async function computeSlotsForDate(
  client: QueryClient,
  professionalId: string,
  serviceId: string,
  dateISO: string,
) {
  const date = new Date(dateISO)

  const [service, availability, manualBlocks, bookings] = await Promise.all([
    client.service.findFirst({
      where: { id: serviceId, professionalId, active: true },
    }),
    client.availability.findMany({ where: { professionalId } }),
    client.manualBlock.findMany({
      where: {
        professionalId,
        startAt: { lte: endOfDay(date) },
        endAt: { gte: startOfDay(date) },
      },
    }),
    client.booking.findMany({
      where: {
        professionalId,
        status: "CONFIRMED",
        scheduledAt: { gte: startOfDay(date), lte: endOfDay(date) },
      },
      include: { service: true },
    }),
  ])

  if (!service) return { service: null, slots: [] as string[] }

  const slots = getAvailableSlots({
    date,
    durationMinutes: service.durationMinutes,
    availability,
    manualBlocks: manualBlocks.map((b) => ({ startAt: b.startAt, endAt: b.endAt })),
    busyIntervals: bookings.map((b) => ({
      startAt: b.scheduledAt,
      endAt: new Date(b.scheduledAt.getTime() + b.service.durationMinutes * 60000),
    })),
  })

  return { service, slots }
}
