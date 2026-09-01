import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { db } from "../_lib/prisma"
import Header from "../_components/header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/entrar")

  const professional = await db.user.findUnique({
    where: { id: session.user.id },
    select: { onboarded: true },
  })

  if (!professional?.onboarded) redirect("/onboarding")

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-5 py-6">{children}</main>
    </div>
  )
}
