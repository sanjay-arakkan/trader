"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  BookOpen,
  Lightbulb,
  Settings,
  LogOut,
  ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDailyQuote } from "@/hooks/use-daily-quote"

interface SidebarProps {
  userName: string
}

const navItems = [
  {
    name: "Journal",
    href: "/journal",
    icon: BookOpen,
  },
  {
    name: "Insights",
    href: "/insights",
    icon: Lightbulb,
  },
]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

export function Sidebar({ userName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const dailyQuote = useDailyQuote()

  const firstName = userName.split(" ")[0] || "User"
  const greeting = getGreeting()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="sticky top-0 z-50 w-full pointer-events-none">
      <header className="w-full pointer-events-auto bg-card/90 backdrop-blur-md supports-[backdrop-filter]:bg-card/60 border border-border ios-shadow">
        <div className="flex flex-wrap items-center justify-between px-4 py-4 sm:flex-nowrap sm:px-6 sm:h-20 sm:py-0">

          {/* Left Section: Greeting & Quote */}
          <div className="flex flex-col items-start min-w-0 flex-1 order-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground truncate w-full">
              {greeting}, {firstName}
            </h1>
            <p className="text-xs text-muted-foreground truncate w-full max-w-md mt-0.5" title={dailyQuote}>
              {dailyQuote || "Loading..."}
            </p>
          </div>

          {/* Middle Section: Navigation Pill */}
          <div className="flex w-full justify-center order-3 mt-4 sm:mt-0 sm:order-2 sm:w-auto sm:flex-1">
            <nav className="flex items-center gap-1 bg-accent/30 p-1 rounded-full border border-border/50">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Right Section: Actions & User Menu */}
          <div className="flex items-center justify-end gap-3 order-2 flex-1 sm:order-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 px-1.5 pr-2 gap-2 rounded-full bg-accent/30 hover:bg-accent border border-border/50 text-foreground transition-all duration-200 focus-visible:ring-0 focus-visible:ring-offset-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <span className="text-[10px] font-bold">{firstName.charAt(0).toUpperCase()}</span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-muted-foreground opacity-70 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer flex w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

        </div>
      </header>
    </div>
  )
}
