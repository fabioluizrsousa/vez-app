// Aceita number/string e também o Decimal do Prisma (tem toString()).
export function formatBRL(value: number | string | { toString(): string }) {
  const n = typeof value === "number" ? value : Number(value.toString())
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n)
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h${m}min`
}

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export function weekdayLabel(weekday: number) {
  return WEEKDAY_LABELS[weekday] ?? ""
}
