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

  const withoutCountry =
    digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits

  // DDD (2 dígitos) + celular (9 dígitos), começando com 9.
  if (withoutCountry.length !== 11 || withoutCountry[2] !== "9") return null

  return `+55${withoutCountry}`
}

export function isValidWhatsAppBR(rawPhone: string): boolean {
  return toWhatsAppE164BR(rawPhone) !== null
}

/**
 * Máscara leve pro formulário. Mantém no máximo DDD + 9 dígitos e produz
 * algo como "(27) 99999-8888".
 */
export function formatWhatsAppBR(rawPhone: string): string {
  let digits = rawPhone.replace(/\D/g, "")
  if (digits.startsWith("55") && digits.length > 11) digits = digits.slice(2)
  digits = digits.slice(0, 11)

  if (digits.length <= 2) return digits ? `(${digits}` : ""
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}
