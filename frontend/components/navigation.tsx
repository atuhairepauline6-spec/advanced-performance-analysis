"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="w-2 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">AcademicPro</span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1 md:gap-2">
          <Link href="/">
            <Button variant="ghost" className={cn("text-sm font-medium", pathname === "/" && "bg-muted text-primary")}>
              Dashboard
            </Button>
          </Link>
          <Link href="/upload">
            <Button
              variant="ghost"
              className={cn("text-sm font-medium", pathname === "/upload" && "bg-muted text-primary")}
            >
              Upload Dataset
            </Button>
          </Link>
          <Link href="/history">
            <Button
              variant="ghost"
              className={cn("text-sm font-medium", pathname === "/history" && "bg-muted text-primary")}
            >
              History
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
