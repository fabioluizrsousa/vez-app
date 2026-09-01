/**
 * A Vercel reserva o nome `TZ` — não dá pra cadastrar como variável de
 * ambiente comum (`vercel env add TZ` recusa com "reserved"). Esse arquivo é
 * o hook oficial do Next.js que roda uma vez, assim que cada instância do
 * servidor sobe, antes de qualquer request — setar `process.env.TZ` aqui tem
 * o mesmo efeito de rodar com TZ=America/Sao_Paulo no ambiente, sem depender
 * de uma env var que a plataforma bloqueia.
 *
 * Sem isso (ou sem TZ=America/Sao_Paulo em outros hosts que permitem a env
 * var), os horários de agendamento e a janela de cancelamento ficam
 * deslocados em produção — ver o comentário em app/_lib/datetime.ts.
 */
export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.env.TZ = "America/Sao_Paulo"
  }
}
