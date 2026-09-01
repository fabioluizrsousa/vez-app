import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "../_lib/auth"
import Logo from "../_components/logo"
import EntrarButton from "./entrar-button"

export default async function EntrarPage() {
  const session = await getServerSession(authOptions)
  if (session?.user) redirect("/dashboard")

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo href={null} className="text-3xl" />
      <div>
        <h1 className="font-display text-xl font-extrabold">
          Entrar na sua agenda
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Use sua conta do Google — sem senha nova pra lembrar.
        </p>
      </div>
      <EntrarButton />
    </div>
  )
}
