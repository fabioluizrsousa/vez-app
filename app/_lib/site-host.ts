// Host público do app (ex: "vez-app.vercel.app") — usado pra montar o link
// que aparece pro barbeiro em "Meu negócio".
//
// Em produção, o link deve sempre usar o domínio oficial do Vez. Isso evita
// que uma NEXTAUTH_URL antiga de Preview vaze para os botões Copiar link,
// Compartilhar WhatsApp e Ver como cliente.
export function getSiteHost() {
  if (process.env.VERCEL_ENV === "production") {
    return "vez-app.vercel.app"
  }

  const raw = process.env.NEXTAUTH_URL || "https://vez-app.vercel.app"
  return raw.replace(/^https?:\/\//, "").replace(/\/$/, "")
}
