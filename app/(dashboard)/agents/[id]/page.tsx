import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Bot, Cpu, MessageSquareText, Sparkles } from 'lucide-react'

import { AgentChatTest } from '@/components/agent-chat-test'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'

interface AgentPageProps {
  params: Promise<{ id: string }>
}

export default async function AgentPage({ params }: AgentPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: agent, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !agent) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon-sm" render={<Link href="/agents" />}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{agent.name}</h1>
            <p className="text-sm text-muted-foreground">Painel de configuração e teste</p>
          </div>
        </div>

        <Badge variant={agent.is_active ? 'default' : 'secondary'}>
          {agent.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados do agente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow icon={<Bot className="h-4 w-4 text-muted-foreground" />} label="Nome" value={agent.name || '—'} />
              <InfoRow icon={<BadgeDot active={Boolean(agent.is_active)} />} label="Status" value={agent.is_active ? 'Ativo' : 'Inativo'} />
              <InfoRow icon={<Cpu className="h-4 w-4 text-muted-foreground" />} label="Modelo" value={agent.model || 'gpt-4o'} />
              <InfoRow
                icon={<Sparkles className="h-4 w-4 text-muted-foreground" />}
                label="Personalidade"
                value={agent.personality || 'Não definida'}
              />
              <InfoRow
                icon={<MessageSquareText className="h-4 w-4 text-muted-foreground" />}
                label="Tipo de negócio"
                value={agent.business_type || 'Não informado'}
              />
            </CardContent>
          </Card>

          {agent.system_prompt && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Prompt do sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
                  {agent.system_prompt}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chat de teste</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <AgentChatTest agentId={agent.id} agentName={agent.name || 'Agente'} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border p-2.5">
      <span>{icon}</span>
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto text-right font-medium">{value}</span>
    </div>
  )
}

function BadgeDot({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${
        active ? 'bg-green-500' : 'bg-muted-foreground'
      }`}
    />
  )
}
