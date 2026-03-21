'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChevronLeft,
  ChevronRight,
  Bot,
  Building2,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Plus,
  Trash2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type BusinessType = 'ecommerce' | 'clinic' | 'restaurant' | 'realstate' | 'other'
type Personality = 'professional' | 'friendly' | 'casual'
type UnknownResponse = 'verify' | 'other_channel' | 'transfer'

interface BusinessHours {
  weekdays: string
  saturday: string
  sunday: string
  allday: boolean
}

interface FaqItem {
  question: string
  answer: string
}

interface WizardData {
  // Step 1
  businessName: string
  businessType: BusinessType | ''
  businessDescription: string
  businessHours: BusinessHours
  location: string
  // Step 2
  services: Record<string, string>
  // Step 3
  agentName: string
  personality: Personality
  useEmojis: boolean
  unknownResponse: UnknownResponse
  limitTopics: boolean
  // Step 4
  faqItems: FaqItem[]
  websiteUrl: string
}

const INITIAL_DATA: WizardData = {
  businessName: '',
  businessType: '',
  businessDescription: '',
  businessHours: { weekdays: '08:00–18:00', saturday: '09:00–13:00', sunday: '', allday: false },
  location: '',
  services: {},
  agentName: '',
  personality: 'friendly',
  useEmojis: true,
  unknownResponse: 'verify',
  limitTopics: false,
  faqItems: [],
  websiteUrl: '',
}

// ─── Prompt generator ────────────────────────────────────────────────────────

function formatHours(hours: BusinessHours): string {
  if (hours.allday) return '24 horas, todos os dias'
  const parts: string[] = []
  if (hours.weekdays) parts.push(`Segunda a Sexta: ${hours.weekdays}`)
  if (hours.saturday) parts.push(`Sábado: ${hours.saturday}`)
  if (hours.sunday) parts.push(`Domingo: ${hours.sunday}`)
  return parts.join(', ') || 'Não informado'
}

function formatServices(services: Record<string, string>, type: string): string {
  return Object.entries(services)
    .filter(([, v]) => v)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n') || 'Sem informações específicas sobre serviços.'
}

function generateSystemPrompt(data: WizardData): string {
  const personalityMap = {
    professional: 'Profissional e formal',
    friendly: 'Amigável e descontraído',
    casual: 'Casual e jovem',
  }
  const unknownMap = {
    verify: 'Diga que vai verificar e retorne em breve',
    other_channel: 'Peça para o cliente entrar em contato por outro canal',
    transfer: 'Transfira para um atendente humano',
  }
  const faqSection = data.faqItems.length > 0
    ? '\n## Perguntas frequentes\n' + data.faqItems.map(f => `P: ${f.question}\nR: ${f.answer}`).join('\n\n')
    : ''
  const urlSection = data.websiteUrl ? `\nSite da empresa: ${data.websiteUrl}` : ''

  return `Você é ${data.agentName}, assistente virtual da empresa ${data.businessName}.

## Sobre a empresa
${data.businessDescription}
Tipo: ${data.businessType}
Localização: ${data.location}
Horário de funcionamento: ${formatHours(data.businessHours)}${urlSection}

## Serviços e produtos
${formatServices(data.services, data.businessType)}
${faqSection}

## Como se comportar
- Tom de voz: ${personalityMap[data.personality]}
- ${data.useEmojis ? 'Use emojis moderadamente para ser mais amigável.' : 'Não use emojis.'}
- Quando não souber responder: ${unknownMap[data.unknownResponse]}
${data.limitTopics ? '- Fale APENAS sobre assuntos relacionados ao negócio. Se perguntarem sobre outros temas, redirecione educadamente.' : ''}
- Responda sempre em português brasileiro.
- Seja conciso: respostas curtas e objetivas, salvo quando o cliente precisar de detalhes.`
}

// ─── Step components ──────────────────────────────────────────────────────────

function Step1({ data, onChange }: { data: WizardData; onChange: (d: Partial<WizardData>) => void }) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Nome do negócio</label>
        <Input
          placeholder="Ex: Clínica Saúde & Bem-estar"
          value={data.businessName}
          onChange={e => onChange({ businessName: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Tipo de negócio</label>
        <Select value={data.businessType} onValueChange={v => onChange({ businessType: v as BusinessType })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ecommerce">E-commerce</SelectItem>
            <SelectItem value="clinic">Clínica / Consultório</SelectItem>
            <SelectItem value="restaurant">Restaurante</SelectItem>
            <SelectItem value="realstate">Imobiliária</SelectItem>
            <SelectItem value="other">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Descrição curta</label>
        <Textarea
          placeholder="Descreva seu negócio em até 200 caracteres"
          maxLength={200}
          value={data.businessDescription}
          onChange={e => onChange({ businessDescription: e.target.value })}
        />
        <p className="text-xs text-muted-foreground text-right">{data.businessDescription.length}/200</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Horário de funcionamento</label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Switch
              checked={data.businessHours.allday}
              onCheckedChange={v => onChange({ businessHours: { ...data.businessHours, allday: v } })}
            />
            24 horas
          </label>
        </div>
        {!data.businessHours.allday && (
          <div className="grid gap-2">
            {(['weekdays', 'saturday', 'sunday'] as const).map(day => (
              <div key={day} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-28">
                  {day === 'weekdays' ? 'Seg–Sex' : day === 'saturday' ? 'Sábado' : 'Domingo'}
                </span>
                <Input
                  className="flex-1"
                  placeholder={day === 'sunday' ? 'Fechado' : '08:00–18:00'}
                  value={data.businessHours[day]}
                  onChange={e => onChange({ businessHours: { ...data.businessHours, [day]: e.target.value } })}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Cidade / Estado</label>
        <Input
          placeholder="Ex: São Paulo, SP"
          value={data.location}
          onChange={e => onChange({ location: e.target.value })}
        />
      </div>
    </div>
  )
}

function Step2({ data, onChange }: { data: WizardData; onChange: (d: Partial<WizardData>) => void }) {
  const setService = (key: string, value: string) =>
    onChange({ services: { ...data.services, [key]: value } })

  if (data.businessType === 'ecommerce') {
    return (
      <div className="space-y-5">
        <ServiceField label="Principais produtos / categorias" field="products" data={data} setService={setService} placeholder="Ex: Roupas femininas, acessórios, calçados" />
        <ServiceField label="Ticket médio" field="avgTicket" data={data} setService={setService} placeholder="Ex: R$ 150" />
        <ServiceField label="Política de troca e devolução" field="returnPolicy" data={data} setService={setService} placeholder="Ex: 30 dias após recebimento" />
        <ServiceField label="Prazo de entrega" field="deliveryTime" data={data} setService={setService} placeholder="Ex: 5 a 10 dias úteis" />
      </div>
    )
  }
  if (data.businessType === 'clinic') {
    return (
      <div className="space-y-5">
        <ServiceField label="Especialidades" field="specialties" data={data} setService={setService} placeholder="Ex: Cardiologia, Dermatologia, Clínica Geral" />
        <ServiceField label="Convênios aceitos" field="insurance" data={data} setService={setService} placeholder="Ex: Unimed, Bradesco Saúde, Particular" />
        <ServiceField label="Tempo médio de consulta" field="consultTime" data={data} setService={setService} placeholder="Ex: 30 minutos" />
        <ServiceField label="Como funciona o agendamento" field="scheduling" data={data} setService={setService} placeholder="Ex: Via WhatsApp ou pelo site" />
      </div>
    )
  }
  if (data.businessType === 'restaurant') {
    return (
      <div className="space-y-5">
        <ServiceField label="Tipo de culinária" field="cuisine" data={data} setService={setService} placeholder="Ex: Italiana, Pizza, Fast food" />
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Faz delivery?</label>
          <Switch
            checked={data.services.delivery === 'sim'}
            onCheckedChange={v => setService('delivery', v ? 'sim' : 'não')}
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Aceita reservas?</label>
          <Switch
            checked={data.services.reservations === 'sim'}
            onCheckedChange={v => setService('reservations', v ? 'sim' : 'não')}
          />
        </div>
        <ServiceField label="Horário de pico" field="peakHours" data={data} setService={setService} placeholder="Ex: 12h–14h e 19h–21h" />
      </div>
    )
  }
  if (data.businessType === 'realstate') {
    return (
      <div className="space-y-5">
        <ServiceField label="Tipos de imóveis" field="propertyTypes" data={data} setService={setService} placeholder="Ex: Casas, Apartamentos, Salas comerciais" />
        <ServiceField label="Modalidade" field="modality" data={data} setService={setService} placeholder="Ex: Venda, Aluguel, Ambos" />
        <ServiceField label="Bairros / regiões atendidas" field="neighborhoods" data={data} setService={setService} placeholder="Ex: Centro, Zona Sul, Alphaville" />
        <ServiceField label="Faixa de preço" field="priceRange" data={data} setService={setService} placeholder="Ex: R$ 200k – R$ 2M" />
      </div>
    )
  }
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Descreva seus principais serviços</label>
        <Textarea
          placeholder="Descreva o que sua empresa oferece, para quem e como funciona"
          className="min-h-32"
          value={data.services.description || ''}
          onChange={e => setService('description', e.target.value)}
        />
      </div>
    </div>
  )
}

function ServiceField({
  label, field, data, setService, placeholder,
}: {
  label: string; field: string; data: WizardData; setService: (k: string, v: string) => void; placeholder: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <Input
        placeholder={placeholder}
        value={data.services[field] || ''}
        onChange={e => setService(field, e.target.value)}
      />
    </div>
  )
}

function Step3({ data, onChange }: { data: WizardData; onChange: (d: Partial<WizardData>) => void }) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Nome do agente</label>
        <Input
          placeholder="Ex: Sofia, Carlos, Max"
          value={data.agentName}
          onChange={e => onChange({ agentName: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Tom de voz</label>
        <div className="grid gap-2">
          {([
            { value: 'professional', label: 'Profissional e formal', desc: 'Linguagem técnica, respeitosa e objetiva' },
            { value: 'friendly', label: 'Amigável e descontraído', desc: 'Acolhedor, simpático e acessível' },
            { value: 'casual', label: 'Casual e jovem', desc: 'Informal, próximo e moderno' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ personality: opt.value })}
              className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                data.personality === opt.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-muted-foreground/50'
              }`}
            >
              <div className={`mt-0.5 size-4 rounded-full border-2 flex-shrink-0 ${
                data.personality === opt.value ? 'border-primary bg-primary' : 'border-muted-foreground'
              }`} />
              <div>
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Usar emojis</p>
          <p className="text-xs text-muted-foreground">Adiciona emojis para uma comunicação mais amigável</p>
        </div>
        <Switch
          checked={data.useEmojis}
          onCheckedChange={v => onChange({ useEmojis: v })}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Quando não souber responder</label>
        <Select value={data.unknownResponse} onValueChange={v => onChange({ unknownResponse: v as UnknownResponse })}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="verify">Diz que vai verificar e retorna</SelectItem>
            <SelectItem value="other_channel">Pede para entrar em contato por outro canal</SelectItem>
            <SelectItem value="transfer">Transfere para atendente humano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Falar apenas sobre o negócio</p>
          <p className="text-xs text-muted-foreground">Recusa assuntos fora do escopo da empresa</p>
        </div>
        <Switch
          checked={data.limitTopics}
          onCheckedChange={v => onChange({ limitTopics: v })}
        />
      </div>
    </div>
  )
}

function Step4({ data, onChange }: { data: WizardData; onChange: (d: Partial<WizardData>) => void }) {
  const addFaq = () =>
    onChange({ faqItems: [...data.faqItems, { question: '', answer: '' }] })

  const updateFaq = (i: number, field: 'question' | 'answer', value: string) => {
    const items = [...data.faqItems]
    items[i] = { ...items[i], [field]: value }
    onChange({ faqItems: items })
  }

  const removeFaq = (i: number) =>
    onChange({ faqItems: data.faqItems.filter((_, idx) => idx !== i) })

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">URL do site</label>
        <Input
          type="url"
          placeholder="https://www.seusite.com.br"
          value={data.websiteUrl}
          onChange={e => onChange({ websiteUrl: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">Será integrado futuramente para aprendizado automático</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Perguntas frequentes (FAQ)</label>
          <Button variant="outline" size="sm" onClick={addFaq}>
            <Plus className="size-3.5" />
            Adicionar
          </Button>
        </div>

        {data.faqItems.length === 0 && (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma pergunta adicionada ainda.</p>
            <p className="text-xs text-muted-foreground mt-1">Adicione perguntas e respostas para treinar o agente.</p>
          </div>
        )}

        {data.faqItems.map((item, i) => (
          <div key={i} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Pergunta {i + 1}</span>
              <button
                type="button"
                onClick={() => removeFaq(i)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
            <Input
              placeholder="Qual é o horário de funcionamento?"
              value={item.question}
              onChange={e => updateFaq(i, 'question', e.target.value)}
            />
            <Textarea
              placeholder="Segunda a sexta das 8h às 18h, sábados das 9h às 13h."
              value={item.answer}
              onChange={e => updateFaq(i, 'answer', e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function Step5({ data }: { data: WizardData }) {
  const [showPrompt, setShowPrompt] = useState(false)
  const prompt = generateSystemPrompt(data)

  return (
    <div className="space-y-5">
      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="text-sm font-semibold">Resumo do agente</h3>
        <div className="grid gap-2 text-sm">
          <Row label="Empresa" value={data.businessName || '—'} />
          <Row label="Agente" value={data.agentName || '—'} />
          <Row label="Tipo" value={data.businessType || '—'} />
          <Row label="Localização" value={data.location || '—'} />
          <Row label="Tom de voz" value={{ professional: 'Profissional', friendly: 'Amigável', casual: 'Casual' }[data.personality]} />
          <Row label="Emojis" value={data.useEmojis ? 'Sim' : 'Não'} />
          <Row label="FAQs" value={`${data.faqItems.length} pergunta(s)`} />
        </div>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowPrompt(!showPrompt)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Sparkles className="size-4" />
          {showPrompt ? 'Ocultar prompt gerado' : 'Ver prompt gerado automaticamente'}
        </button>
        {showPrompt && (
          <pre className="rounded-lg bg-muted p-3 text-xs font-mono overflow-auto max-h-48 whitespace-pre-wrap">
            {prompt}
          </pre>
        )}
      </div>

      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 className="size-4 text-primary" />
          <span className="text-sm font-medium">Pronto para criar!</span>
        </div>
        <p className="text-xs text-muted-foreground">
          O agente será criado em modo inativo. Ative-o após conectar uma conta WhatsApp.
        </p>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )
}

// ─── Wizard shell ─────────────────────────────────────────────────────────────

const STEPS = [
  { title: 'Informações do negócio', icon: Building2 },
  { title: 'Serviços e produtos', icon: Bot },
  { title: 'Personalidade', icon: Sparkles },
  { title: 'Base de conhecimento', icon: BookOpen },
  { title: 'Revisão e criação', icon: CheckCircle2 },
]

export default function NewAgentPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardData>(INITIAL_DATA)
  const [loading, setLoading] = useState(false)

  const update = (partial: Partial<WizardData>) =>
    setData(prev => ({ ...prev, ...partial }))

  const canProceed = () => {
    if (step === 0) return !!data.businessName && !!data.businessType
    if (step === 2) return !!data.agentName
    return true
  }

  const handleCreate = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Sessão expirada. Faça login novamente.'); return }

      // Get or create tenant
      let { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!tenant) {
        const slug = user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '-') ?? `user-${Date.now()}`
        const { data: newTenant, error: tenantError } = await supabase
          .from('tenants')
          .insert({ name: data.businessName || 'Minha Empresa', slug, owner_id: user.id })
          .select('id')
          .single()
        if (tenantError || !newTenant) {
          console.error('Erro ao criar tenant:', tenantError)
          toast.error('Erro ao inicializar conta. Tente novamente.')
          return
        }
        tenant = newTenant
      }

      const { data: agent, error } = await supabase.from('agents').insert({
        tenant_id: tenant.id,
        name: data.agentName,
        description: data.businessDescription,
        system_prompt: generateSystemPrompt(data),
        model: 'gpt-4o',
        temperature: 0.7,
        is_active: false,
        test_mode: true,
        knowledge_base: {
          faqItems: data.faqItems,
          websiteUrl: data.websiteUrl,
          businessType: data.businessType,
          businessName: data.businessName,
          services: data.services,
        },
      }).select('id').single()

      if (error) {
        console.error('Erro ao criar agente:', error)
        toast.error('Erro ao criar agente. Tente novamente.')
        return
      }

      toast.success('Agente criado com sucesso!')
      router.push(`/agents/${agent.id}`)
    } catch (err) {
      console.error(err)
      toast.error('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const StepIcon = STEPS[step].icon

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Novo Agente</h1>
        <p className="text-muted-foreground">Configure seu assistente virtual em 5 passos simples.</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className={`flex items-center justify-center size-8 rounded-full text-xs font-bold flex-shrink-0 transition-colors ${
                i < step ? 'bg-primary text-primary-foreground' :
                i === step ? 'bg-primary/20 text-primary border border-primary' :
                'bg-muted text-muted-foreground'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 transition-colors ${i < step ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <StepIcon className="size-5 text-primary" />
            <div>
              <CardTitle>{STEPS[step].title}</CardTitle>
              <CardDescription>Passo {step + 1} de {STEPS.length}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {step === 0 && <Step1 data={data} onChange={update} />}
          {step === 1 && <Step2 data={data} onChange={update} />}
          {step === 2 && <Step3 data={data} onChange={update} />}
          {step === 3 && <Step4 data={data} onChange={update} />}
          {step === 4 && <Step5 data={data} />}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => step === 0 ? router.push('/agents') : setStep(s => s - 1)}
        >
          <ChevronLeft className="size-4" />
          {step === 0 ? 'Cancelar' : 'Voltar'}
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
            Próximo
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? 'Criando...' : 'Criar Agente'}
            <Bot className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
