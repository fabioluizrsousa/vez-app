"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { addDays, format, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeftIcon } from "lucide-react"
import { getSlotsForDate } from "../../_actions/get-available-slots"
import { createBooking } from "../../_actions/create-booking"
import { formatBRL, formatDuration } from "../../_lib/format"
import { toLocalISO } from "../../_lib/datetime"
import { cn } from "../../_lib/utils"
import { Button } from "../../_components/ui/button"

interface Service {
  id: string
  name: string
  price: number
  durationMinutes: number
}

interface BookingWizardProps {
  slug: string
  professionalId: string
  service: Service
}

const NEXT_DAYS = 14

export default function BookingWizard({
  slug,
  professionalId,
  service,
}: BookingWizardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [step, setStep] = useState<1 | 2>(1)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(true)

  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [error, setError] = useState<string | null>(null)

  const days = useMemo(
    () => Array.from({ length: NEXT_DAYS }, (_, i) => addDays(new Date(), i)),
    [],
  )

  function selectDate(date: Date) {
    setSelectedDate(date)
    setSelectedTime(null)
    setLoadingSlots(true)
    startTransition(async () => {
      const result = await getSlotsForDate(
        professionalId,
        service.id,
        toLocalISO(date),
      )
      setSlots(result)
      setLoadingSlots(false)
    })
  }

  useEffect(() => {
    selectDate(new Date())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleConfirm() {
    if (!selectedTime) return
    setError(null)

    const [h, m] = selectedTime.split(":").map(Number)
    const dateISO = toLocalISO(
      new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        h,
        m,
      ),
    )

    startTransition(async () => {
      const result = await createBooking({
        professionalId,
        serviceId: service.id,
        dateISO,
        clientName,
        clientPhone,
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      router.push(`/${slug}/sucesso/${result.bookingId}`)
    })
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background">
      <header className="border-border flex items-center gap-3 border-b px-4 py-4">
        <button
          type="button"
          onClick={() => (step === 2 ? setStep(1) : router.back())}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Voltar"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold">{service.name}</span>
      </header>

      {step === 1 && (
        <div>
          <p className="text-muted-foreground px-4 pt-4 pb-2 font-mono text-[11px] tracking-wide uppercase">
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>

          <div className="flex gap-2 overflow-x-auto px-4 pb-4">
            {days.map((day) => {
              const active = isSameDay(day, selectedDate)
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => selectDate(day)}
                  className={cn(
                    "flex w-12 shrink-0 flex-col items-center gap-1 rounded-lg border py-2 font-mono text-xs",
                    active
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground",
                  )}
                >
                  <span className="text-[10px] uppercase">
                    {format(day, "EEEEE", { locale: ptBR })}
                  </span>
                  <span className="text-sm font-semibold">
                    {format(day, "d")}
                  </span>
                </button>
              )
            })}
          </div>

          <p className="text-muted-foreground px-4 pt-2 pb-2 font-mono text-[11px] tracking-wide uppercase">
            Horários livres
          </p>

          <div className="flex flex-wrap gap-2 px-4 pb-4">
            {loadingSlots && (
              <p className="text-muted-foreground text-sm">Carregando…</p>
            )}
            {!loadingSlots && slots.length === 0 && (
              <p className="text-muted-foreground text-sm">
                Sem horários livres nesse dia. Escolha outra data.
              </p>
            )}
            {slots.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setSelectedTime(time)}
                className={cn(
                  "rounded-full border px-3.5 py-2 font-mono text-[13px]",
                  selectedTime === time
                    ? "bg-foreground text-background border-foreground"
                    : "border-border",
                )}
              >
                {time}
              </button>
            ))}
          </div>

          <div className="border-border fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t bg-background px-4 py-4">
            <Button
              className="w-full"
              size="lg"
              disabled={!selectedTime}
              onClick={() => setStep(2)}
            >
              Continuar
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="px-4 pt-4 pb-28">
          <label className="mb-4 block">
            <span className="text-muted-foreground mb-1.5 block font-mono text-[10.5px] tracking-wide uppercase">
              Seu nome
            </span>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Como podemos te chamar"
              className="border-input bg-background w-full rounded-lg border px-3 py-2.5 text-sm"
            />
          </label>

          <label className="mb-5 block">
            <span className="text-muted-foreground mb-1.5 block font-mono text-[10.5px] tracking-wide uppercase">
              WhatsApp
            </span>
            <input
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="(27) 99999-0000"
              className="border-input bg-background w-full rounded-lg border px-3 py-2.5 text-sm"
            />
          </label>

          <p className="text-muted-foreground mb-2 font-mono text-[10.5px] tracking-wide uppercase">
            Resumo
          </p>
          <div className="bg-secondary mb-4 flex flex-col gap-1.5 rounded-lg px-3.5 py-3 text-sm">
            <div className="flex justify-between">
              <span>{service.name}</span>
              <span className="font-mono">{formatBRL(service.price)}</span>
            </div>
            <div className="flex justify-between">
              <span>
                {format(selectedDate, "EEE, d 'de' MMM.", { locale: ptBR })}
              </span>
              <span className="font-mono">{selectedTime}</span>
            </div>
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>Duração</span>
              <span>{formatDuration(service.durationMinutes)}</span>
            </div>
          </div>

          {error && (
            <p className="text-destructive mb-3 text-sm">{error}</p>
          )}

          <div className="border-border fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t bg-background px-4 py-4">
            <Button
              className="w-full"
              size="lg"
              disabled={isPending || !clientName.trim() || !clientPhone.trim()}
              onClick={handleConfirm}
            >
              {isPending ? "Confirmando…" : "Confirmar Agendamento"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
