import type { BookingStatus } from "@prisma/client"

const LABELS: Record<BookingStatus, string> = {
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
  NO_SHOW: "Não compareceu",
}

const CLASSES: Record<BookingStatus, string> = {
  CONFIRMED: "pill-confirmed",
  COMPLETED: "pill-completed",
  CANCELED: "pill-canceled",
  NO_SHOW: "pill-noshow",
}

const StatusPill = ({ status }: { status: BookingStatus }) => {
  return <span className={CLASSES[status]}>{LABELS[status]}</span>
}

export default StatusPill
