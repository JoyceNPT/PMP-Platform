import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard, GraduationCap, Wallet,
  Route, MessageSquare, Settings, ChevronRight
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

const navItems = [
  { key: 'common.dashboard', href: "/",         icon: LayoutDashboard },
  { key: 'common.gpa',       href: "/gpa",      icon: GraduationCap },
  { key: 'common.finance',   href: "/finance",  icon: Wallet },
  { key: 'common.roadmap',   href: "/roadmap",  icon: Route },
  { key: 'common.chat',      href: "/chat",     icon: MessageSquare },
]

export function Sidebar({ className }: { className?: string }) {
  const { t } = useTranslation()
  const location = useLocation()

  return (
    <aside className={cn("hidden md:flex flex-col w-72 h-screen border-r border-border bg-card/50 backdrop-blur-xl fixed left-0 top-0 z-40 transition-all duration-500", className)}>
      {/* Premium Branding */}
      <div className="flex h-24 items-center px-8">
        <Link to="/" className="flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30 group-hover:rotate-12 transition-all duration-500">
            <span className="text-white text-2xl font-black">P</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tighter leading-none">PMP</span>
            <span className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mt-1">Platform</span>
          </div>
        </Link>
      </div>

      {/* Navigation - Professional & Spaced */}
      <nav className="flex-1 overflow-y-auto px-6 py-8 space-y-10">
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/50 px-4">
            {t('sidebar.main', 'Menu Hệ thống')}
          </p>
          <div className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "group flex items-center gap-4 rounded-2xl px-5 py-4 text-sm font-bold transition-all duration-300",
                    isActive
                      ? "nav-active glow-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 shrink-0 transition-all duration-300",
                    isActive ? "scale-110 text-primary" : "group-hover:translate-x-1"
                  )} />
                  <span className="flex-1">{t(item.key)}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Footer Settings */}
      <div className="px-6 pb-10">
        <Link
          to="/settings"
          className={cn(
            "group flex items-center gap-4 rounded-2xl px-5 py-4 text-sm font-bold text-muted-foreground transition-all hover:text-foreground hover:bg-primary/5",
            location.pathname === "/settings" && "nav-active"
          )}
        >
          <Settings className="h-5 w-5 shrink-0" />
          <span>{t('common.settings')}</span>
        </Link>
      </div>
    </aside>
  )
}
