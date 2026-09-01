import Link from "next/link"
import { cn } from "../_lib/utils"

interface LogoProps {
  href?: string | null
  className?: string
}

const Logo = ({ href = "/", className }: LogoProps) => {
  const mark = (
    <span className={cn("font-display text-xl font-black lowercase", className)}>
      v<span className="text-primary">e</span>z
    </span>
  )

  if (!href) return mark

  return <Link href={href}>{mark}</Link>
}

export default Logo
