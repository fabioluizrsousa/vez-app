import { requireProfessional } from "../../_lib/current-professional"
import { db } from "../../_lib/prisma"
import { formatBRL, formatDuration } from "../../_lib/format"
import ServiceFormDialog from "./service-form-dialog"

export default async function ServicosPage() {
  const professional = await requireProfessional()
  const services = await db.service.findMany({
    where: { professionalId: professional.id },
    orderBy: { order: "asc" },
  })

  return (
    <div>
      <div className="mb-5 sm:mb-6">
        <h1 className="font-display text-xl font-extrabold">Meus Serviços</h1>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
          Defina preço e duração. Serviços pausados não aparecem para o cliente.
        </p>
      </div>

      <ul className="flex flex-col gap-2.5">
        {services.map((service) => (
          <li
            key={service.id}
            className="border-border bg-card flex items-center justify-between gap-3 rounded-lg border px-3.5 py-3.5 sm:gap-4 sm:px-4"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold">{service.name}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    service.active
                      ? "bg-success/10 text-success"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {service.active ? "Ativo" : "Pausado"}
                </span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {formatDuration(service.durationMinutes)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <span className="font-mono text-sm font-semibold tabular-nums">
                {formatBRL(service.price)}
              </span>
              <ServiceFormDialog
                mode="edit"
                service={{
                  id: service.id,
                  name: service.name,
                  price: Number(service.price),
                  durationMinutes: service.durationMinutes,
                  description: service.description,
                  active: service.active,
                }}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <ServiceFormDialog mode="create" />
      </div>
    </div>
  )
}
