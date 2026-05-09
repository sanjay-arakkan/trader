"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  BookOpen,
  Lightbulb,
  Settings,
  LogOut,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

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
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
]


function DesktopSidebar({ userName }: { userName: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const dailyQuote = useDailyQuote()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <aside className="hidden md:flex h-screen w-[260px] flex-col border-r border-border bg-[var(--sidebar)] ios-material">
      <div className="flex h-full flex-col">
        {/* Logo/Brand */}
        <div className="flex flex-col border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-primary">
              <Activity className="h-[18px] w-[18px] text-primary-foreground" />
            </div>
            <span className="text-[17px] font-semibold text-foreground tracking-[-0.01em]">
              Trader
            </span>
          </div>
          {dailyQuote && (
            <p className="text-[12px] text-muted-foreground italic leading-relaxed">
              &quot;{dailyQuote}&quot;
            </p>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-3 py-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[15px] font-medium transition-colors",
                  isActive
                    ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)] font-semibold"
                    : "text-foreground/70 hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-[20px] w-[20px]", isActive && "text-primary")} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-border p-4">
          <div className="mb-3 px-2">
            <p className="text-[12px] text-muted-foreground">Signed in as</p>
            <p className="truncate text-[14px] font-medium text-foreground">
              {userName}
            </p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-foreground/70 hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-[18px] w-[18px]" />
            Log out
          </Button>
        </div>
      </div>
    </aside>
  )
}


function MobileTabBar() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/80 ios-material safe-area-bottom">
      <div className="flex items-center justify-around h-[49px] pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-1 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-[22px] w-[22px]" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}


export function Sidebar({ userName }: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <DesktopSidebar userName={userName} />

      {/* Mobile Bottom Tab Bar */}
      <MobileTabBar />
    </>
  )
}
