import { endOfDay, startOfDay } from "date-fns"
import { db } from "../_lib/prisma"

export async function getDayAgenda(professionalId: string, date: Date) {
  const bookings = await db.booking.findMany({
    where: {
      professionalId,
      scheduledAt: { gte: startOfDay(date), lte: endOfDay(date) },
    },
    include: { service: true },
    orderBy: { scheduledAt: "asc" },
  })

  const completed = bookings.filter((b) => b.status === "COMPLETED")
  const revenueToday = completed.reduce(
    (sum, b) => sum + Number(b.service.price),
    0,
  )

  return {
    bookings,
    revenueToday,
    countToday: bookings.filter((b) => b.status !== "CANCELED").length,
  }
}
