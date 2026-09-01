import { addMinutes, isBefore, set, startOfDay } from "date-fns"

interface Availability {
  weekday: number
  startTime: string // "09:00"
  endTime: string // "18:00"
}

interface Interval {
  startAt: Date
  endAt: Date
}

const SLOT_STEP_MINUTES = 30

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return isBefore(aStart, bEnd) && isBefore(bStart, aEnd)
}

/**
 * Calcula os horários livres para um dia, considerando a disponibilidade
 * semanal do profissional, bloqueios manuais e agendamentos já confirmados.
 */
export function getAvailableSlots({
  date,
  durationMinutes,
  availability,
  manualBlocks,
  busyIntervals,
  now = new Date(),
}: {
  date: Date
  durationMinutes: number
  availability: Availability[]
  manualBlocks: Interval[]
  busyIntervals: Interval[]
  now?: Date
}): string[] {
  const weekday = date.getDay()
  const windows = availability.filter((a) => a.weekday === weekday)
  if (windows.length === 0) return []

  const day = startOfDay(date)
  const slots: string[] = []

  for (const window of windows) {
    const windowStartMin = timeToMinutes(window.startTime)
    const windowEndMin = timeToMinutes(window.endTime)

    for (
      let cursor = windowStartMin;
      cursor + durationMinutes <= windowEndMin;
      cursor += SLOT_STEP_MINUTES
    ) {
      const slotStart = set(day, {
        hours: Math.floor(cursor / 60),
        minutes: cursor % 60,
        seconds: 0,
        milliseconds: 0,
      })
      const slotEnd = addMinutes(slotStart, durationMinutes)

      if (isBefore(slotStart, now)) continue

      const blocked =
        manualBlocks.some((b) =>
          overlaps(slotStart, slotEnd, b.startAt, b.endAt),
        ) ||
        busyIntervals.some((b) =>
          overlaps(slotStart, slotEnd, b.startAt, b.endAt),
        )

      if (!blocked) {
        const hh = String(Math.floor(cursor / 60)).padStart(2, "0")
        const mm = String(cursor % 60).padStart(2, "0")
        slots.push(`${hh}:${mm}`)
      }
    }
  }

  return slots
}
