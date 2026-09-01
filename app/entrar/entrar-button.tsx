"use client"

import Image from "next/image"
import { signIn } from "next-auth/react"
import { Button } from "../_components/ui/button"

export default function EntrarButton() {
  return (
    <Button
      variant="outline"
      className="gap-2 font-semibold"
      size="lg"
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
    >
      <Image alt="" src="/google.svg" width={18} height={18} />
      Entrar com Google
    </Button>
  )
}
