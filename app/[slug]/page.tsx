import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MapPinIcon, StarIcon } from "lucide-react"
import { getProfessionalBySlug } from "../_data/get-professional-by-slug"
import Logo from "../_components/logo"
import { formatBRL, formatDuration } from "../_lib/format"
import { cn } from "../_lib/utils"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ProfessionalPublicPage({ params }: PageProps) {
  const { slug } = await params
  const professional = await getProfessionalBySlug(slug)

  if (!professional) notFound()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-border flex items-center justify-between border-b px-5 py-4">
        <Logo href={null} />
        <span className="text-muted-foreground font-mono text-xs">
          Vila Velha · ES
        </span>
      </header>

      <div className="border-border border-b px-5 py-6">
        {professional.logoUrl ? (
          // Data URL guardado no banco — ver app/_lib/resize-image.ts
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={professional.logoUrl}
            alt=""
            className="mb-3 h-12 w-12 rounded-xl object-cover"
          />
        ) : (
          <div
            className="mb-3 h-12 w-12 rounded-xl"
            style={{
              background: "linear-gradient(135deg, var(--vz-cobre), #8f5326)",
            }}
          />
        )}
        <h1 className="font-display text-2xl font-extrabold">
          {professional.businessName || professional.name}
        </h1>

        {professional.reviewCount > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5 text-sm">
            <StarIcon className="fill-primary text-primary h-4 w-4" />
            <span className="font-semibold">
              {professional.reviewAverage?.toFixed(1)}
            </span>
            <span className="text-muted-foreground">
              ({professional.reviewCount}{" "}
              {professional.reviewCount === 1 ? "avaliação" : "avaliações"})
            </span>
          </div>
        )}

        {professional.address && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${professional.businessName || professional.name} ${professional.address}`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground mt-1 flex items-center gap-1.5 text-sm underline decoration-dotted underline-offset-2"
          >
            <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
            {professional.address}
          </a>
        )}

        {professional.googleReviewUrl && (
          <a
            href={professional.googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border-border hover:bg-secondary mt-3 inline-block rounded-md border px-3 py-1.5 text-xs font-semibold"
          >
            Avaliar no Google
          </a>
        )}
      </div>

      <div className="px-5 py-4">
        <p className="text-muted-foreground mb-3 font-mono text-xs tracking-wide uppercase">
          Serviços
        </p>

        {professional.services.length === 0 && (
          <p className="text-muted-foreground text-sm">
            Nenhum serviço disponível no momento.
          </p>
        )}

        <ul className="divide-border divide-y">
          {professional.services.map((service) => (
            <li
              key={service.id}
              className="flex items-center justify-between gap-4 py-3.5"
            >
              <div>
                <p className="text-sm font-semibold">{service.name}</p>
                <p className="text-muted-foreground text-xs">
                  {formatDuration(service.durationMinutes)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm tabular-nums">
                  {formatBRL(service.price)}
                </span>
                <Link
                  href={`/${slug}/agendar?servico=${service.id}`}
                  className="bg-primary rounded-md px-3.5 py-2 text-xs font-bold text-white"
                >
                  Reservar
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {professional.reviews.length > 0 && (
        <div className="border-border border-t px-5 py-4">
          <p className="text-muted-foreground mb-3 font-mono text-xs tracking-wide uppercase">
            Avaliações de clientes
          </p>
          <ul className="flex flex-col gap-4">
            {professional.reviews.map((review) => (
              <li key={review.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <StarIcon
                        key={value}
                        className={cn(
                          "h-3.5 w-3.5",
                          value <= (review.reviewRating ?? 0)
                            ? "fill-primary text-primary"
                            : "text-border",
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold">
                    {review.clientName.split(" ")[0]}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    · {review.service.name}
                  </span>
                </div>
                {review.reviewComment && (
                  <p className="text-sm">{review.reviewComment}</p>
                )}
                {review.reviewedAt && (
                  <p className="text-muted-foreground text-xs">
                    {format(review.reviewedAt, "d 'de' MMM. 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
