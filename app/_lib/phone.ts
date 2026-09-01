/**
 * Normaliza um telefone brasileiro pro formato E.164 que a API do WhatsApp
 * exige (ex: "+5527999998888"). Aceita o que a pessoa digitar — com
 * parênteses, traço, espaço, com ou sem "55" na frente — e devolve `null`
 * se não conseguir reconhecer um número de celular válido (DDD + 9 dígitos),
 * pra quem chama decidir não tentar mandar mensagem em vez de quebrar.
 */
export function toWhatsAppE164BR(rawPhone: string): string | null {
  const digits = rawPhone.replace(/\D/g, "")
  if (!digits) return null

  // Já veio com o código do país (55)? Só é o caso se sobrar mais de 11
  // dígitos depois de tirar o "55" — um DDD real nunca começa com "55".
  const withoutCountry =
    digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits

  // DDD (2 dígitos) + celular com 9 dígitos (o "9" na frente + 8 números).
  if (withoutCountry.length !== 11) return null

  return `+55${withoutCountry}`
}
