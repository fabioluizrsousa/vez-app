"use client"

import { useState, useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../_components/ui/dialog"
import { Button } from "../../_components/ui/button"
import { Input } from "../../_components/ui/input"
import { Label } from "../../_components/ui/label"
import { upsertService, toggleServiceActive } from "../../_actions/upsert-service"

interface Service {
  id: string
  name: string
  price: number
  durationMinutes: number
  description: string | null
  active: boolean
}

interface ServiceFormDialogProps {
  mode: "create" | "edit"
  service?: Service
}

export default function ServiceFormDialog({
  mode,
  service,
}: ServiceFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(service?.name ?? "")
  const [duration, setDuration] = useState(
    String(service?.durationMinutes ?? 30),
  )
  const [price, setPrice] = useState(String(service?.price ?? ""))

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await upsertService({
        id: service?.id,
        name,
        durationMinutes: Number(duration),
        price: Number(price.replace(",", ".")),
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <button
            type="button"
            className="border-areia text-muted-foreground w-full rounded-lg border-[1.5px] border-dashed py-3 text-center text-sm font-semibold"
          >
            + Adicionar serviço
          </button>
        ) : (
          <button
            type="button"
            className="border-input rounded-md border px-3 py-1.5 text-xs font-bold"
          >
            Editar
          </button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Novo serviço" : "Editar serviço"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Corte, Barba, Corte + Barba…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="duration">Duração (min)</Label>
              <Input
                id="duration"
                type="number"
                min={5}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="45"
              />
            </div>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex items-center justify-between gap-3 pt-2">
            {mode === "edit" && service && (
              <button
                type="button"
                disabled={isPending}
                className="text-muted-foreground text-xs underline"
                onClick={() =>
                  startTransition(async () => {
                    await toggleServiceActive(service.id, !service.active)
                    setOpen(false)
                  })
                }
              >
                {service.active ? "Pausar serviço" : "Reativar serviço"}
              </button>
            )}
            <Button
              className="ml-auto"
              disabled={isPending || !name.trim() || !price}
              onClick={handleSave}
            >
              {isPending ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
