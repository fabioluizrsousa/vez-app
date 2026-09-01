import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "./auth"
import { db } from "./prisma"

/** Sessão + registro completo do profissional logado. Redireciona se não houver login. */
export async function requireProfessional() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect("/entrar")
  }

  const professional = await db.user.findUnique({
    where: { id: session.user.id },
  })

  if (!professional) {
    redirect("/entrar")
  }

  return professional
}
