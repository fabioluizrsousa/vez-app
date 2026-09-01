import { PrismaAdapter } from "@auth/prisma-adapter"
import { AuthOptions } from "next-auth"
import { db } from "./prisma"
import { Adapter } from "next-auth/adapters"
import GoogleProvider from "next-auth/providers/google"

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { slug: true, businessName: true, onboarded: true },
      })
      session.user = {
        ...session.user,
        id: user.id,
        slug: dbUser?.slug ?? null,
        businessName: dbUser?.businessName ?? null,
        onboarded: dbUser?.onboarded ?? false,
      }
      return session
    },
  },
  secret: process.env.NEXT_AUTH_SECRET,
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/entrar",
  },
  debug: false,
}
