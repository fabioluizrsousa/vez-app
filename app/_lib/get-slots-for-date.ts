import { endOfDay, startOfDay } from "date-fns"
import type { Prisma, PrismaClient } from "@prisma/client"
import { getAvailableSlots } from "./slots"

type QueryClient = PrismaClient | Prisma.TransactionClient

export async function computeSlotsForDate(
  client: QueryClient,
  professionalId: string,
  serviceId: string,
  dateISO: string,
  excludeBookingId?: string,
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
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
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
