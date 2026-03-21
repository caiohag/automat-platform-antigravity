"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CreditCard, Zap, Bot, Smartphone, Users, MessageSquare, Check } from "lucide-react"

const PLANS = [
  {
    name: "Free",
    price: "R$ 0",
    period: "/mês",
    limits: { messages: 1000, agents: 1, whatsapp: 1, members: 1 },
    features: ["1.000 mensagens/mês", "1 Agente IA", "1 WhatsApp", "1 Membro"],
    highlight: false,
  },
  {
    name: "Starter",
    price: "R$ 149",
    period: "/mês",
    limits: { messages: 10000, agents: 3, whatsapp: 3, members: 5 },
    features: ["10.000 mensagens/mês", "3 Agentes IA", "3 WhatsApp", "5 Membros", "Pipeline CRM", "Campanhas"],
    highlight: false,
  },
  {
    name: "Pro",
    price: "R$ 279",
    period: "/mês",
    limits: { messages: 50000, agents: 10, whatsapp: 10, members: 20 },
    features: ["50.000 mensagens/mês", "10 Agentes IA", "10 WhatsApp", "20 Membros", "Tudo do Starter", "White-Label", "Remarketing", "Relatórios avançados"],
    highlight: true,
  },
]

export function SubscriptionClient({ subscription, usage }: { subscription: any, usage: any }) {
  const currentPlan = subscription?.plan_name || "Free"
  const limits = PLANS.find(p => p.name === currentPlan)?.limits || PLANS[0].limits

  const { agentsCount = 0, whatsappCount = 0, membersCount = 0, messagesUsed = 0 } = usage || {}

  const calcPercent = (used: number, max: number) => Math.min((used / max) * 100, 100)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assinatura</h1>
        <p className="text-muted-foreground">Gerencie seu plano e acompanhe o uso da plataforma.</p>
      </div>

      {/* Plano Atual */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> Plano Atual
              </CardTitle>
              <CardDescription className="mt-1">Você está no plano {currentPlan}.</CardDescription>
            </div>
            <Badge className="text-base px-4 py-1.5">{currentPlan}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-1 text-muted-foreground"><MessageSquare className="w-3 h-3" /> Mensagens</span>
                <span className="font-medium">{messagesUsed.toLocaleString()} / {limits.messages.toLocaleString()}</span>
              </div>
              <Progress value={calcPercent(messagesUsed, limits.messages)} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-1 text-muted-foreground"><Bot className="w-3 h-3" /> Agentes IA</span>
                <span className="font-medium">{agentsCount} / {limits.agents}</span>
              </div>
              <Progress value={calcPercent(agentsCount, limits.agents)} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-1 text-muted-foreground"><Smartphone className="w-3 h-3" /> Contas WhatsApp</span>
                <span className="font-medium">{whatsappCount} / {limits.whatsapp}</span>
              </div>
              <Progress value={calcPercent(whatsappCount, limits.whatsapp)} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-1 text-muted-foreground"><Users className="w-3 h-3" /> Membros da Equipe</span>
                <span className="font-medium">{membersCount} / {limits.members}</span>
              </div>
              <Progress value={calcPercent(membersCount, limits.members)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planos */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Comparativo de Planos</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map(plan => {
            const isCurrent = plan.name === currentPlan
            return (
              <Card key={plan.name} className={plan.highlight ? "border-primary" : ""}>
                {plan.highlight && <div className="bg-primary text-primary-foreground text-center text-xs py-1 font-medium rounded-t-lg -mt-px -mx-px">Mais popular</div>}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="text-3xl font-bold mt-2">{plan.price}<span className="text-sm font-normal text-muted-foreground">{plan.period}</span></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button className="w-full" variant="outline" disabled>Plano Atual</Button>
                  ) : (
                    <Button className="w-full" variant={plan.highlight ? "default" : "outline"}>
                      <Zap className="w-4 h-4 mr-2" /> Fazer Upgrade
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Histórico Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <CardDescription>Seu histórico de cobranças aparecerá aqui após o primeiro pagamento.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-4 text-center">Nenhum pagamento registrado ainda.</p>
        </CardContent>
      </Card>
    </div>
  )
}
