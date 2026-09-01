"use client"

import { useState, useTransition } from "react"
import { Plus, X } from "lucide-react"
import { replaceAvailability } from "../../_actions/update-availability"
import { Button } from "../../_components/ui/button"
import { weekdayLabel } from "../../_lib/format"
import { cn } from "../../_lib/utils"

interface Window {
  startTime: string
  endTime: string
}

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0] // seg..dom
const DEFAULT_WINDOW: Window = { startTime: "09:00", endTime: "18:00" }

export default function AvailabilityEditor({
  initial,
}: {
  initial: { weekday: number; startTime: string; endTime: string }[]
}) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [enabledDays, setEnabledDays] = useState<Set<number>>(
    new Set(initial.map((w) => w.weekday)),
  )
  // Cada dia guarda uma LISTA de janelas — é isso que permite intervalos
  // (ex: 09:00-12:00 e 13:00-18:00 pra representar o almoço) em vez de um
  // único período contínuo por dia.
  const [windows, setWindows] = useState<Record<number, Window[]>>(() => {
    const map: Record<number, Window[]> = {}
    for (const day of WEEKDAYS) {
      const found = initial
        .filter((w) => w.weekday === day)
        .map((w) => ({ startTime: w.startTime, endTime: w.endTime }))
      map[day] = found.length > 0 ? found : [DEFAULT_WINDOW]
    }
    return map
  })

  function toggleDay(day: number) {
    setEnabledDays((prev) => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  function updateWindow(
    day: number,
    index: number,
    field: "startTime" | "endTime",
    value: string,
  ) {
    setWindows((prev) => ({
      ...prev,
      [day]: prev[day].map((w, i) =>
        i === index ? { ...w, [field]: value } : w,
      ),
    }))
  }

  function addWindow(day: number) {
    setWindows((prev) => {
      const dayWindows = prev[day]
      const last = dayWindows[dayWindows.length - 1]
      return {
        ...prev,
        [day]: [
          ...dayWindows,
          { startTime: last?.endTime ?? "13:00", endTime: "18:00" },
        ],
      }
    })
  }

  function removeWindow(day: number, index: number) {
    setWindows((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }))
  }

  function handleSave() {
    setSaved(false)
    const items = WEEKDAYS.filter((day) => enabledDays.has(day)).flatMap(
      (day) =>
        windows[day]
          .filter((w) => w.startTime && w.endTime)
          .map((w) => ({
            weekday: day,
            startTime: w.startTime,
            endTime: w.endTime,
          })),
    )
    startTransition(async () => {
      await replaceAvailability(items)
      setSaved(true)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {WEEKDAYS.map((day) => {
        const active = enabledDays.has(day)
        const dayWindows = windows[day]
        return (
          <div key={day} className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => toggleDay(day)}
              className={cn(
                "mt-1 w-14 shrink-0 rounded-md border px-2 py-1.5 text-xs font-semibold",
                active
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground",
              )}
            >
              {weekdayLabel(day)}
            </button>
            {active ? (
              <div className="flex flex-col gap-2">
                {dayWindows.map((window, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={window.startTime}
                      onChange={(e) =>
                        updateWindow(day, index, "startTime", e.target.value)
                      }
                      className="border-input rounded-md border px-2 py-1 font-mono text-xs"
                    />
                    <span className="text-muted-foreground text-xs">até</span>
                    <input
                      type="time"
                      value={window.endTime}
                      onChange={(e) =>
                        updateWindow(day, index, "endTime", e.target.value)
                      }
                      className="border-input rounded-md border px-2 py-1 font-mono text-xs"
                    />
                    {dayWindows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWindow(day, index)}
                        aria-label="Remover intervalo"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addWindow(day)}
                  className="text-primary flex w-fit items-center gap-1 text-xs font-medium"
                >
                  <Plus className="size-3.5" />
                  Adicionar intervalo (ex: almoço)
                </button>
              </div>
            ) : (
              <span className="text-muted-foreground mt-1 text-xs">
                Fechado
              </span>
            )}
          </div>
        )
      })}

      {saved && <p className="text-success text-sm">Disponibilidade salva.</p>}

      <Button
        className="mt-2 self-start"
        disabled={isPending}
        onClick={handleSave}
      >
        {isPending ? "Salvando…" : "Salvar disponibilidade"}
      </Button>
    </div>
  )
}
