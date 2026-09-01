# Vez — código do MVP

Fork técnico do [BarberLab](https://github.com/LuanPaD/BarberLab), adaptado pro
escopo e pra identidade visual definidos nas conversas anteriores. Este README
assume que você já leu (ou tem em mãos) os documentos que guiaram as decisões:

- `modelagem-dados-mvp.md` — o porquê de cada entidade
- `jornadas-cliente-barbeiro.md` — o porquê de cada tela
- `identidade-visual.html` / `telas-produto.html` — a identidade Copper & Grafite

## O que já funciona

- **Schema novo** (`prisma/schema.prisma`), sem a falha de "barbearia sem
  dono" do BarberLab original: `User` agora carrega os campos do negócio
  (`businessName`, `slug`, `phone`, `address`, `cancellationWindowHours`).
- **Identidade aplicada de verdade** — não é só CSS solto: `app/globals.css`
  define os tokens Copper & Grafite (`--vz-*`) e os mapeia pras variáveis que
  o shadcn/ui já usa (`--color-primary`, `--color-border` etc.), então todos
  os componentes de UI já nascem na paleta certa. Big Shoulders Display só em
  título/logo, Inter no resto, IBM Plex Mono em preço/hora — como decidido.
- **Perfil público do profissional** (`/[slug]`) — tela 1.
- **Fluxo de agendamento sem login** (`/[slug]/agendar`) — telas 2 e 3 num
  componente só (`booking-wizard.tsx`), com o cálculo de horários livres de
  verdade (`app/_lib/slots.ts`): cruza `Availability`, `ManualBlock` e
  `Booking`s confirmados, revalida no servidor antes de criar (evita dois
  clientes pegarem o mesmo horário na corrida).
- **Tela de sucesso** (`/[slug]/sucesso/[bookingId]`) — tela 4.
- **Cancelamento pelo cliente** (`/cancelar/[token]`) — não estava nos 6
  mocks, mas é passo 7 da jornada do cliente e usa a mesma regra de negócio
  (`cancellationWindowHours`) já modelada, então entrou.
- **Agenda do dia do profissional** (`/dashboard`) — tela 5, com os cards de
  faturado/agendamentos calculados de verdade a partir dos `Booking`s do dia.
- **Serviços e preços** (`/dashboard/servicos`) — tela 6, com dialog de
  criar/editar/pausar serviço.
- **Onboarding e configurações** (`/onboarding`, `/dashboard/negocio`) — não
  estava nos mocks, mas sem isso o profissional não tem como definir nome do
  negócio, slug ou disponibilidade semanal depois do login. Sem essa tela o
  resto não roda de verdade.
- **Login do profissional** reaproveitado do BarberLab (Google via NextAuth),
  como decidido — só adaptei o callback de sessão pra carregar `slug` e
  `onboarded`.
- **Foto de perfil e logo do negócio** (`/dashboard/negocio`) — sem serviço de
  storage de arquivos configurado (Vercel Blob, S3...), a imagem é
  redimensionada no navegador (`app/_lib/resize-image.ts`) e salva como data
  URL direto nos campos `image`/`logoUrl` de `User`. Funciona bem pro
  tamanho de foto de perfil/logo; se um dia crescer pra fotos maiores
  (portfólio de cortes, por exemplo), aí sim vale migrar pra um storage de
  verdade.
- **Adicionar na agenda do celular** — em `[slug]/sucesso/[bookingId]` (pro
  cliente) e em cada linha da agenda do dashboard (pro barbeiro), um link
  baixa um `.ics` (`app/api/bookings/[bookingId]/calendar/route.ts`,
  gerado por `app/_lib/calendar-event.ts`) que qualquer app de calendário
  (Google Calendar, Apple Calendar, Outlook...) reconhece. Não depende de
  nenhuma API externa.
- **Avaliação do cliente pós-atendimento** (`/avaliar/[token]`) — depois que
  o horário marcado já passou (2h de folga, ver `BUFFER_MINUTES` em
  `app/api/cron/review-requests/route.ts`), uma varredura periódica (Vercel
  Cron, configurada em `vercel.json`) manda um WhatsApp com o link. Só quem
  tem um `Booking` de verdade avalia — a nota fica vinculada a esse
  agendamento, então não dá pra fabricar avaliação. As notas aparecem em
  `/[slug]`, com média e lista. Tem também um campo opcional de link do
  Google (`googleReviewUrl`, editável em `/dashboard/negocio`) — mostrado
  como botão na página pública e oferecido de novo depois que o cliente
  termina de avaliar por dentro do Vez.
- **Aviso de agendamento via WhatsApp** (`app/_actions/create-booking.ts`,
  usando `app/_lib/whatsapp.ts` e `app/_lib/phone.ts`) — manda uma mensagem
  de template pro barbeiro (novo agendamento + link da agenda + link do
  calendário) e outra pro cliente (confirmação + link do calendário) via
  WhatsApp Business Platform (Cloud API da Meta), registrando o resultado
  em `ReminderLog`. **Só funciona depois de configurar a conta na Meta** —
  sem isso o código não quebra, só não manda nada (`sendWhatsAppTemplate`
  retorna `skipped: true`). Passo a passo:

  1. Crie (ou use) uma conta em [business.facebook.com](https://business.facebook.com).
  2. Em [developers.facebook.com](https://developers.facebook.com), crie um
     App, tipo "Business", e adicione o produto **WhatsApp**.
  3. No painel do produto WhatsApp você já ganha um número de teste grátis
     (manda pra até 5 números verificados) e um **token de acesso
     temporário** (23h) — bom pra testar rápido. Copie o `Phone number ID`
     que aparece lá.
  4. Pra produção: em Configurações do Negócio → Usuários do Sistema, crie
     um **usuário de sistema**, gere um **token permanente** com permissão
     `whatsapp_business_messaging`, e registre um número de telefone real
     pro WhatsApp Business (não pode ser um número já usado no WhatsApp
     pessoal/comum) — isso pode exigir verificação do negócio na Meta
     (processo de dias, às vezes mais).
  5. Em **WhatsApp Manager → Modelos de mensagem**, crie os três templates
     abaixo (idioma "Português (BR)", categoria **Utilitário**) — os nomes
     e a ordem das variáveis têm que bater exatamente com o que o código
     manda:

     - `novo_agendamento_barbeiro`: "Novo agendamento! {{1}} marcou {{2}}
       para {{3}} às {{4}}. Agenda: {{5}} · Adicionar ao calendário: {{6}}"
       — variáveis: nome do cliente, serviço, data, hora, link do
       dashboard, link do calendário.
     - `confirmacao_agendamento_cliente`: "Seu horário em {{1}} está
       confirmado: {{2}} às {{3}}. Adicionar ao calendário: {{4}}" —
       variáveis: nome do negócio, data, hora, link do calendário.
     - `avaliacao_pos_atendimento`: "Oi {{1}}! Como foi seu atendimento na
       {{2}}? Deixe sua avaliação, é rápido: {{3}}. Obrigado!" — variáveis:
       primeiro nome do cliente, nome do negócio, link de avaliação. (Não dá
       pra terminar o texto com uma variável — a Meta recusa com "as
       variáveis não podem estar no início ou no fim do modelo" — por isso o
       "Obrigado!" depois do link.)

     A aprovação da Meta costuma sair em minutos a algumas horas pra
     templates utilitários simples como esses.
  6. Preencha no `.env`: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`
     (e, se usar nomes de template diferentes dos acima,
     `WHATSAPP_TEMPLATE_BARBEIRO`/`WHATSAPP_TEMPLATE_CLIENTE`/
     `WHATSAPP_TEMPLATE_AVALIACAO`).

  O número que recebe o aviso do barbeiro é o campo "WhatsApp" cadastrado
  em `/dashboard/negocio`; o do cliente é o que ele digita no agendamento.
  Ambos passam por `toWhatsAppE164BR` (`app/_lib/phone.ts`), que espera um
  celular brasileiro (DDD + 9 dígitos) — número em outro formato é
  ignorado silenciosamente, sem quebrar o agendamento.

### Sobre o Cron Job de avaliações

`vercel.json` declara um Vercel Cron Job que chama
`/api/cron/review-requests` uma vez por dia (`0 18 * * *`, ou seja 18h UTC —
15h em Vila Velha/ES). Isso é o que dispara o convite de avaliação; sem
fazer o deploy com esse arquivo (ou em outro host que não leia
`vercel.json`), a rota existe mas nunca é chamada sozinha.

- O **plano Hobby da Vercel só permite Cron Jobs uma vez por dia** — se um
  dia o projeto estiver no plano Pro, dá pra apertar a frequência (por
  exemplo `*/30 * * * *`, a cada 30 min) pra o convite sair mais perto do
  fim do buffer de 2h.
- Configure `CRON_SECRET` no `.env` **e** na Vercel (Project Settings →
  Environment Variables) com o mesmo valor — é o que a Vercel manda no
  header `Authorization` quando chama o cron, e o que a rota confere antes
  de processar qualquer coisa. Sem essa variável configurada nos dois
  lugares, a rota fica sem proteção nenhuma (qualquer um poderia chamá-la).

## O que NÃO está implementado (de propósito)

- **Landing page de marketing** (a versão cinematográfica, com a copy já
  revisada em `landing-page-conteudo-secoes.md`) — a rota `/` hoje é só um
  ponto de entrada honesto pro profissional logar. Construir a landing de
  verdade é o próximo passo natural depois desta parte técnica.
- **Cobrança/assinatura** — fora do MVP por decisão sua.

## Rodando localmente

```bash
npm install          # o postinstall já roda "prisma generate"
cp .env.example .env # preencha DATABASE_URL, GOOGLE_CLIENT_ID/SECRET, NEXT_AUTH_SECRET
npx prisma migrate dev --name init
npm run seed          # cria o profissional de exemplo "Renato Cortes"
npm run dev
```

Depois disso:
- `http://localhost:3000/renato-cortes` — perfil público de exemplo, já com
  serviços e agenda de amostra (dados do `prisma/seed.ts`).
- `http://localhost:3000/entrar` — login do profissional (precisa de um
  OAuth Client do Google configurado em console.cloud.google.com, com
  `http://localhost:3000/api/auth/callback/google` na lista de redirect URIs).

### Sobre o Prisma 7

A connection string não fica mais dentro de `prisma/schema.prisma` — o
Prisma 7 moveu isso pra `prisma.config.ts`, na raiz do projeto (é ele que
`prisma generate`/`migrate`/`db seed` leem; o app em si continua pegando
`DATABASE_URL` direto do `.env`, sem depender desse arquivo). As versões do
Prisma no `package.json` estão fixadas em `7.10.0` (sem `^`) de propósito —
o Prisma 7 ainda está mudando rápido, inclusive com quebras dentro do próprio
major, então travar a versão evita que um `npm install` futuro puxe uma
versão mais nova com outra mudança de configuração no meio do caminho. Se um
dia quiser atualizar, é troca deliberada, olhando o changelog antes.

### Sobre fuso horário

O app trata todo horário como local (sem conversão UTC), pra não haver
deslocamento entre o que o cliente escolhe e o que fica salvo — ver o
comentário em `app/_lib/datetime.ts`. Isso só fica correto em produção se o
servidor rodar com `TZ=America/Sao_Paulo` (na Vercel: variável de ambiente
`TZ`; em outros hosts, geralmente uma env var igual). Sem isso, horários e a
janela de cancelamento podem ficar até 3h deslocados.

## Solução de problemas

### `DATABASE_URL` corrompida na Vercel ("Can't reach database server at base")

Se o login (ou qualquer rota que toque o banco) começar a falhar em produção
com um erro do Prisma do tipo `Can't reach database server at base:5432`
(host truncado, terminando em algo sem sentido tipo `base`), o problema é a
env var `DATABASE_URL` do projeto na Vercel — não o `.env` local, que
continuava correto quando isso aconteceu.

A causa exata não ficou 100% confirmada, mas o padrão observado foi a
variável estar marcada como **"Secret"** no painel (esconde o valor, não dá
pra comparar caractere por caractere) em vez de **"Config"/texto plano**
(mostra o valor salvo) — o que também impede diagnosticar se o valor salvo
bateu com o do `.env` sem recriar tudo às cegas.

**Como resolver:**

1. No painel da Vercel: Project → Settings → Environment Variables → remova
   a `DATABASE_URL` atual.
2. Recrie do zero, colando o valor direto do `.env` local (formato Neon:
   `postgresql://usuario:senha@host-pooler.../neondb?sslmode=require&channel_binding=require&uselibpqcompat=true`).
   Se o painel oferecer a opção, marque como **"Config"/texto plano** (não
   "Secret"), pra dar pra conferir o valor depois se acontecer de novo.
3. Redeploy (`vercel --prod`).
4. Teste o login em `/entrar`. Se o erro persistir mas mudar de mensagem, já
   não é mais a `DATABASE_URL` — é outra causa.

Recriar do zero resolveu da última vez. Vale o hábito: sempre que mexer numa
env var sensível na Vercel, prefira texto plano/"Config" em vez de "Secret"
pra esse projeto, já que ele não guarda nenhum dado que precise desse nível
de proteção.

## Estrutura

```
app/
  [slug]/                    tela 1 (perfil público) + agendar/ (telas 2-3) + sucesso/ (tela 4)
  cancelar/[token]/          cancelamento pelo cliente
  avaliar/[token]/           avaliação do cliente pós-atendimento
  dashboard/                 área logada do profissional (telas 5-6 + negócio)
  entrar/, onboarding/       login e primeiro cadastro
  api/cron/review-requests/  varredura diária que dispara o convite de avaliação
  _actions/                  server actions (mutações + cálculo de horários livres)
  _data/                     leituras server-side
  _lib/                      prisma client, auth, slug, formatação, datas, slots
  _components/ui/            shadcn/ui (mantido do BarberLab, agora na paleta nova)
prisma/schema.prisma          o schema novo, comentado com o que mudou do BarberLab
vercel.json                   Cron Job diário (ver "Sobre o Cron Job de avaliações")
```
