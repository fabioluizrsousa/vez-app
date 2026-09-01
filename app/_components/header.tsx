import Link from "next/link"
import Logo from "./logo"
import UserMenu from "./user-menu"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Agenda" },
  { href: "/dashboard/servicos", label: "Serviços" },
  { href: "/dashboard/negocio", label: "Meu negócio" },
]

const Header = () => {
  return (
    <header className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Logo href="/dashboard" />

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-foreground/80 hover:text-primary text-sm font-medium transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <UserMenu />
      </div>
    </header>
  )
}

export default Header
