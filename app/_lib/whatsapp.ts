interface SendTemplateInput {
  to: string // já em E.164, ex: "+5527999998888" — ver app/_lib/phone.ts
  templateName: string
  params: string[]
}

interface SendTemplateResult {
  ok: boolean
  // true quando nem tentou mandar porque falta configuração — pra quem
  // chama não registrar isso como uma falha real no ReminderLog.
  skipped?: boolean
  error?: string
}

const GRAPH_API_VERSION = "v21.0"

/**
 * Manda uma mensagem de template pelo WhatsApp Business Platform (Cloud API
 * da Meta). Precisa de WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID no
 * .env — sem isso, devolve `skipped: true` sem lançar erro, porque um aviso
 * é best-effort e nunca pode derrubar a criação do agendamento em si.
 *
 * `templateName` precisa já existir aprovado no WhatsApp Manager da conta —
 * ver README para o texto exato submetido pra aprovação e a ordem das
 * variáveis que cada template espera.
 */
export async function sendWhatsAppTemplate({
  to,
  templateName,
  params,
}: SendTemplateInput): Promise<SendTemplateResult> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!accessToken || !phoneNumberId) {
    return { ok: false, skipped: true, error: "WhatsApp não configurado (.env)." }
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to.replace("+", ""),
          type: "template",
          template: {
            name: templateName,
            language: { code: "pt_BR" },
            components: [
              {
                type: "body",
                parameters: params.map((text) => ({ type: "text", text })),
              },
            ],
          },
        }),
      },
    )

    if (!response.ok) {
      const body = await response.text()
      return { ok: false, error: `WhatsApp API ${response.status}: ${body}` }
    }

    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}
