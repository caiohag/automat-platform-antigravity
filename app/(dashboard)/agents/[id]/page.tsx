import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AgentChat } from './agent-chat'
import { Bot, ChevronLeft, Cpu, Calendar, Zap } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AgentDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: agent, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !agent) notFound()

  const createdAt = agent.created_at
    ? format(new Date(agent.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '—'

  const modelLabel = (agent.model as string) || 'gpt-4o'
  const providerLabel: Record<string, string> = {
    openai: 'OpenAI',
    gemini: 'Google Gemini',
    anthropic: 'Anthropic',
    minimax: 'Minimax',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" render={<Link href="/agents" />}>
            <ChevronLeft className="size-4" />
          </Button>
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{agent.name}</h1>
            <p className="text-sm text-muted-foreground">{agent.description || 'Sem descrição'}</p>
          </div>
        </div>
        <Badge variant={agent.is_active ? 'default' : 'secondary'} className="text-sm px-3 py-1">
          {agent.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Info column */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow icon={<Cpu className="size-4 text-muted-foreground" />} label="Modelo" value={modelLabel} />
              <InfoRow icon={<Zap className="size-4 text-muted-foreground" />} label="Provedor" value={providerLabel[agent.provider] || agent.provider || 'OpenAI'} />
              <InfoRow icon={<Calendar className="size-4 text-muted-foreground" />} label="Criado em" value={createdAt} />
              <div className="flex items-center justify-between text-sm pt-1 border-t">
                <span className="text-muted-foreground">Temperatura</span>
                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{agent.temperature ?? 0.7}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Modo teste</span>
                <Badge variant={agent.test_mode ? 'secondary' : 'outline'} className="text-xs">
                  {agent.test_mode ? 'Ativado' : 'Desativado'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {agent.system_prompt && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">System Prompt</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {agent.system_prompt}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Chat column */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chat de Teste</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <AgentChat agentId={agent.id} agentName={agent.name} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {icon}
      <span className="text-muted-foreground flex-1">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
