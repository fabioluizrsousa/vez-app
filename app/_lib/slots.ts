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
 *
 * Compatibilidade com o editor antigo: ele sugeria "Adicionar intervalo
 * (ex: almoço)", mas salvava esse intervalo como uma segunda janela de
 * disponibilidade. Quando uma janela está estritamente contida em outra
 * (ex: 09:00-18:00 + 12:00-13:00), tratamos a menor como pausa. O formato
 * correto continua sendo duas janelas: 09:00-12:00 e 13:00-18:00.
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
  const rawWindows = availability
    .filter((a) => a.weekday === weekday)
    .map((window) => ({
      ...window,
      startMin: timeToMinutes(window.startTime),
      endMin: timeToMinutes(window.endTime),
    }))
    .filter((window) => window.startMin < window.endMin)

  if (rawWindows.length === 0) return []

  // O editor antigo podia salvar 09:00-18:00 junto com 12:00-13:00 quando o
  // usuário queria cadastrar almoço. Uma janela estritamente contida em outra
  // é portanto interpretada como pausa, não como período adicional de trabalho.
  const legacyBreaks = rawWindows.filter((candidate) =>
    rawWindows.some(
      (parent) =>
        parent !== candidate &&
        parent.startMin <= candidate.startMin &&
        parent.endMin >= candidate.endMin &&
        (parent.startMin < candidate.startMin || parent.endMin > candidate.endMin),
    ),
  )

  const windows = rawWindows.filter((window) => !legacyBreaks.includes(window))
  const day = startOfDay(date)
  const slots: string[] = []

  for (const window of windows) {
    for (
      let cursor = window.startMin;
      cursor + durationMinutes <= window.endMin;
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

      const blockedByLegacyBreak = legacyBreaks.some((breakWindow) => {
        const breakStart = set(day, {
          hours: Math.floor(breakWindow.startMin / 60),
          minutes: breakWindow.startMin % 60,
          seconds: 0,
          milliseconds: 0,
        })
        const breakEnd = set(day, {
          hours: Math.floor(breakWindow.endMin / 60),
          minutes: breakWindow.endMin % 60,
          seconds: 0,
          milliseconds: 0,
        })
        return overlaps(slotStart, slotEnd, breakStart, breakEnd)
      })

      const blocked =
        blockedByLegacyBreak ||
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

  // Faixas parcialmente sobrepostas ainda podem gerar o mesmo horário mais
  // de uma vez. O Set remove duplicidades e o sort mantém a sequência correta.
  return Array.from(new Set(slots)).sort((a, b) => a.localeCompare(b))
}
