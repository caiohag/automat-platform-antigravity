"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  MessageCircle,
  Kanban,
  Contact,
  Smartphone,
  Bot,
  Workflow,
  Megaphone,
  Tag,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Building,
  ListTodo,
  CheckSquare,
  RotateCcw,
  Users,
  CreditCard,
  Palette,
  HelpCircle,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface NavItem {
  name: string
  href: string
  icon: any
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: "Visão Geral",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Contas", href: "/accounts", icon: Building },
    ],
  },
  {
    label: "Atendimento",
    items: [
      { name: "Chat", href: "/chat", icon: MessageCircle },
      { name: "Pipeline", href: "/pipeline", icon: ListTodo },
      { name: "Kanban", href: "/kanban", icon: Kanban },
      { name: "Contatos", href: "/contacts", icon: Contact },
      { name: "Tarefas", href: "/tasks", icon: CheckSquare },
    ],
  },
  {
    label: "Automação",
    items: [
      { name: "Contas WhatsApp", href: "/whatsapp", icon: Smartphone },
      { name: "Agentes IA", href: "/agents", icon: Bot },
      { name: "Fluxos", href: "/flows", icon: Workflow },
    ],
  },
  {
    label: "Marketing",
    items: [
      { name: "Campanhas", href: "/campaigns", icon: Megaphone },
      { name: "Remarketing", href: "/remarketing", icon: RotateCcw },
      { name: "Templates", href: "/templates", icon: Tag },
    ],
  },
  {
    label: "Gestão",
    items: [
      { name: "Equipe", href: "/team", icon: Users },
      { name: "Assinatura", href: "/subscription", icon: CreditCard },
      { name: "White-Label", href: "/white-label", icon: Palette },
      { name: "Configurações", href: "/settings", icon: Settings },
      { name: "Central de Ajuda", href: "/help", icon: HelpCircle },
    ],
  },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [user, setUser] = useState<any>(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user)
    })
  }, [supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const userName = user?.user_metadata?.full_name || user?.email || "Usuário"
  const userInitials = userName.substring(0, 2).toUpperCase()

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 items-center border-b px-4", isCollapsed ? "justify-center" : "justify-between")}>
        {!isCollapsed && <span className="text-lg font-bold">Automat</span>}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      <ScrollArea className="flex-1 py-4">
        <div className="space-y-6 px-2">
          {navGroups.map((group, i) => (
            <div key={i}>
              {!isCollapsed && (
                <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </h4>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  const link = (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                        isCollapsed ? "justify-center" : "justify-start"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
                      {!isCollapsed && <span>{item.name}</span>}
                    </Link>
                  )

                  return isCollapsed ? (
                    <Tooltip key={item.href}>
                      <TooltipTrigger render={link} />
                      <TooltipContent side="right">{item.name}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <div key={item.href}>{link}</div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "space-x-3")}>
            <Avatar className="h-9 w-9">
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium">{userName}</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
              <LogOut size={18} />
            </Button>
          )}
        </div>
        {isCollapsed && (
          <div className="mt-4 flex justify-center">
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
              <LogOut size={18} />
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden border-r bg-card transition-all duration-300 md:block",
          isCollapsed ? "w-[64px]" : "w-[240px]"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <div className="flex w-full flex-col md:hidden">
          <header className="flex h-16 items-center justify-between border-b bg-card px-4">
            <span className="text-lg font-bold">Automat</span>
            <SheetTrigger render={<Button variant="ghost" size="icon" />}>
              <Menu size={20} />
            </SheetTrigger>
          </header>
          <SheetContent side="left" className="w-[240px] p-0">
            <SidebarContent />
          </SheetContent>
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </Sheet>

      {/* Desktop Main Content */}
      <main className="hidden flex-1 overflow-auto p-4 md:block md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
