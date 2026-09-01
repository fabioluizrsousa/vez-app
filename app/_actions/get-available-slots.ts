"use server"

import { db } from "../_lib/prisma"
import { computeSlotsForDate } from "../_lib/get-slots-for-date"

export async function getSlotsForDate(
  professionalId: string,
  serviceId: string,
  dateISO: string,
) {
  const { slots } = await computeSlotsForDate(db, professionalId, serviceId, dateISO)
  return slots
}
