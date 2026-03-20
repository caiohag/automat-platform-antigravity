import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Bot, Plus, ArrowRight } from "lucide-react"

export default async function AgentsPage() {
  const supabase = await createClient()
  const { data: agents } = await supabase.from('agents').select('*').order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agentes IA</h1>
          <p className="text-muted-foreground">Gerencie os assistentes virtuais da sua plataforma.</p>
        </div>
        <Link href="/agents/new" className={buttonVariants()}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Agente
        </Link>
      </div>

      {!agents || agents.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Nenhum agente encontrado</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Você ainda não criou nenhum agente IA para atendimento. Comece criando um agora mesmo.
          </p>
          <Link href="/agents/new" className={buttonVariants()}>
            Criar meu primeiro agente
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-secondary rounded-md">
                    <Bot className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <Badge variant={agent.is_active ? 'default' : 'secondary'}>
                    {agent.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{agent.name}</CardTitle>
                <CardDescription className="line-clamp-2">{agent.description || "Sem descrição"}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-sm text-muted-foreground">
                  Provedor: <span className="font-medium text-foreground">{agent.provider || "OpenAI"}</span>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t">
                <Link href={`/agents/${agent.id}`} className={buttonVariants({ variant: "ghost", className: "w-full justify-between" })}>
                  Configurar
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
