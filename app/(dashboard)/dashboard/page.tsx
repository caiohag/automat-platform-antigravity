import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { Users, Bot, MessageSquare, Send, Plus } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { count: contactsCount } = await supabase.from('contacts').select('*', { count: 'exact', head: true })
  const { count: activeAgentsCount } = await supabase.from('agents').select('*', { count: 'exact', head: true }).eq('status', 'active')
  const { count: openConversationsCount } = await supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('status', 'open')
  const { count: messagesSentCount } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('direction', 'outbound')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Visão Geral</h1>
        <p className="text-muted-foreground">Acompanhe as métricas da sua operação.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Agentes Ativos</CardTitle>
            <Bot className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAgentsCount || 0}</div>
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
            <CardTitle className="text-sm font-medium">Mensagens Enviadas</CardTitle>
            <Send className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messagesSentCount || 0}</div>
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
