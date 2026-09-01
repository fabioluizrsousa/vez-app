interface CalendarEventInput {
  uid: string
  title: string
  description?: string
  location?: string
  start: Date
  end: Date
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
}

function toICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
}

/**
 * Gera um arquivo .ics (padrão iCalendar) pra um agendamento — é o que faz o
 * "adicionar na agenda do celular" funcionar em qualquer app de calendário
 * (Google Calendar, Apple Calendar, Outlook...), sem depender de nenhuma API
 * externa nem de o barbeiro/cliente ter conta em algum serviço específico.
 *
 * `start`/`end` já são objetos `Date` corretos (o server roda com
 * TZ=America/Sao_Paulo — ver app/_lib/datetime.ts), então `toISOString()`
 * aqui já devolve o instante UTC certo — funciona não importa o fuso do
 * aparelho de quem abrir o arquivo.
 */
export function buildICS({
  uid,
  title,
  description,
  location,
  start,
  end,
}: CalendarEventInput): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vez//Agendamento//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${escapeICSText(title)}`,
  ]
  if (description) lines.push(`DESCRIPTION:${escapeICSText(description)}`)
  if (location) lines.push(`LOCATION:${escapeICSText(location)}`)
  lines.push("END:VEVENT", "END:VCALENDAR")
  return lines.join("\r\n")
}
