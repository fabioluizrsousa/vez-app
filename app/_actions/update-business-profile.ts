"use server"

import { revalidatePath } from "next/cache"
import { db } from "../_lib/prisma"
import { requireProfessional } from "../_lib/current-professional"
import { slugify } from "../_lib/slug"

export interface BusinessProfileInput {
  businessName: string
  phone: string
  address: string
  cancellationWindowHours: number
  googleReviewUrl: string
  image?: string | null
  logoUrl?: string | null
}

// Limite generoso pro data URL (foto de perfil / logo) — o redimensionamento
// no navegador (app/_lib/resize-image.ts) já deixa isso bem menor que isso
// na prática; é só uma rede de segurança contra alguém chamar a action
// direto sem passar pelo componente de upload.
const MAX_IMAGE_DATA_URL_LENGTH = 2_000_000

function isValidImageValue(value: string | null | undefined) {
  if (value === null || value === undefined) return true
  return value.startsWith("data:image/") && value.length <= MAX_IMAGE_DATA_URL_LENGTH
}

export async function updateBusinessProfile(input: BusinessProfileInput) {
  const professional = await requireProfessional()

  if (!input.businessName.trim()) {
    return { ok: false as const, error: "Dê um nome ao seu negócio." }
  }

  if (!isValidImageValue(input.image) || !isValidImageValue(input.logoUrl)) {
    return { ok: false as const, error: "Imagem inválida ou muito grande." }
  }

  const googleReviewUrl = input.googleReviewUrl.trim()
  if (googleReviewUrl && !/^https:\/\//.test(googleReviewUrl)) {
    return {
      ok: false as const,
      error: "O link do Google deve começar com https://",
    }
  }

  let slug = professional.slug
  if (!slug) {
    const base = slugify(input.businessName)
    slug = base
    let suffix = 2
    while (await db.user.findFirst({ where: { slug, NOT: { id: professional.id } } })) {
      slug = `${base}-${suffix}`
      suffix += 1
    }
  }

  await db.user.update({
    where: { id: professional.id },
    data: {
      businessName: input.businessName.trim(),
      phone: input.phone.trim(),
      address: input.address.trim(),
      cancellationWindowHours: input.cancellationWindowHours,
      googleReviewUrl: googleReviewUrl || null,
      slug,
      onboarded: true,
      ...(input.image !== undefined ? { image: input.image } : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
    },
  })

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/negocio")
  return { ok: true as const, slug }
}
