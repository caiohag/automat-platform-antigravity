"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bot, Smartphone, HelpCircle, MessageSquare, Megaphone, Rocket, Mail } from "lucide-react"

const CATEGORIES = [
  { icon: Rocket, title: "Primeiros Passos", description: "Aprenda a criar sua conta, configurar seu primeiro agente e conectar o WhatsApp.", badge: "Início" },
  { icon: Bot, title: "Agentes IA", description: "Como criar e configurar agentes de IA, personalidade, base de conhecimento e limites.", badge: "IA" },
  { icon: Smartphone, title: "WhatsApp", description: "Como conectar números de WhatsApp via QR Code ou API oficial, e configurar roteamento.", badge: "WhatsApp" },
  { icon: MessageSquare, title: "CRM e Atendimento", description: "Gerencie contatos, pipeline de vendas, kanban, chat ao vivo e tarefas da equipe.", badge: "CRM" },
  { icon: Megaphone, title: "Campanhas e Remarketing", description: "Envie disparos em massa e configure automações de recuperação de carrinho e reengajamento.", badge: "Marketing" },
]

const FAQS = [
  {
    question: "Como conectar meu WhatsApp à plataforma?",
    answer: "Acesse o menu 'Contas WhatsApp', clique em 'Conectar Conta' e escaneie o QR Code com seu celular. O processo leva menos de 1 minuto.",
  },
  {
    question: "Posso ter mais de um número de WhatsApp?",
    answer: "Sim! Dependendo do seu plano, você pode conectar até 10 números diferentes. Você pode configurar roteamento inteligente para direcionar cada contato ao número mais adequado.",
  },
  {
    question: "Como o agente de IA é treinado?",
    answer: "O agente não precisa ser 'treinado' da forma tradicional. Você preenche as informações do seu negócio (produtos, serviços, horários) no wizard de criação e a IA gera automaticamente o comportamento correto.",
  },
  {
    question: "O que é Remarketing e como funciona?",
    answer: "Remarketing são mensagens automáticas enviadas a contatos com base em gatilhos, como carrinho abandonado, cliente inativo ou mensagem sem resposta. Você configura o gatilho e a mensagem, e o sistema dispara automaticamente.",
  },
  {
    question: "Como importar meus contatos da planilha?",
    answer: "Acesse 'Contatos' > 'Importar'. Você pode importar via planilha CSV com as colunas: nome, telefone, email, tags. A importação é processada em tempo real.",
  },
  {
    question: "Como funciona o White-Label?",
    answer: "Com o White-Label você pode usar um domínio próprio, personalizar cores, logotipo e nome da plataforma. Seus clientes acessarão o sistema como se fosse uma solução desenvolvida por você.",
  },
]

export function HelpClient() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Central de Ajuda</h1>
        <p className="text-muted-foreground">Encontre respostas rápidas e aprenda a usar a plataforma.</p>
      </div>

      {/* Categories */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map(cat => (
          <Card key={cat.title} className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-secondary rounded-md">
                  <cat.icon className="w-5 h-5 text-secondary-foreground" />
                </div>
                <Badge variant="outline">{cat.badge}</Badge>
              </div>
              <CardTitle className="text-lg">{cat.title}</CardTitle>
              <CardDescription>{cat.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Perguntas Frequentes</h2>
        <Accordion className="w-full">
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Support CTA */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="pt-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-full">
              <HelpCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Precisa de mais ajuda?</h3>
              <p className="text-sm text-muted-foreground">Nossa equipe está disponível de segunda a sexta, das 9h às 18h.</p>
            </div>
          </div>
          <Button className="shrink-0">
            <Mail className="w-4 h-4 mr-2" /> Entrar em Contato
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
