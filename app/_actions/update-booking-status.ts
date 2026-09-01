"use server"

import { revalidatePath } from "next/cache"
import { db } from "../_lib/prisma"
import { requireProfessional } from "../_lib/current-professional"
import type { BookingStatus } from "@prisma/client"

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
) {
  const professional = await requireProfessional()

  await db.booking.updateMany({
    where: { id: bookingId, professionalId: professional.id },
    data: {
      status,
      canceledAt: status === "CANCELED" ? new Date() : null,
    },
  })

  revalidatePath("/dashboard")
}
