"use client"

import { useTransition } from "react"
import { deleteManualBlock } from "../../_actions/manual-blocks"

export default function ManualBlockActions({ blockId }: { blockId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await deleteManualBlock(blockId)
          window.dispatchEvent(new Event("vez:availability-changed"))
        })
      }
      className="text-muted-foreground hover:text-destructive font-mono text-[10.5px] uppercase"
    >
      {isPending ? "Removendo…" : "Desbloquear"}
    </button>
  )
}
