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

export function Sidebar() {
  const { t } = useTranslation()
  const location = useLocation()

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 h-screen border-r bg-card fixed left-0 top-0 z-40 transition-all duration-300">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-bold">P</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-sm">PMP Platform</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Dashboard</span>
          </div>
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-3">
          {t('sidebar.main', 'Main Menu')}
        </p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "nav-active"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} />
              <span className="flex-1">{t(item.key)}</span>
              {isActive && (
                <ChevronRight className="h-3 w-3 text-primary/60 ml-auto" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom settings */}
      <div className="px-3 pb-4 border-t pt-4">
        <Link
          to="/settings"
          className={cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-muted",
            location.pathname === "/settings" && "nav-active"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>{t('common.settings')}</span>
        </Link>
      </div>
    </aside>
  )
}
