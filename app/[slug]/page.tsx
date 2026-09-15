import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MapPinIcon, StarIcon } from "lucide-react"
import { getProfessionalBySlug } from "../_data/get-professional-by-slug"
import Logo from "../_components/logo"
import { formatBRL, formatDuration } from "../_lib/format"
import { cn } from "../_lib/utils"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ProfessionalPublicPage({ params }: PageProps) {
  const { slug } = await params
  const professional = await getProfessionalBySlug(slug)

  if (!professional) notFound()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-border border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Logo href={null} />
          <span className="text-muted-foreground font-mono text-xs">
            Vila Velha · ES
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl">
        <section className="border-border border-b px-5 py-6 sm:py-8">
          <div className="flex items-start gap-4">
            {professional.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={professional.logoUrl}
                alt=""
                className="h-14 w-14 shrink-0 rounded-xl object-cover sm:h-16 sm:w-16"
              />
            ) : (
              <div
                className="h-14 w-14 shrink-0 rounded-xl sm:h-16 sm:w-16"
                style={{
                  background: "linear-gradient(135deg, var(--vz-cobre), #8f5326)",
                }}
              />
            )}

            <div className="min-w-0">
              <h1 className="font-display text-2xl font-extrabold sm:text-3xl">
                {professional.businessName || professional.name}
              </h1>

              {professional.reviewCount > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-sm">
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
                  className="text-muted-foreground hover:text-foreground mt-2 flex items-start gap-1.5 text-sm underline decoration-dotted underline-offset-2"
                >
                  <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{professional.address}</span>
                </a>
              )}
            </div>
          </div>

          {professional.googleReviewUrl && (
            <a
              href={professional.googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border hover:bg-secondary mt-4 inline-flex min-h-9 items-center rounded-md border px-3 text-xs font-semibold"
            >
              Avaliar no Google
            </a>
          )}
        </section>

        <section className="px-5 py-6">
          <div className="mb-4">
            <p className="font-display text-lg font-extrabold">Serviços</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Escolha o serviço para ver os horários disponíveis.
            </p>
          </div>

          {professional.services.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Nenhum serviço disponível no momento.
            </p>
          )}

          <ul className="flex flex-col gap-2.5">
            {professional.services.map((service) => (
              <li
                key={service.id}
                className="border-border bg-card flex items-center justify-between gap-4 rounded-lg border px-4 py-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{service.name}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {formatDuration(service.durationMinutes)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-sm font-semibold tabular-nums">
                    {formatBRL(service.price)}
                  </span>
                  <Link
                    href={`/${slug}/agendar?servico=${service.id}`}
                    className="bg-primary inline-flex min-h-10 items-center rounded-md px-4 text-xs font-bold text-white"
                  >
                    Reservar
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {professional.reviews.length > 0 && (
          <section className="border-border border-t px-5 py-6">
            <p className="font-display text-lg font-extrabold">Avaliações de clientes</p>
            <ul className="mt-4 flex flex-col gap-4">
              {professional.reviews.map((review) => (
                <li key={review.id} className="border-border bg-card rounded-lg border p-4">
                  <div className="flex flex-wrap items-center gap-2">
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
                    <p className="mt-2 text-sm">{review.reviewComment}</p>
                  )}
                  {review.reviewedAt && (
                    <p className="text-muted-foreground mt-2 text-xs">
                      {format(review.reviewedAt, "d 'de' MMM. 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  )
}
