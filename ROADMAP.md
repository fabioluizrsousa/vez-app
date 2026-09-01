# Roadmap — ideias pra mais a frente

Este documento reúne o que **não** entra agora, levantado a partir da análise
de concorrentes/referências (AppBarber, Prit, Tua Agenda, MinhaAgenda,
Kinous, Booksy, Ageenda) em 31/08/2026. A ideia é não perder essas ideias de
vista, sem inflar o escopo do MVP atual — nada aqui é compromisso, é
material pra decidir com calma quando fizer sentido.

Pra o que já dá pra encaixar no app agora (sem novo provedor pago, só com o
que já está no stack), ver a conversa — os itens mais rápidos foram:
avaliação real de cliente pós-atendimento, link "avalie no Google",
comodidades/formas de pagamento/horário na página pública, QR code do link,
e as mensagens automáticas de aniversário e de recuperação de cliente
inativo (essas usando a integração de WhatsApp que já existe).

## Avaliações — visão completa

Já é requisito registrado: **avaliação de clientes reais** e
**avaliações no Google**. A versão simples (link fixo pro Google e
formulário próprio pós-atendimento) já foi listada como "implementável
agora". A versão completa, pra mais a frente:

- **Selo de "cliente confirmado"**, como o Booksy faz: só quem teve um
  `Booking` de fato marcado como concluído pode avaliar aquele atendimento
  específico — evita avaliação falsa/comprada, e a avaliação já vem
  vinculada ao serviço e à data.
- **Histograma de notas** (quantas 5, 4, 3...) e ordenação (mais recentes /
  melhor avaliadas), como o Booksy mostra no perfil.
- **Fotos de clientes** anexadas à avaliação (opcional).
- **Integração ativa com o Google** (não só um link): puxar a nota e o
  número de avaliações reais do Google Business Profile do profissional via
  Google Places API e mostrar isso ao vivo na página pública, ao lado da
  nota interna do Vez. Isso exige uma chave de API paga do Google (cobra por
  uso) — avaliar custo antes de implementar.

## Preços / monetização

O Vez hoje é gratuito e sem conta pro cliente. Se um dia virar produto
pago, os concorrentes mostram dois padrões bem diferentes:

- **Por número de profissionais** (AppBarber, Ageenda, Prit): plano cresce
  junto com a equipe do estabelecimento. Faz sentido pra quem vende pra
  barbearias com equipe.
- **Plano único, sem tiers** (Kinous: R$ 49,90/mês tudo incluso + valor por
  "agenda"/unidade extra; Tua Agenda: um preço só, o que varia é só a
  periodicidade — mensal R$ 19,90, semestral R$ 99,50, anual R$ 199,00, com
  desconto crescente).

**Recomendação:** como o Vez é pensado pro barbeiro autônomo solo (não pra
barbearia com equipe), o modelo por nº de profissionais não bate com o
público — faria mais sentido um plano único e simples, no estilo Tua
Agenda/Kinous, com desconto pra pagamento semestral/anual. Um possível
"segundo profissional" só entraria como tema de precificação se o Vez algum
dia passar a suportar equipe (ver seção "Multi-profissional" abaixo).

Vale considerar também **teste grátis sem pedir cartão** (praticamente
todos os concorrentes fazem isso — Tua Agenda, Ageenda, Kinous, Booksy) como
padrão de conversão, e ter clareza de que **mensagens de WhatsApp têm custo
real** (a Meta cobra por conversa) — a Ageenda, por exemplo, vende
"lembretes via WhatsApp" como add-on separado do plano base, e o Kinous
expõe um painel de "créditos" de WhatsApp pro dono acompanhar gasto. Se o
Vez cobrar um dia, decidir se WhatsApp entra no preço base ou é add-on
evita começar no prejuízo por conversa enviada.

## Cobrança / Stripe

Dois usos possíveis de um provedor de pagamento, que são projetos
diferentes:

1. **Cobrar a assinatura do barbeiro pelo uso do Vez** (SaaS billing) — é o
   uso clássico do Stripe (Stripe Billing/Checkout): plano recorrente,
   trial, cancelamento self-service.
2. **Cobrança antecipada/sinal do cliente final**, pra reduzir falta —
   ideia do Prit ("Reduza ausências com a cobrança antecipada") e da
   Ageenda (Pix integrado pro cliente pagar na hora de agendar). Esse é um
   fluxo mais delicado (mexe com o dinheiro do cliente final, não só do
   barbeiro assinante) e pode ser um passo posterior ao billing do SaaS.

**Atenção pro contexto brasileiro:** a maioria dos concorrentes que cobra do
cliente final usa **Pix**, não cartão via Stripe — é o método que o público
autônomo/informal mais usa e sem taxa pro cliente. O Stripe processa cartão
bem, mas o suporte a Pix no Brasil precisa ser confirmado na documentação
oficial antes de decidir (a cobertura de meios de pagamento locais muda com
o tempo) — vale essa checagem antes de comprometer com Stripe puro, ou
considerar um provedor brasileiro (Mercado Pago, Pagar.me, Asaas) como
alternativa ou complemento pro Pix especificamente.

## Multi-profissional / equipe

Hoje o modelo de dados do Vez é 1 `User` = 1 profissional autônomo. Virar
multi-profissional (uma barbearia com vários barbeiros) é uma mudança de
escopo grande, não um ajuste pequeno — envolve:

- Perfis de acesso por papel (o Kinous tem 5: dono, gerente, recepcionista,
  profissional, aprendiz).
- Serviço vinculado ao profissional que o realiza, e o cliente escolhendo
  quem quer.
- Comissão calculada automaticamente por serviço/profissional (Kinous,
  MinhaAgenda).
- Disponibilidade e ausências (férias, folga) configuradas por profissional
  individualmente, com substituição automática sugerida quando alguém falta
  (Kinous).

Não é algo pra decidir de forma isolada — muda a modelagem de dados
(`modelagem-dados-mvp.md`) inteira. Registrado aqui como possibilidade, não
como próximo passo.

## Agendamento múltiplo (vários serviços/clientes num só horário)

Diferencial do Kinous: um pai agenda corte pra ele e pro filho ao mesmo
tempo, ou um cliente combina corte + barba + sobrancelha num único
agendamento, e o sistema encaixa tudo automaticamente respeitando duração e
profissional. É tecnicamente complexo (motor de otimização de horários) e
só compensa se virar um pedido real de usuário — por ora, o Vez já resolve
o caso mais comum (combos como serviço único, ex. "Corte + Barba" como um
`Service` só, do jeito que várias barbearias analisadas também fazem).

## Marketing automatizado

Padrão comum a quase todos os concorrentes (AppBarber, Kinous, Ageenda,
MinhaAgenda): detectar cliente que sumiu (não agenda há X dias) e sugerir
(ou mandar automaticamente) uma mensagem de "sentimos sua falta" via
WhatsApp; e mandar campanhas pontuais (promoção, novidade) pra quem
autorizou receber. Os itens simples disso (aniversário, recuperação de
inativo) já estão na lista do "implementável agora" — a parte de roadmap é
a versão com **campanha em massa configurável pelo dono** (escolher texto,
público-alvo, data de envio) e **opt-in explícito do cliente** (LGPD:
precisa de consentimento claro pra mandar mensagem de marketing, diferente
da mensagem transacional de confirmação de agendamento que já existe).

## Onboarding com IA

Ideia do Kinous: o barbeiro tira foto da tabela de preços/cartão de visita
e a IA preenche os serviços automaticamente, só revisando depois. Reduz
bastante o atrito do cadastro inicial (hoje, no Vez, o onboarding é
manual). Só vale o investimento se o cadastro manual atual se mostrar um
ponto real de abandono — por enquanto é só uma ideia registrada.

## Outros itens menores pra mais a frente

- **Pacotes e cartões-presente** (Booksy, AppBarber) — cliente compra um
  combo de sessões antecipado (ex. 4 cortes) ou um vale-presente.
- **Relatórios financeiros com gráficos e metas** (MinhaAgenda, Tua Agenda,
  Ageenda) — receita, lucro, despesas, comparação mês a mês. Só faz sentido
  depois que o Vez tiver algum registro de pagamento (hoje não tem).
- **App nativo (iOS/Android)** — todos os concorrentes analisados têm.
  Contradiz um pouco a proposta atual do Vez ("sem instalar nada"), mas
  pode fazer sentido no futuro como app *do profissional* (não do
  cliente) pra notificações push da agenda do dia.
