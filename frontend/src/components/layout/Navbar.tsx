import React from "react"
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
import { Logo } from "@/components/shared/Logo"
import apiClient from "@/services/apiClient"
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
  const [announcement, setAnnouncement] = React.useState<string>("")

  React.useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const res = await apiClient.get('/system/announcement');
        if (res.data && res.data.succeeded) {
          setAnnouncement(res.data.data);
        }
      } catch (error) {
        console.error("Failed to load announcement", error);
      }
    };
    fetchAnnouncement();
  }, []);

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
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 sm:gap-4 glass bg-background/80 border-b border-border/50 px-3 sm:px-4 md:px-8 overflow-hidden">
      {/* Mobile Sidebar Trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <Sidebar className="w-full h-full border-none shadow-none static" isMobile={true} />
        </SheetContent>
      </Sheet>

      {/* Left: Branding for mobile */}
      <div className="flex items-center gap-2 md:hidden">
         <Logo size={28} />
         <span className="font-bold text-lg tracking-tighter leading-none bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">PMP</span>
      </div>

      {/* Center: Running Announcement Ticker */}
      <div className="flex-1 flex justify-center overflow-hidden">
        {announcement && (
          <div className="hidden sm:flex items-center w-full max-w-xs md:max-w-md lg:max-w-lg h-9 px-4 rounded-full bg-primary/5 border border-primary/10 overflow-hidden relative shadow-inner shadow-primary/5">
            <style>{`
              @keyframes marquee-ltr {
                0% { transform: translateX(100%); }
                100% { transform: translateX(-100%); }
              }
              .marquee-container {
                overflow: hidden;
                white-space: nowrap;
                display: flex;
                align-items: center;
                width: 100%;
              }
              .marquee-text {
                display: inline-block;
                animation: marquee-ltr 22s linear infinite;
                padding-left: 20px;
              }
              .marquee-text:hover {
                animation-play-state: paused;
              }
              .mask-gradient {
                mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
                -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
              }
            `}</style>
            <div className="marquee-container w-full mask-gradient">
              <span className="marquee-text text-xs font-bold text-primary tracking-wide">
                {announcement}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-primary border-2 border-background" />
        </Button>

        <div className="h-6 w-px bg-border/50 mx-0.5 hidden sm:block" />

        <div className="hidden sm:block"><LanguageToggle /></div>
        <ModeToggle />

        {/* User avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white text-sm font-black shadow-lg shadow-primary/20 ring-2 ring-primary/10 transition-all hover:scale-105 active:scale-95 overflow-hidden">
              {avatarSrc ? (
                <img src={avatarSrc} alt={user?.fullName} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 glass p-2 mt-2">
            <DropdownMenuLabel className="flex flex-col gap-1 py-3 px-4">
              <span className="font-bold text-base leading-none">{user?.fullName}</span>
              <span className="text-xs text-muted-foreground font-medium truncate">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem asChild className="rounded-lg py-3 cursor-pointer">
              <Link to="/settings" className="w-full flex items-center font-semibold">
                <span className="flex-1">{t('common.settings')}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem
              onClick={logout}
              className="text-rose-500 focus:text-rose-600 focus:bg-rose-500/10 rounded-lg py-3 font-bold cursor-pointer"
            >
              {t('common.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
