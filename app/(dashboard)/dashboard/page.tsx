import Link from 'next/link'
import {
  Bot,
  MessageSquare,
  Plus,
  Smartphone,
  Target,
  Users,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  let totalContacts = 0
  try {
    const { data, error } = await supabase.from('contacts').select('id', { count: 'exact' })
    if (!error) totalContacts = data?.length ?? 0
  } catch {
    totalContacts = 0
  }

  let openConversations = 0
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('id', { count: 'exact' })
      .eq('status', 'open')
    if (!error) openConversations = data?.length ?? 0
  } catch {
    openConversations = 0
  }

  let activeAgents = 0
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('id', { count: 'exact' })
      .eq('is_active', true)
    if (!error) activeAgents = data?.length ?? 0
  } catch {
    activeAgents = 0
  }

  let connectedWhatsappAccounts = 0
  try {
    const { data, error } = await supabase
      .from('whatsapp_accounts')
      .select('id', { count: 'exact' })
      .eq('status', 'connected')
    if (!error) connectedWhatsappAccounts = data?.length ?? 0
  } catch {
    connectedWhatsappAccounts = 0
  }

  let messagesSentInMonth = 0
  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const { data, error } = await supabase
      .from('usage')
      .select('messages_sent')
      .gte('month', monthStart.toISOString().slice(0, 10))
      .lt('month', nextMonthStart.toISOString().slice(0, 10))

    if (!error) {
      messagesSentInMonth =
        data?.reduce((sum, row) => sum + Number(row.messages_sent ?? 0), 0) ?? 0
    }
  } catch {
    messagesSentInMonth = 0
  }

  let activeLeads = 0
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('id', { count: 'exact' })
      .in('status', ['bot', 'open'])
    if (!error) activeLeads = data?.length ?? 0
  } catch {
    activeLeads = 0
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Visão Geral</h1>
        <p className="text-muted-foreground">Acompanhe as métricas reais da sua operação.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total de contatos"
          value={totalContacts}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Conversas abertas"
          value={openConversations}
          icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Agentes ativos"
          value={activeAgents}
          icon={<Bot className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Contas WhatsApp"
          value={connectedWhatsappAccounts}
          icon={<Smartphone className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Mensagens enviadas (mês)"
          value={messagesSentInMonth}
          icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Leads ativos"
          value={activeLeads}
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ações rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button render={<Link href="/agents/new" />}>
            <Plus className="mr-2 h-4 w-4" />
            Novo agente
          </Button>
          <Button variant="outline" render={<Link href="/agents" />}>
            Ver agentes
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}
