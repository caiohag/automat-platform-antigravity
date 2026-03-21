import Link from 'next/link'
import { Bot, PencilLine, Plus } from 'lucide-react'

import { AgentStatusToggle } from '@/components/agent-status-toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'

type AgentListItem = {
  id: string
  name: string | null
  business_type: string | null
  model: string | null
  is_active: boolean | null
  created_at: string | null
}

export default async function AgentsPage() {
  const supabase = await createClient()

  let agents: AgentListItem[] = []

  try {
    const { data, error } = await supabase
      .from('agents')
      .select('id, name, business_type, model, is_active, created_at')
      .order('created_at', { ascending: false })

    if (!error) {
      agents = (data ?? []) as AgentListItem[]
    }
  } catch {
    agents = []
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agentes IA</h1>
          <p className="text-muted-foreground">Gerencie seus agentes e status de operação.</p>
        </div>

        <Button render={<Link href="/agents/new" />}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Agente
        </Button>
      </div>

      {agents.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="items-center text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Nenhum agente criado ainda</CardTitle>
            <CardDescription>
              Crie seu primeiro agente para começar os testes e ativações.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button render={<Link href="/agents/new" />}>Criar agente</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => {
            const createdAt = agent.created_at
              ? new Date(agent.created_at).toLocaleDateString('pt-BR')
              : '—'

            return (
              <Card key={agent.id}>
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{agent.name || 'Agente sem nome'}</CardTitle>
                      <CardDescription>{agent.business_type || 'Tipo não informado'}</CardDescription>
                    </div>
                    <Badge variant={agent.is_active ? 'default' : 'secondary'}>
                      {agent.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  <div className="rounded-md border p-2">
                    <AgentStatusToggle
                      agentId={agent.id}
                      initialActive={Boolean(agent.is_active)}
                    />
                  </div>
                </CardHeader>

                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    Modelo: <span className="font-medium text-foreground">{agent.model || 'gpt-4o'}</span>
                  </p>
                  <p>
                    Criado em: <span className="font-medium text-foreground">{createdAt}</span>
                  </p>
                </CardContent>

                <CardFooter>
                  <Button variant="outline" className="w-full" render={<Link href={`/agents/${agent.id}`} />}>
                    <PencilLine className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
