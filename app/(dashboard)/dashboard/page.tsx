import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { Users, Bot, MessageSquare, Plus, Smartphone, Megaphone, Target } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()

  const getCount = async (query: any) => {
    try {
      const { count, error } = await query
      if (error) {
        console.error("Dashboard count error:", error)
        return 0
      }
      return count || 0
    } catch (err) {
      console.error("Dashboard query exception:", err)
      return 0
    }
  }

  const contactsCount = await getCount(supabase.from('contacts').select('*', { count: 'exact', head: true }))
  const activeLeadsCount = await getCount(supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'open'))
  const openConversationsCount = await getCount(supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('status', 'open'))
  const activeAgentsCount = await getCount(supabase.from('agents').select('*', { count: 'exact', head: true }).eq('is_active', true))
  const whatsappAccountsCount = await getCount(supabase.from('whatsapp_accounts').select('*', { count: 'exact', head: true }))
  const campaignsCount = await getCount(supabase.from('campaigns').select('*', { count: 'exact', head: true }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Visão Geral</h1>
        <p className="text-muted-foreground">Acompanhe as métricas da sua operação.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contactsCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Leads Ativos</CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLeadsCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Conversas Abertas</CardTitle>
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openConversationsCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Agentes Ativos</CardTitle>
            <Bot className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAgentsCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Contas WhatsApp</CardTitle>
            <Smartphone className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{whatsappAccountsCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Campanhas</CardTitle>
            <Megaphone className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignsCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Link href="/agents/new" className={buttonVariants()}>
              <Plus className="w-4 h-4 mr-2" />
              Criar novo agente
            </Link>
            <Link href="/campaigns/new" className={buttonVariants({ variant: "outline" })}>
              Nova campanha
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
