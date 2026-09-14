"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { getSlotsForDate } from "../../_actions/get-available-slots"
import { createProfessionalBooking } from "../../_actions/professional-bookings"
import { createManualBlock } from "../../_actions/manual-blocks"
import { formatWhatsAppBR, isValidWhatsAppBR } from "../../_lib/phone"
import { Button } from "../../_components/ui/button"

interface ServiceOption {
  id: string
  name: string
}

export default function QuickActions({
  professionalId,
  services,
}: {
  professionalId: string
  services: ServiceOption[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<"booking" | "block" | null>(null)

  const [serviceId, setServiceId] = useState(services[0]?.id ?? "")
  const [date, setDate] = useState("")
  const [slots, setSlots] = useState<string[]>([])
  const [time, setTime] = useState("")
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")

  const [blockDate, setBlockDate] = useState("")
  const [blockStart, setBlockStart] = useState("")
  const [blockEnd, setBlockEnd] = useState("")
  const [blockReason, setBlockReason] = useState("")
  const [error, setError] = useState<string | null>(null)

  const phoneValid = isValidWhatsAppBR(clientPhone)
  const showPhoneError = clientPhone.length > 0 && !phoneValid

  const loadSlots = useCallback(
    (nextServiceId = serviceId, nextDate = date) => {
      setTime("")
      setSlots([])
      setError(null)
      if (!nextServiceId || !nextDate) return
      startTransition(async () => {
        const result = await getSlotsForDate(
          professionalId,
          nextServiceId,
          `${nextDate}T12:00:00`,
        )
        setSlots(result)
      })
    },
    [date, professionalId, serviceId],
  )

  useEffect(() => {
    const refreshAvailability = () => {
      if (mode === "booking") loadSlots(serviceId, date)
    }

    window.addEventListener("vez:availability-changed", refreshAvailability)
    return () =>
      window.removeEventListener("vez:availability-changed", refreshAvailability)
  }, [date, loadSlots, mode, serviceId])

  function toggleBooking() {
    const opening = mode !== "booking"
    setError(null)
    if (!opening) {
      setMode(null)
      return
    }
    setMode("booking")
    loadSlots(serviceId, date)
  }

  function toggleBlock() {
    setMode(mode === "block" ? null : "block")
    setError(null)
  }

  function saveBooking() {
    if (!serviceId || !date || !time || !clientName.trim() || !phoneValid) return
    setError(null)
    startTransition(async () => {
      const result = await createProfessionalBooking({
        serviceId,
        dateISO: `${date}T${time}:00`,
        clientName,
        clientPhone,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setMode(null)
      setDate("")
      setTime("")
      setSlots([])
      setClientName("")
      setClientPhone("")
      router.refresh()
    })
  }

  function saveBlock() {
    if (!blockDate || !blockStart || !blockEnd) return
    setError(null)
    startTransition(async () => {
      const result = await createManualBlock({
        startISO: `${blockDate}T${blockStart}:00`,
        endISO: `${blockDate}T${blockEnd}:00`,
        reason: blockReason,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setMode(null)
      setBlockDate("")
      setBlockStart("")
      setBlockEnd("")
      setBlockReason("")
      setTime("")
      setSlots([])
      window.dispatchEvent(new Event("vez:availability-changed"))
      router.refresh()
    })
  }

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2">
        <Button onClick={toggleBooking}>+ Novo agendamento</Button>
        <Button variant="outline" onClick={toggleBlock}>Bloquear horário</Button>
      </div>

      {mode === "booking" && (
        <div className="bg-card mt-3 grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
          <label className="text-xs">
            <span className="text-muted-foreground mb-1 block">Serviço</span>
            <select
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value)
                loadSlots(e.target.value, date)
              }}
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            >
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            <span className="text-muted-foreground mb-1 block">Data</span>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                loadSlots(serviceId, e.target.value)
              }}
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs sm:col-span-2">
            <span className="text-muted-foreground mb-1 block">Horário</span>
            <div className="flex flex-wrap gap-2">
              {isPending && date && (
                <span className="text-muted-foreground text-sm">Carregando…</span>
              )}
              {!isPending && date && slots.length === 0 && (
                <span className="text-muted-foreground text-sm">Sem horários livres.</span>
              )}
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTime(slot)}
                  className={`rounded-full border px-3 py-1.5 font-mono text-xs ${time === slot ? "bg-foreground text-background border-foreground" : "border-border"}`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </label>
          <label className="text-xs">
            <span className="text-muted-foreground mb-1 block">Cliente</span>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs">
            <span className="text-muted-foreground mb-1 block">WhatsApp</span>
            <input
              value={clientPhone}
              onChange={(e) => setClientPhone(formatWhatsAppBR(e.target.value))}
              inputMode="tel"
              placeholder="(27) 99999-0000"
              className={`bg-background w-full rounded-md border px-3 py-2 text-sm ${showPhoneError ? "border-destructive" : "border-input"}`}
            />
            {showPhoneError && (
              <span className="text-destructive mt-1 block text-[11px]">
                Informe um celular válido com DDD.
              </span>
            )}
          </label>
          {error && (
            <p className="text-destructive text-sm sm:col-span-2">{error}</p>
          )}
          <div className="sm:col-span-2">
            <Button
              disabled={
                isPending ||
                !serviceId ||
                !date ||
                !time ||
                !clientName.trim() ||
                !phoneValid
              }
              onClick={saveBooking}
            >
              {isPending ? "Salvando…" : "Salvar agendamento"}
            </Button>
          </div>
        </div>
      )}

      {mode === "block" && (
        <div className="bg-card mt-3 grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
          <label className="text-xs sm:col-span-2">
            <span className="text-muted-foreground mb-1 block">Data</span>
            <input
              type="date"
              value={blockDate}
              onChange={(e) => setBlockDate(e.target.value)}
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs">
            <span className="text-muted-foreground mb-1 block">Início</span>
            <input
              type="time"
              value={blockStart}
              onChange={(e) => setBlockStart(e.target.value)}
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs">
            <span className="text-muted-foreground mb-1 block">Fim</span>
            <input
              type="time"
              value={blockEnd}
              onChange={(e) => setBlockEnd(e.target.value)}
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs sm:col-span-2">
            <span className="text-muted-foreground mb-1 block">Motivo (opcional)</span>
            <input
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Ex: compromisso"
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            />
          </label>
          {error && (
            <p className="text-destructive text-sm sm:col-span-2">{error}</p>
          )}
          <div className="sm:col-span-2">
            <Button
              disabled={isPending || !blockDate || !blockStart || !blockEnd}
              onClick={saveBlock}
            >
              {isPending ? "Bloqueando…" : "Bloquear período"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
