"use client"

import { useState, useTransition } from "react"
import type { BookingStatus } from "@prisma/client"
import { StarIcon } from "lucide-react"
import { submitReview } from "../../_actions/submit-review"
import { Button } from "../../_components/ui/button"
import { cn } from "../../_lib/utils"

interface ReviewFormProps {
  token: string
  status: BookingStatus
  scheduledAt: string
  alreadyReviewed: boolean
  googleReviewUrl: string | null
}

export default function ReviewForm({
  token,
  status,
  scheduledAt,
  alreadyReviewed,
  googleReviewUrl,
}: ReviewFormProps) {
  const [isPending, startTransition] = useTransition()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [result, setResult] = useState<
    { ok: true; googleReviewUrl: string | null } | { ok: false; error: string } | null
  >(null)

  if (status === "CANCELED") {
    return (
      <p className="text-muted-foreground text-sm">
        Esse agendamento foi cancelado — nada pra avaliar por aqui.
      </p>
    )
  }

  if (new Date(scheduledAt) > new Date()) {
    return (
      <p className="text-muted-foreground text-sm">
        Ainda não é possível avaliar — seu atendimento ainda vai acontecer.
      </p>
    )
  }

  if (alreadyReviewed || result?.ok) {
    const googleUrl = result?.ok ? result.googleReviewUrl : googleReviewUrl
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm">Obrigado pela avaliação! 🙌</p>
        {googleUrl && (
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border-border hover:bg-secondary self-start rounded-md border px-3.5 py-2 text-xs font-semibold"
          >
            Avaliar também no Google
          </a>
        )}
      </div>
    )
  }

  const displayRating = hoverRating || rating

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`${value} estrela${value > 1 ? "s" : ""}`}
            onMouseEnter={() => setHoverRating(value)}
            onClick={() => setRating(value)}
            className="p-0.5"
          >
            <StarIcon
              className={cn(
                "h-8 w-8 transition-colors",
                value <= displayRating
                  ? "fill-primary text-primary"
                  : "text-border",
              )}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Quer contar algo sobre o atendimento? (opcional)"
        rows={3}
        className="border-input placeholder:text-muted-foreground focus-visible:ring-ring w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:ring-1 focus-visible:outline-hidden"
      />

      {result && !result.ok && (
        <p className="text-destructive text-sm">{result.error}</p>
      )}

      <Button
        disabled={isPending || rating === 0}
        onClick={() =>
          startTransition(async () => {
            const r = await submitReview(token, rating, comment)
            setResult(r)
          })
        }
      >
        {isPending ? "Enviando…" : "Enviar avaliação"}
      </Button>
    </div>
  )
}
