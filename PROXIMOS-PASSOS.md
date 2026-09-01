# Próximos passos — implementável já, por prioridade

Lista do que dá pra implementar agora no Vez sem precisar de nenhum provedor
pago novo (usando só o que já está no stack: banco, WhatsApp Business API e
o padrão de imagem em data URL já usado pro logo/foto de perfil). Levantado
a partir da análise de concorrentes em 31/08/2026 (ver `ROADMAP.md` pro que
fica pra mais a frente). Ordem por prioridade — o que tem mais impacto pra
menos esforço vem primeiro.

| # | Implementação | Status | Por quê | Esforço | Depende de |
|---|---|---|---|---|---|
| 1 | Avaliação real de cliente pós-atendimento | ✅ Código pronto — falta migração + deploy | Requisito que você pediu pra registrar. Mandar WhatsApp depois do horário marcado, pedindo nota + comentário vinculados àquele `Booking` — só quem teve atendimento de verdade avalia (padrão "cliente confirmado" do Booksy), evita nota falsa | Médio | Job agendado (Vercel Cron) pra disparar a mensagem X horas após o `scheduledAt`; nova tabela/campos pra guardar a nota |
| 2 | Link "avalie no Google" | ✅ Código pronto — falta migração + deploy | Mesmo requisito, versão simples: campo no cadastro do profissional com o link do Google Business Profile dele, exibido na página pública e reenviado na mesma mensagem pós-atendimento do item 1 | Baixo | Nenhuma API paga — é só um campo de link |
| 3 | Fotos no site | ⏳ Aguardando você definir o escopo | Seu pedido — hoje `/[slug]` só tem o logo. Galeria de fotos do espaço/trabalhos aumenta confiança antes de agendar (todos os concorrentes analisados têm) | Médio | Definir escopo: poucas fotos (cabe no padrão atual de data URL, como o logo) ou portfólio maior (aí precisa migrar pra um storage de verdade — Vercel Blob, por exemplo, como o README já observa) |
| 4 | Recuperação de cliente inativo | — | Cliente que não agenda há X dias recebe um WhatsApp de "sentimos sua falta" — presente em quase todos os concorrentes (AppBarber, Kinous, Ageenda), efeito direto no faturamento | Médio | Job agendado que cruza `Booking`s por telefone de cliente e dispara a mensagem |
| 5 | Horário de funcionamento na página pública | — | Mostrar a semana de atendimento (não só os horários livres do dia) — dá contexto antes mesmo de escolher uma data | Baixo | Já existe em `Availability`, é só exibir |
| 6 | Formas de pagamento aceitas | — | Reduz uma dúvida comum antes de agendar | Baixo | Novo campo (lista de tags) no cadastro do profissional |
| 7 | Comodidades (wifi, estacionamento, acessibilidade, atende crianças) | — | Mesma ideia do AppBarber — sinaliza confiança rápido | Baixo | Poucos campos booleanos no cadastro do profissional |
| 8 | QR code do link de agendamento | — | Facilita divulicar o link físico (cartão, espelho da barbearia) — Booksy e Kinous fazem isso | Baixo/Médio | Geração client-side (lib de QR code) a partir do link `/[slug]` já existente |
| 9 | Mensagem de aniversário automática | — | Toque de retenção simples, presente em 3 concorrentes | Médio | Novo campo de data de nascimento do cliente (hoje não é coletado) + job agendado |

**Observação:** os itens 1, 4 e 9 dependem de rodar algo periodicamente
(hoje o Vez não tem nenhum job agendado) — vale resolver isso uma vez de
forma genérica (Vercel Cron Jobs chamando uma rota da API) e reaproveitar
pros três, em vez de montar um mecanismo por item.
