import type { DefaultSession } from "next-auth"

// Module augmentation: estende o Session do NextAuth com os campos extras
// que colocamos no callback `session` em app/_lib/auth.ts.
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      slug?: string | null
      businessName?: string | null
      onboarded?: boolean
    } & DefaultSession["user"]
  }
}
