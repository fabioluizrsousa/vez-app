"use client"

import { useRef, useState } from "react"
import { X } from "lucide-react"
import { cn } from "../../_lib/utils"
import { resizeImageToDataUrl } from "../../_lib/resize-image"

interface ImageUploadFieldProps {
  label: string
  helperText?: string
  value: string | null
  onChange: (dataUrl: string | null) => void
  shape?: "circle" | "square"
  maxSize?: number
}

// Antes de redimensionar no canvas — só pra recusar rápido um arquivo
// absurdamente grande (ex: RAW de câmera) sem travar o navegador tentando
// carregar ele inteiro.
const MAX_FILE_BYTES = 8 * 1024 * 1024

export default function ImageUploadField({
  label,
  helperText,
  value,
  onChange,
  shape = "circle",
  maxSize = 480,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleFile(file: File | undefined) {
    setError(null)
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Escolha um arquivo de imagem (JPG, PNG...).")
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Imagem muito grande — escolha um arquivo de até 8MB.")
      return
    }

    setLoading(true)
    try {
      const dataUrl = await resizeImageToDataUrl(file, { maxSize })
      onChange(dataUrl)
    } catch {
      setError("Não consegui processar essa imagem. Tente outra.")
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-border bg-muted flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border",
            shape === "circle" ? "rounded-full" : "rounded-xl",
          )}
        >
          {value ? (
            // Data URL local — next/image não ajuda aqui e só complica.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-muted-foreground text-[10px] font-medium">
              {loading ? "…" : "Enviar"}
            </span>
          )}
        </button>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className="text-primary text-xs font-medium"
            >
              {value ? "Trocar" : "Escolher imagem"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="text-muted-foreground hover:text-foreground flex items-center gap-0.5 text-xs"
              >
                <X className="size-3" />
                Remover
              </button>
            )}
          </div>
          {helperText && (
            <p className="text-muted-foreground text-xs">{helperText}</p>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )
}
