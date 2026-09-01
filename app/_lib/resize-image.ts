/**
 * Redimensiona e recomprime uma imagem no navegador antes de mandar pro
 * servidor. Não temos um serviço de storage de arquivos configurado (tipo
 * Vercel Blob ou S3) — pra não adicionar mais uma peça externa pro MVP, a
 * foto de perfil e o logo do negócio são guardados como data URL direto no
 * Postgres (campos `image`/`logoUrl` em User, sem limite de tamanho porque
 * são `String` sem `@db.VarChar`). Redimensionar aqui é o que mantém isso
 * viável: sem isso, uma foto de celular de 4-8MB iria inteira pro banco.
 */
export function resizeImageToDataUrl(
  file: File,
  { maxSize = 480, quality = 0.85 }: { maxSize?: number; quality?: number } = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Não consegui ler o arquivo."))
    reader.onload = () => {
      const img = new window.Image()
      img.onerror = () => reject(new Error("Arquivo não é uma imagem válida."))
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const width = Math.round(img.width * scale)
        const height = Math.round(img.height * scale)

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Não consegui processar a imagem."))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL("image/jpeg", quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
