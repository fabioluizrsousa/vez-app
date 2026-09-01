import Link from "next/link"
import Logo from "./_components/logo"

// Página raiz provisória. A landing page de marketing (hero cinematográfico,
// copy revisada, Expert Panel Scoring — ver landing-page-conteudo-secoes.md)
// ainda não foi construída visualmente; isso é o próximo passo depois da
// parte técnica. Por ora, só um ponto de entrada honesto pro profissional.
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <Logo href={null} className="text-3xl" />
      <p className="text-muted-foreground max-w-[36ch] text-sm">
        Agenda online para barbeiro autônomo. Sem bagunça de WhatsApp.
      </p>
      <Link
        href="/entrar"
        className="bg-primary rounded-md px-4 py-2.5 text-sm font-bold text-white"
      >
        Entrar como profissional
      </Link>
    </div>
  )
}
