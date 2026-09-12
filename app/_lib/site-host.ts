// Host público do app (ex: "vez-app.vercel.app") — usado pra montar o link
// que aparece pro barbeiro em "Meu negócio" (agendavez.com.br/seu-slug antes
// disso era fixo no código, mas esse domínio nunca chegou a ser registrado).
// Puxa do mesmo NEXTAUTH_URL usado pra montar os links dentro das mensagens
// de WhatsApp, pra nunca ficar dessincronizado. Cai pro domínio da Vercel se
// a env var não estiver setada.
export function getSiteHost() {
  const raw = process.env.NEXTAUTH_URL || "https://vez-app.vercel.app"
  return raw.replace(/^https?:\/\//, "").replace(/\/$/, "")
}
