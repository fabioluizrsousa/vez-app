import { db } from "../_lib/prisma"

export async function getBookingById(id: string) {
  return db.booking.findUnique({
    where: { id },
    include: { service: true, professional: true },
  })
}

export async function getBookingByCancelToken(token: string) {
  return db.booking.findUnique({
    where: { cancelToken: token },
    include: { service: true, professional: true },
  })
}

export async function getBookingByReviewToken(token: string) {
  return db.booking.findUnique({
    where: { reviewToken: token },
    include: { service: true, professional: true },
  })
}
