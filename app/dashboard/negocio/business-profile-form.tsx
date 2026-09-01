"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateBusinessProfile } from "../../_actions/update-business-profile"
import { Button } from "../../_components/ui/button"
import { Input } from "../../_components/ui/input"
import { Label } from "../../_components/ui/label"
import ImageUploadField from "./image-upload-field"

interface BusinessProfileFormProps {
  initial: {
    businessName: string
    phone: string
    address: string
    cancellationWindowHours: number
    googleReviewUrl: string
    image: string | null
    logoUrl: string | null
  }
  slug: string | null
  redirectTo?: string
}

export default function BusinessProfileForm({
  initial,
  slug,
  redirectTo,
}: BusinessProfileFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [businessName, setBusinessName] = useState(initial.businessName)
  const [phone, setPhone] = useState(initial.phone)
  const [address, setAddress] = useState(initial.address)
  const [cancellationWindowHours, setCancellationWindowHours] = useState(
    String(initial.cancellationWindowHours),
  )
  const [googleReviewUrl, setGoogleReviewUrl] = useState(initial.googleReviewUrl)
  const [image, setImage] = useState<string | null>(initial.image)
  const [logoUrl, setLogoUrl] = useState<string | null>(initial.logoUrl)

  function handleSave() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await updateBusinessProfile({
        businessName,
        phone,
        address,
        cancellationWindowHours: Number(cancellationWindowHours),
        googleReviewUrl,
        image,
        logoUrl,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      if (redirectTo) {
        router.push(redirectTo)
      } else {
        setSaved(true)
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-5 sm:flex-row sm:gap-8">
        <ImageUploadField
          label="Foto de perfil"
          helperText="Se não enviar, usamos a foto da sua conta Google."
          value={image}
          onChange={setImage}
          shape="circle"
        />
        <ImageUploadField
          label="Logo do negócio"
          helperText="Aparece na sua página pública, pro cliente."
          value={logoUrl}
          onChange={setLogoUrl}
          shape="square"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="businessName">Nome do negócio</Label>
        <Input
          id="businessName"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Ex: Renato Cortes"
        />
        {slug && (
          <p className="text-muted-foreground font-mono text-xs">
            agendavez.com.br/{slug}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">WhatsApp</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(27) 99999-0000"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="address">Endereço</Label>
        <Input
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Rua, número — bairro"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cancellationWindowHours">
          Cancelamento até quantas horas antes?
        </Label>
        <Input
          id="cancellationWindowHours"
          type="number"
          min={0}
          className="w-24"
          value={cancellationWindowHours}
          onChange={(e) => setCancellationWindowHours(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="googleReviewUrl">Link de avaliação no Google</Label>
        <Input
          id="googleReviewUrl"
          value={googleReviewUrl}
          onChange={(e) => setGoogleReviewUrl(e.target.value)}
          placeholder="https://g.page/r/.../review"
        />
        <p className="text-muted-foreground text-xs">
          Aparece como botão na sua página e na mensagem pós-atendimento. Pra
          achar o seu: procure seu negócio no Google, clique em &quot;Peça
          avaliações&quot; e copie o link.
        </p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {saved && <p className="text-success text-sm">Salvo.</p>}

      <Button
        className="self-start"
        disabled={isPending || !businessName.trim()}
        onClick={handleSave}
      >
        {isPending ? "Salvando…" : redirectTo ? "Continuar" : "Salvar"}
      </Button>
    </div>
  )
}
