import type { Metadata } from "next"
import { Inter, Big_Shoulders, IBM_Plex_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import AuthProvider from "./_providers/auth"
import ProgressProvider from "./_components/progress-bar"

const inter = Inter({ subsets: ["latin"], variable: "--vz-font-sans" })
// "Big Shoulders Display" na família — a variável cobre os pesos condensados
// e pesados que a identidade usa só pra títulos e para o logotipo.
const bigShoulders = Big_Shoulders({
  subsets: ["latin"],
  weight: ["600", "700", "900"],
  variable: "--vz-font-display",
})
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--vz-font-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://agendavez.com.br/"),
  title: "Vez — Agenda online para barbeiro autônomo em Vila Velha",
  description:
    "Seu cliente marca o próprio horário, você recebe tudo organizado. Sem WhatsApp bagunçado, sem cliente esquecendo o corte. Teste grátis no Vez.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-br"
      className={`${inter.variable} ${bigShoulders.variable} ${plexMono.variable}`}
    >
      <body className="font-sans">
        <AuthProvider>
          <ProgressProvider>{children}</ProgressProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}
