"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, Scissors, Store } from "lucide-react"
import { cn } from "../../_lib/utils"

const ITEMS = [
  {
    href: "/dashboard",
    label: "Agenda",
    icon: CalendarDays,
    exact: true,
  },
  {
    href: "/dashboard/servicos",
    label: "Serviços",
    icon: Scissors,
  },
  {
    href: "/dashboard/negocio",
    label: "Meu negócio",
    icon: Store,
  },
]

export default function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-sm md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-2 text-[11px] font-medium",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
