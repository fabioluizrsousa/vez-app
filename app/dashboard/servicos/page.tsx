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
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="font-display text-xl font-extrabold">Meus Serviços</h1>
      </div>

      <ul className="divide-border divide-y">
        {services.map((service) => (
          <li
            key={service.id}
            className="flex items-center justify-between gap-4 py-3.5"
          >
            <div>
              <p className="text-sm font-semibold">
                {service.name}
                {!service.active && (
                  <span className="text-muted-foreground ml-2 text-[11px] font-normal">
                    (pausado)
                  </span>
                )}
              </p>
              <p className="text-muted-foreground text-xs">
                {formatDuration(service.durationMinutes)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm tabular-nums">
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
