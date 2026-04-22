import { Bell, Menu } from "lucide-react"
import { Link } from "react-router-dom"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "./Sidebar"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/store/authStore"
import { ModeToggle } from "@/components/mode-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { Button } from "@/components/ui/button"
import { CONFIG } from "@/config"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  const { user, logout } = useAuthStore()
  const { t } = useTranslation()

  // User avatar initials
  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const avatarSrc = (user?.avatarUrl && user.avatarUrl.trim() !== '')
    ? (user.avatarUrl.startsWith('http') 
        ? user.avatarUrl 
        : `${CONFIG.API_BASE_URL.replace('/api', '')}/${user.avatarUrl}`)
    : null;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card/80 backdrop-blur px-4 md:px-6">
      {/* Mobile Sidebar Trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <Sidebar className="w-full h-full border-none shadow-none static" />
        </SheetContent>
      </Sheet>

      {/* Left: page breadcrumb placeholder */}
      <div className="flex-1">
         <h2 className="font-bold md:hidden text-primary">PMP</h2>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-[1.15rem] w-[1.15rem]" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
        </Button>

        <LanguageToggle />
        <ModeToggle />

        {/* User avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold ring-2 ring-primary/30 transition hover:ring-primary/60 overflow-hidden">
              {avatarSrc ? (
                <img src={avatarSrc} alt={user?.fullName} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
              <span className="font-semibold text-sm">{user?.fullName}</span>
              <span className="text-xs text-muted-foreground font-normal truncate">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer w-full flex items-center">{t('common.settings')}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              {t('common.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
