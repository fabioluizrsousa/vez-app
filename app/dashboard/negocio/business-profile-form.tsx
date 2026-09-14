"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Copy, ExternalLink, MessageCircle } from "lucide-react"
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
  siteHost: string
  redirectTo?: string
}

export default function BusinessProfileForm({
  initial,
  slug,
  siteHost,
  redirectTo,
}: BusinessProfileFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  const [businessName, setBusinessName] = useState(initial.businessName)
  const [phone, setPhone] = useState(initial.phone)
  const [address, setAddress] = useState(initial.address)
  const [cancellationWindowHours, setCancellationWindowHours] = useState(
    String(initial.cancellationWindowHours),
  )
  const [googleReviewUrl, setGoogleReviewUrl] = useState(initial.googleReviewUrl)
  const [image, setImage] = useState<string | null>(initial.image)
  const [logoUrl, setLogoUrl] = useState<string | null>(initial.logoUrl)

  const publicUrl = slug ? `${siteHost.replace(/\/$/, "")}/${slug}` : null

  async function handleCopyPublicUrl() {
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError("Não foi possível copiar o link. Tente novamente.")
    }
  }

  function handleShareWhatsApp() {
    if (!publicUrl) return
    const label = businessName.trim() || "meu negócio"
    const text = `Agende seu horário em ${label}: ${publicUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer")
  }

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

      <div className="flex min-w-0 flex-col gap-1.5">
        <Label htmlFor="businessName">Nome do negócio</Label>
        <Input
          id="businessName"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Ex: Renato Cortes"
        />
        {publicUrl && (
          <div className="mt-1 flex min-w-0 flex-col gap-2">
            <p
              className="text-muted-foreground max-w-full truncate font-mono text-xs"
              title={publicUrl}
            >
              {publicUrl}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopyPublicUrl}
                className="border-input text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium"
              >
                <Copy className="size-3.5" />
                {copied ? "Link copiado" : "Copiar link"}
              </button>
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="border-input text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium"
              >
                <MessageCircle className="size-3.5" />
                Compartilhar WhatsApp
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="border-input text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium"
              >
                <ExternalLink className="size-3.5" />
                Ver como cliente
              </a>
            </div>
          </div>
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
