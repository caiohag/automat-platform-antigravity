'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bot,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  FileText,
  Globe,
  Plus,
  Sparkles,
  Store,
  Upload,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { generateSystemPrompt, type WizardData } from '@/lib/prompt-generator'
import { createClient } from '@/lib/supabase/client'

type BusinessType = 'E-commerce' | 'Clínica/Consultório' | 'Restaurante' | 'Imobiliária' | 'Outro'

type WizardStep = 1 | 2 | 3 | 4 | 5

interface FaqItem {
  id: string
  question: string
  answer: string
}

interface KnowledgeFile {
  id: string
  file: File
}

interface FormData {
  businessName: string
  businessType: BusinessType | ''
  businessDescription: string
  businessHours: WizardData['businessHours']
  location: string
  services: Record<string, unknown>
  agentName: string
  personality: WizardData['personality']
  useEmojis: boolean
  unknownResponse: string
  limitTopics: boolean
  language: string
  websiteUrl: string
  knowledgeFaqs: FaqItem[]
  knowledgeFiles: KnowledgeFile[]
}

const INITIAL_DATA: FormData = {
  businessName: '',
  businessType: '',
  businessDescription: '',
  businessHours: {
    weekdays: '08:00-18:00',
    saturday: '09:00-13:00',
    sunday: 'Fechado',
  },
  location: '',
  services: {},
  agentName: '',
  personality: 'friendly',
  useEmojis: true,
  unknownResponse: 'Informa que vai verificar e retorna em breve',
  limitTopics: true,
  language: 'Português Brasileiro',
  websiteUrl: '',
  knowledgeFaqs: [],
  knowledgeFiles: [],
}

const STEPS: Array<{ step: WizardStep; title: string; icon: React.ComponentType<{ className?: string }> }> = [
  { step: 1, title: 'Informações do negócio', icon: Building2 },
  { step: 2, title: 'Serviços/Produtos', icon: Store },
  { step: 3, title: 'Personalidade do agente', icon: Sparkles },
  { step: 4, title: 'Base de conhecimento', icon: FileText },
  { step: 5, title: 'Revisão e criação', icon: CheckCircle2 },
]

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function formatLabel(value: unknown): string {
  if (Array.isArray(value)) {
    return value.length ? value.join(', ') : '—'
  }

  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Não'
  }

  if (typeof value === 'number') {
    return value.toString()
  }

  if (typeof value === 'string') {
    return value.trim() ? value : '—'
  }

  return '—'
}

function toPromptData(data: FormData): WizardData {
  return {
    agentName: data.agentName,
    businessName: data.businessName,
    businessType: data.businessType || 'Outro',
    businessDescription: data.businessDescription,
    businessHours: data.businessHours,
    location: data.location,
    services: data.services,
    personality: data.personality,
    useEmojis: data.useEmojis,
    unknownResponse: data.unknownResponse,
    limitTopics: data.limitTopics,
    knowledgeFaqs: data.knowledgeFaqs
      .filter((faq) => faq.question.trim() && faq.answer.trim())
      .map((faq) => ({ question: faq.question.trim(), answer: faq.answer.trim() })),
    websiteUrl: data.websiteUrl.trim() || undefined,
  }
}

export default function NewAgentPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<WizardStep>(1)
  const [data, setData] = useState<FormData>(INITIAL_DATA)
  const [isCreating, setIsCreating] = useState(false)

  const promptPreview = useMemo(() => generateSystemPrompt(toPromptData(data)), [data])

  const setService = (key: string, value: unknown) => {
    setData((prev) => ({
      ...prev,
      services: {
        ...prev.services,
        [key]: value,
      },
    }))
  }

  const updateHours = (key: keyof WizardData['businessHours'], value: string) => {
    setData((prev) => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [key]: value,
      },
    }))
  }

  const toggleClosedDay = (key: keyof WizardData['businessHours'], closed: boolean) => {
    updateHours(key, closed ? 'Fechado' : '')
  }

  const canGoNext = () => {
    if (step === 1) {
      return Boolean(data.businessName.trim() && data.businessType && data.location.trim())
    }

    if (step === 2 && data.businessType === 'Outro') {
      return Boolean(data.services.mainServices && data.services.customerProblem)
    }

    if (step === 3) {
      return Boolean(data.agentName.trim())
    }

    return true
  }

  const addFaq = () => {
    setData((prev) => ({
      ...prev,
      knowledgeFaqs: [...prev.knowledgeFaqs, { id: createId(), question: '', answer: '' }],
    }))
  }

  const updateFaq = (id: string, field: 'question' | 'answer', value: string) => {
    setData((prev) => ({
      ...prev,
      knowledgeFaqs: prev.knowledgeFaqs.map((faq) =>
        faq.id === id ? { ...faq, [field]: value } : faq,
      ),
    }))
  }

  const removeFaq = (id: string) => {
    setData((prev) => ({
      ...prev,
      knowledgeFaqs: prev.knowledgeFaqs.filter((faq) => faq.id !== id),
    }))
  }

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return

    const incoming = Array.from(files)
      .filter((file) => {
        const lowerName = file.name.toLowerCase()
        return lowerName.endsWith('.pdf') || lowerName.endsWith('.txt') || lowerName.endsWith('.docx')
      })
      .map((file) => ({ id: createId(), file }))

    if (incoming.length !== files.length) {
      toast.warning('Apenas arquivos PDF, TXT e DOCX foram adicionados.')
    }

    setData((prev) => {
      const existingKeys = new Set(
        prev.knowledgeFiles.map((item) => `${item.file.name}-${item.file.size}-${item.file.lastModified}`),
      )

      const newItems = incoming.filter(
        (item) =>
          !existingKeys.has(`${item.file.name}-${item.file.size}-${item.file.lastModified}`),
      )

      return {
        ...prev,
        knowledgeFiles: [...prev.knowledgeFiles, ...newItems],
      }
    })
  }

  const removeKnowledgeFile = (id: string) => {
    setData((prev) => ({
      ...prev,
      knowledgeFiles: prev.knowledgeFiles.filter((item) => item.id !== id),
    }))
  }

  const goBack = () => {
    if (step === 1) {
      router.push('/agents')
      return
    }

    setStep((prev) => (prev - 1) as WizardStep)
  }

  const goNext = () => {
    if (!canGoNext() || step === 5) return
    setStep((prev) => (prev + 1) as WizardStep)
  }

  const createAgent = async () => {
    if (isCreating) return

    setIsCreating(true)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        toast.error('Sessão inválida. Faça login novamente.')
        return
      }

      let ownerId: string | null = null
      let ownerColumn: 'org_id' | 'tenant_id' = 'org_id'

      const { data: organization, error: organizationError } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (!organizationError && organization?.id) {
        ownerId = organization.id
      }

      if (!ownerId) {
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle()

        if (!tenantError && tenant?.id) {
          ownerId = tenant.id
          ownerColumn = 'tenant_id'
        }
      }

      if (!ownerId) {
        toast.error('Não foi possível localizar sua organização.')
        return
      }

      const promptData = toPromptData(data)
      const systemPrompt = generateSystemPrompt(promptData)

      const agentPayload: Record<string, unknown> = {
        [ownerColumn]: ownerId,
        name: data.agentName,
        business_type: data.businessType,
        business_name: data.businessName,
        business_description: data.businessDescription,
        business_hours: data.businessHours,
        services: data.services,
        personality: data.personality,
        system_prompt: systemPrompt,
        model: 'gpt-4o',
        temperature: 0.7,
        is_active: false,
        test_mode: true,
      }

      let agentResult = await supabase.from('agents').insert(agentPayload).select().single()

      if (agentResult.error) {
        const fallbackPayload: Record<string, unknown> = {
          [ownerColumn]: ownerId,
          name: data.agentName,
          description: data.businessDescription,
          system_prompt: systemPrompt,
          model: 'gpt-4o',
          temperature: 0.7,
          is_active: false,
          test_mode: true,
          knowledge_base: {
            businessName: data.businessName,
            businessType: data.businessType,
            location: data.location,
            services: data.services,
          },
        }

        agentResult = await supabase.from('agents').insert(fallbackPayload).select().single()
      }

      if (agentResult.error || !agentResult.data) {
        toast.error(agentResult.error?.message || 'Erro ao criar agente.')
        return
      }

      const agent = agentResult.data

      const faqList = promptData.knowledgeFaqs ?? []
      for (const faq of faqList) {
        const payload: Record<string, unknown> = {
          agent_id: agent.id,
          [ownerColumn]: ownerId,
          type: 'faq',
          title: faq.question,
          content: `P: ${faq.question}\nR: ${faq.answer}`,
        }

        const faqInsert = await supabase.from('knowledge_base').insert(payload)

        if (faqInsert.error && ownerColumn === 'tenant_id') {
          await supabase.from('agent_knowledge').insert({
            agent_id: agent.id,
            tenant_id: ownerId,
            title: faq.question,
            content: `P: ${faq.question}\nR: ${faq.answer}`,
            source_type: 'faq',
          })
        }
      }

      for (const item of data.knowledgeFiles) {
        const safeName = item.file.name.replace(/\s+/g, '-').toLowerCase()
        const filePath = `${ownerId}/${agent.id}/${Date.now()}-${safeName}`

        const upload = await supabase.storage
          .from('knowledge-base')
          .upload(filePath, item.file, { upsert: false })

        if (upload.error) {
          toast.error(`Falha no upload: ${item.file.name}`)
          continue
        }

        const payload: Record<string, unknown> = {
          agent_id: agent.id,
          [ownerColumn]: ownerId,
          type: 'file',
          title: item.file.name,
          content: filePath,
          metadata: {
            bucket: 'knowledge-base',
            path: filePath,
            mime_type: item.file.type,
            size: item.file.size,
          },
        }

        const fileInsert = await supabase.from('knowledge_base').insert(payload)

        if (fileInsert.error && ownerColumn === 'tenant_id') {
          await supabase.from('agent_knowledge').insert({
            agent_id: agent.id,
            tenant_id: ownerId,
            title: item.file.name,
            content: filePath,
            source_type: 'file',
            metadata: {
              bucket: 'knowledge-base',
              path: filePath,
              mime_type: item.file.type,
              size: item.file.size,
            },
          })
        }
      }

      if (data.websiteUrl.trim()) {
        const websitePayload: Record<string, unknown> = {
          agent_id: agent.id,
          [ownerColumn]: ownerId,
          type: 'website_url',
          title: 'Site do negócio',
          content: data.websiteUrl.trim(),
        }

        const websiteInsert = await supabase.from('knowledge_base').insert(websitePayload)

        if (websiteInsert.error && ownerColumn === 'tenant_id') {
          await supabase.from('agent_knowledge').insert({
            agent_id: agent.id,
            tenant_id: ownerId,
            title: 'Site do negócio',
            content: data.websiteUrl.trim(),
            source_type: 'url',
          })
        }
      }

      toast.success('Agente criado com sucesso!')
      router.push(`/agents/${agent.id}`)
    } catch (error) {
      console.error('[agents/new] create error:', error)
      toast.error('Erro interno ao criar agente.')
    } finally {
      setIsCreating(false)
    }
  }

  const CurrentStepIcon = STEPS.find((item) => item.step === step)?.icon ?? Bot

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Novo Agente</h1>
        <p className="text-muted-foreground">
          Configure seu agente com dados reais do seu negócio em 5 passos.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {STEPS.map((item) => {
          const Icon = item.icon
          const isCurrent = step === item.step
          const isCompleted = step > item.step

          return (
            <div key={item.step} className="space-y-2">
              <div
                className={`flex h-10 items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${
                  isCurrent
                    ? 'border-primary bg-primary/10 text-primary'
                    : isCompleted
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground'
                }`}
              >
                {isCompleted ? '✓' : item.step}
              </div>
              <div className="flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{item.title}</span>
              </div>
            </div>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CurrentStepIcon className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>{STEPS.find((item) => item.step === step)?.title}</CardTitle>
              <CardDescription>Passo {step} de 5</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <StepBusinessInfo
              data={data}
              setData={setData}
              updateHours={updateHours}
              toggleClosedDay={toggleClosedDay}
            />
          )}
          {step === 2 && (
            <StepBusinessServices data={data} setData={setData} setService={setService} />
          )}
          {step === 3 && <StepPersonality data={data} setData={setData} />}
          {step === 4 && (
            <StepKnowledgeBase
              data={data}
              setData={setData}
              addFaq={addFaq}
              updateFaq={updateFaq}
              removeFaq={removeFaq}
              addFiles={addFiles}
              removeKnowledgeFile={removeKnowledgeFile}
            />
          )}
          {step === 5 && <StepReview data={data} promptPreview={promptPreview} />}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={goBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          {step === 1 ? 'Cancelar' : 'Voltar'}
        </Button>

        {step < 5 ? (
          <Button onClick={goNext} disabled={!canGoNext()}>
            Próximo
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={createAgent} disabled={isCreating}>
            {isCreating ? 'Criando agente...' : 'Criar Agente'}
          </Button>
        )}
      </div>
    </div>
  )
}

function StepBusinessInfo({
  data,
  setData,
  updateHours,
  toggleClosedDay,
}: {
  data: FormData
  setData: React.Dispatch<React.SetStateAction<FormData>>
  updateHours: (key: keyof WizardData['businessHours'], value: string) => void
  toggleClosedDay: (key: keyof WizardData['businessHours'], closed: boolean) => void
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome do negócio*">
          <Input
            placeholder="Ex: Clínica Vida Plena"
            value={data.businessName}
            onChange={(event) =>
              setData((prev) => ({ ...prev, businessName: event.target.value }))
            }
          />
        </Field>

        <Field label="Tipo de negócio*">
          <Select
            value={data.businessType || null}
            onValueChange={(value) =>
              setData((prev) => ({
                ...prev,
                businessType: (value ?? '') as BusinessType | '',
                services: {},
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="E-commerce">E-commerce</SelectItem>
              <SelectItem value="Clínica/Consultório">Clínica/Consultório</SelectItem>
              <SelectItem value="Restaurante">Restaurante</SelectItem>
              <SelectItem value="Imobiliária">Imobiliária</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Descrição curta do negócio">
        <Textarea
          placeholder="Descreva seu negócio em até 300 caracteres"
          maxLength={300}
          value={data.businessDescription}
          onChange={(event) =>
            setData((prev) => ({ ...prev, businessDescription: event.target.value }))
          }
        />
        <p className="text-right text-xs text-muted-foreground">
          {data.businessDescription.length}/300
        </p>
      </Field>

      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm font-medium">Horário de funcionamento</p>

        <ScheduleInput
          label="Segunda-Sexta"
          value={data.businessHours.weekdays}
          onValueChange={(value) => updateHours('weekdays', value)}
          onClosedChange={(closed) => toggleClosedDay('weekdays', closed)}
        />
        <ScheduleInput
          label="Sábado"
          value={data.businessHours.saturday}
          onValueChange={(value) => updateHours('saturday', value)}
          onClosedChange={(closed) => toggleClosedDay('saturday', closed)}
        />
        <ScheduleInput
          label="Domingo"
          value={data.businessHours.sunday}
          onValueChange={(value) => updateHours('sunday', value)}
          onClosedChange={(closed) => toggleClosedDay('sunday', closed)}
        />
      </div>

      <Field label="Cidade e Estado*">
        <Input
          placeholder="Ex: São Paulo, SP"
          value={data.location}
          onChange={(event) => setData((prev) => ({ ...prev, location: event.target.value }))}
        />
      </Field>
    </div>
  )
}

function StepBusinessServices({
  data,
  setData,
  setService,
}: {
  data: FormData
  setData: React.Dispatch<React.SetStateAction<FormData>>
  setService: (key: string, value: unknown) => void
}) {
  if (!data.businessType) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Selecione um tipo de negócio no passo 1 para configurar os campos dinâmicos.
      </div>
    )
  }

  if (data.businessType === 'E-commerce') {
    return (
      <div className="space-y-5">
        <TagsField
          label="Principais categorias de produtos"
          values={(data.services.productCategories as string[]) ?? []}
          onChange={(value) => setService('productCategories', value)}
          placeholder="Digite e pressione Enter"
        />

        <Field label="Ticket médio">
          <Select
            value={(data.services.averageTicket as string) || undefined}
            onValueChange={(value) => setService('averageTicket', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Até R$50">Até R$50</SelectItem>
              <SelectItem value="R$50-200">R$50-200</SelectItem>
              <SelectItem value="R$200-500">R$200-500</SelectItem>
              <SelectItem value="Acima de R$500">Acima de R$500</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="Prazo médio de entrega">
          <Input
            placeholder="Ex: 3 a 7 dias úteis"
            value={(data.services.deliveryTime as string) ?? ''}
            onChange={(event) => setService('deliveryTime', event.target.value)}
          />
        </Field>

        <Field label="Política de troca e devolução">
          <Textarea
            placeholder="Explique de forma simples como funciona"
            value={(data.services.returnPolicy as string) ?? ''}
            onChange={(event) => setService('returnPolicy', event.target.value)}
          />
        </Field>

        <Field label="Frete grátis a partir de (opcional)">
          <Input
            type="number"
            inputMode="decimal"
            placeholder="Ex: 199"
            value={String(data.services.freeShippingFrom ?? '')}
            onChange={(event) => {
              const value = event.target.value.trim()
              setService('freeShippingFrom', value ? Number(value) : null)
            }}
          />
        </Field>
      </div>
    )
  }

  if (data.businessType === 'Clínica/Consultório') {
    return (
      <div className="space-y-5">
        <TagsField
          label="Especialidades atendidas"
          values={(data.services.specialties as string[]) ?? []}
          onChange={(value) => setService('specialties', value)}
          placeholder="Digite uma especialidade"
        />

        <TagsField
          label="Convênios aceitos"
          values={(data.services.acceptedInsurances as string[]) ?? []}
          onChange={(value) => setService('acceptedInsurances', value)}
          placeholder="Digite um convênio"
        />

        <Field label="Duração média da consulta">
          <Select
            value={(data.services.consultationDuration as string) || undefined}
            onValueChange={(value) => setService('consultationDuration', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30min">30min</SelectItem>
              <SelectItem value="45min">45min</SelectItem>
              <SelectItem value="60min">60min</SelectItem>
              <SelectItem value="Varia">Varia</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="Como funciona o agendamento?">
          <Select
            value={(data.services.schedulingMethod as string) || undefined}
            onValueChange={(value) => setService('schedulingMethod', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pelo WhatsApp">Pelo WhatsApp</SelectItem>
              <SelectItem value="Pelo site">Pelo site</SelectItem>
              <SelectItem value="Ligação telefônica">Ligação telefônica</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <ToggleField
          label="Retorno de consulta é cobrado?"
          checked={Boolean(data.services.returnVisitIsPaid)}
          onCheckedChange={(checked) => setService('returnVisitIsPaid', checked)}
        />
      </div>
    )
  }

  if (data.businessType === 'Restaurante') {
    const deliveryEnabled = Boolean(data.services.hasDelivery)
    const reservationEnabled = Boolean(data.services.acceptsReservation)

    return (
      <div className="space-y-5">
        <Field label="Tipo de culinária">
          <Input
            placeholder="Ex: Italiana, pizzas"
            value={(data.services.cuisineType as string) ?? ''}
            onChange={(event) => setService('cuisineType', event.target.value)}
          />
        </Field>

        <ToggleField
          label="Faz delivery?"
          checked={deliveryEnabled}
          onCheckedChange={(checked) => setService('hasDelivery', checked)}
        />

        {deliveryEnabled && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Raio de entrega">
              <Input
                placeholder="Ex: 8 km"
                value={(data.services.deliveryRadius as string) ?? ''}
                onChange={(event) => setService('deliveryRadius', event.target.value)}
              />
            </Field>

            <Field label="Taxa de entrega">
              <Input
                placeholder="Ex: R$ 8,00"
                value={(data.services.deliveryFee as string) ?? ''}
                onChange={(event) => setService('deliveryFee', event.target.value)}
              />
            </Field>
          </div>
        )}

        <ToggleField
          label="Aceita reservas?"
          checked={reservationEnabled}
          onCheckedChange={(checked) => setService('acceptsReservation', checked)}
        />

        {reservationEnabled && (
          <Field label="Como agendar reserva?">
            <Input
              placeholder="Ex: Pelo WhatsApp com nome e horário"
              value={(data.services.reservationMethod as string) ?? ''}
              onChange={(event) => setService('reservationMethod', event.target.value)}
            />
          </Field>
        )}

        <Field label="Horário de pico">
          <Input
            placeholder="Ex: 12h-14h e 19h-21h"
            value={(data.services.peakHours as string) ?? ''}
            onChange={(event) => setService('peakHours', event.target.value)}
          />
        </Field>

        <Field label="Valor médio por pessoa">
          <Select
            value={(data.services.averagePerPerson as string) || undefined}
            onValueChange={(value) => setService('averagePerPerson', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Até R$40">Até R$40</SelectItem>
              <SelectItem value="R$40-80">R$40-80</SelectItem>
              <SelectItem value="R$80-120">R$80-120</SelectItem>
              <SelectItem value="Acima de R$120">Acima de R$120</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
    )
  }

  if (data.businessType === 'Imobiliária') {
    const dealTypes = (data.services.dealTypes as string[]) ?? []

    const toggleDealType = (value: 'Venda' | 'Aluguel' | 'Ambos', checked: boolean) => {
      if (value === 'Ambos') {
        setService('dealTypes', checked ? ['Venda', 'Aluguel', 'Ambos'] : [])
        return
      }

      const set = new Set(dealTypes.filter((type) => type !== 'Ambos'))
      if (checked) {
        set.add(value)
      } else {
        set.delete(value)
      }

      const next = Array.from(set)
      if (next.includes('Venda') && next.includes('Aluguel')) {
        next.push('Ambos')
      }

      setService('dealTypes', next)
    }

    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium">Tipo de negócio</p>
          <div className="grid gap-3 md:grid-cols-3">
            {(['Venda', 'Aluguel', 'Ambos'] as const).map((item) => (
              <label
                key={item}
                className="flex items-center gap-2 rounded-lg border p-3 text-sm"
              >
                <Checkbox
                  checked={dealTypes.includes(item)}
                  onCheckedChange={(checked) => toggleDealType(item, checked === true)}
                />
                {item}
              </label>
            ))}
          </div>
        </div>

        <TagsField
          label="Bairros/regiões atendidos"
          values={(data.services.coveredRegions as string[]) ?? []}
          onChange={(value) => setService('coveredRegions', value)}
          placeholder="Digite e pressione Enter"
        />

        <Field label="Faixa de preço de venda">
          <Select
            value={(data.services.salePriceRange as string) || undefined}
            onValueChange={(value) => setService('salePriceRange', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Até R$300 mil">Até R$300 mil</SelectItem>
              <SelectItem value="R$300 mil - R$700 mil">R$300 mil - R$700 mil</SelectItem>
              <SelectItem value="R$700 mil - R$1,5 mi">R$700 mil - R$1,5 mi</SelectItem>
              <SelectItem value="Acima de R$1,5 mi">Acima de R$1,5 mi</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="Faixa de preço de aluguel">
          <Select
            value={(data.services.rentPriceRange as string) || undefined}
            onValueChange={(value) => setService('rentPriceRange', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Até R$1.500">Até R$1.500</SelectItem>
              <SelectItem value="R$1.500 - R$3.000">R$1.500 - R$3.000</SelectItem>
              <SelectItem value="R$3.000 - R$6.000">R$3.000 - R$6.000</SelectItem>
              <SelectItem value="Acima de R$6.000">Acima de R$6.000</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <ToggleField
          label="Aceita permuta?"
          checked={Boolean(data.services.acceptsExchange)}
          onCheckedChange={(checked) => setService('acceptsExchange', checked)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Field label="Descreva seus principais serviços*">
        <Textarea
          placeholder="Explique quais serviços você oferece e para quem"
          className="min-h-28"
          value={(data.services.mainServices as string) ?? ''}
          onChange={(event) => setService('mainServices', event.target.value)}
        />
      </Field>

      <Field label="Qual problema você resolve para o cliente?*">
        <Textarea
          placeholder="Ex: Ajudamos o cliente a encontrar um imóvel com agilidade"
          className="min-h-28"
          value={(data.services.customerProblem as string) ?? ''}
          onChange={(event) => setService('customerProblem', event.target.value)}
        />
      </Field>
    </div>
  )
}

function StepPersonality({
  data,
  setData,
}: {
  data: FormData
  setData: React.Dispatch<React.SetStateAction<FormData>>
}) {
  return (
    <div className="space-y-5">
      <Field label="Nome do agente*">
        <Input
          placeholder="Ex: Sofia, Carlos, Automat"
          value={data.agentName}
          onChange={(event) => setData((prev) => ({ ...prev, agentName: event.target.value }))}
        />
      </Field>

      <div className="space-y-2">
        <p className="text-sm font-medium">Tom de voz</p>
        <div className="grid gap-3">
          <PersonalityOption
            active={data.personality === 'professional'}
            title="Profissional e formal"
            example={'"Prezado cliente, como posso ajudá-lo?"'}
            onClick={() => setData((prev) => ({ ...prev, personality: 'professional' }))}
          />
          <PersonalityOption
            active={data.personality === 'friendly'}
            title="Amigável e descontraído"
            example={'"Oi! Como posso te ajudar hoje? 😊"'}
            onClick={() => setData((prev) => ({ ...prev, personality: 'friendly' }))}
          />
          <PersonalityOption
            active={data.personality === 'casual'}
            title="Casual e jovem"
            example={'"Ei! O que você precisa?"'}
            onClick={() => setData((prev) => ({ ...prev, personality: 'casual' }))}
          />
        </div>
      </div>

      <ToggleField
        label="Usa emojis?"
        checked={data.useEmojis}
        onCheckedChange={(checked) => setData((prev) => ({ ...prev, useEmojis: checked }))}
      />

      <Field label="Quando não souber responder">
        <Select
          value={data.unknownResponse || null}
          onValueChange={(value) =>
            setData((prev) => ({ ...prev, unknownResponse: value ?? prev.unknownResponse }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Informa que vai verificar e retorna em breve">
              Informa que vai verificar e retorna em breve
            </SelectItem>
            <SelectItem value="Pede para entrar em contato por outro canal">
              Pede para entrar em contato por outro canal
            </SelectItem>
            <SelectItem value="Transfere para atendente humano">
              Transfere para atendente humano
            </SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <ToggleField
        label="Falar apenas sobre o negócio?"
        checked={data.limitTopics}
        onCheckedChange={(checked) => setData((prev) => ({ ...prev, limitTopics: checked }))}
      />

      <Field label="Idioma principal">
        <Select
          value={data.language || null}
          onValueChange={(value) =>
            setData((prev) => ({ ...prev, language: value ?? prev.language }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Português Brasileiro">Português Brasileiro</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </div>
  )
}

function StepKnowledgeBase({
  data,
  setData,
  addFaq,
  updateFaq,
  removeFaq,
  addFiles,
  removeKnowledgeFile,
}: {
  data: FormData
  setData: React.Dispatch<React.SetStateAction<FormData>>
  addFaq: () => void
  updateFaq: (id: string, field: 'question' | 'answer', value: string) => void
  removeFaq: (id: string) => void
  addFiles: (files: FileList | null) => void
  removeKnowledgeFile: (id: string) => void
}) {
  return (
    <div className="space-y-6">
      <Field label="Upload de arquivo (PDF, TXT, DOCX)">
        <Input
          type="file"
          accept=".pdf,.txt,.docx"
          multiple
          onChange={(event) => {
            addFiles(event.target.files)
            event.target.value = ''
          }}
        />
      </Field>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">FAQ manual</p>
          <Button variant="outline" size="sm" onClick={addFaq}>
            <Plus className="mr-2 h-3.5 w-3.5" />
            Adicionar pergunta e resposta
          </Button>
        </div>

        {data.knowledgeFaqs.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Nenhuma FAQ adicionada ainda.
          </div>
        )}

        {data.knowledgeFaqs.map((faq) => (
          <div key={faq.id} className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">FAQ</p>
              <Button variant="ghost" size="icon-sm" onClick={() => removeFaq(faq.id)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Input
              placeholder="Pergunta"
              value={faq.question}
              onChange={(event) => updateFaq(faq.id, 'question', event.target.value)}
            />
            <Textarea
              placeholder="Resposta"
              value={faq.answer}
              onChange={(event) => updateFaq(faq.id, 'answer', event.target.value)}
            />
          </div>
        ))}
      </div>

      <Field label="URL do site do negócio">
        <Input
          type="url"
          placeholder="https://www.seusite.com.br"
          value={data.websiteUrl}
          onChange={(event) => setData((prev) => ({ ...prev, websiteUrl: event.target.value }))}
        />
      </Field>

      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm font-medium">Itens adicionados</p>

        {data.knowledgeFiles.length === 0 && data.knowledgeFaqs.length === 0 && !data.websiteUrl.trim() && (
          <p className="text-sm text-muted-foreground">Nada adicionado ainda.</p>
        )}

        {data.knowledgeFiles.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/60 p-2">
            <div className="flex items-center gap-2 text-sm">
              <Upload className="h-4 w-4" />
              <span>{item.file.name}</span>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => removeKnowledgeFile(item.id)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {data.knowledgeFaqs
          .filter((faq) => faq.question.trim() || faq.answer.trim())
          .map((faq) => (
            <div key={faq.id} className="rounded-md bg-muted/60 p-2 text-sm">
              <span className="font-medium">FAQ:</span> {faq.question || 'Pergunta sem título'}
            </div>
          ))}

        {data.websiteUrl.trim() && (
          <div className="flex items-center justify-between gap-2 rounded-md bg-muted/60 p-2 text-sm">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>{data.websiteUrl}</span>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setData((prev) => ({ ...prev, websiteUrl: '' }))}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function StepReview({ data, promptPreview }: { data: FormData; promptPreview: string }) {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo da configuração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ReviewRow label="Nome do agente" value={data.agentName} />
          <ReviewRow label="Negócio" value={data.businessName} />
          <ReviewRow label="Tipo de negócio" value={data.businessType || '—'} />
          <ReviewRow label="Cidade/Estado" value={data.location} />
          <ReviewRow
            label="Horários"
            value={`Seg-Sex: ${data.businessHours.weekdays} | Sáb: ${data.businessHours.saturday} | Dom: ${data.businessHours.sunday}`}
          />
          <ReviewRow
            label="Personalidade"
            value={
              data.personality === 'professional'
                ? 'Profissional e formal'
                : data.personality === 'friendly'
                  ? 'Amigável e descontraído'
                  : 'Casual e jovem'
            }
          />
          <ReviewRow label="Usa emojis" value={data.useEmojis ? 'Sim' : 'Não'} />
          <ReviewRow label="Quando não souber" value={data.unknownResponse} />
          <ReviewRow label="Limitar assunto" value={data.limitTopics ? 'Sim' : 'Não'} />
          <ReviewRow label="Idioma" value={data.language} />
          <ReviewRow label="Arquivos" value={String(data.knowledgeFiles.length)} />
          <ReviewRow label="FAQs" value={String(data.knowledgeFaqs.length)} />
          <ReviewRow label="Site" value={data.websiteUrl || '—'} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <Accordion defaultValue={[]}>
            <AccordionItem value="prompt">
              <AccordionTrigger>Ver prompt gerado</AccordionTrigger>
              <AccordionContent>
                <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">
                  {promptPreview}
                </pre>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
        <p className="font-medium">Tudo pronto para criar seu agente.</p>
        <p className="text-muted-foreground">
          Após criar, você será redirecionado para a página de detalhes e teste de chat.
        </p>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}

function ToggleField({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <p className="text-sm font-medium">{label}</p>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function ScheduleInput({
  label,
  value,
  onValueChange,
  onClosedChange,
}: {
  label: string
  value: string
  onValueChange: (value: string) => void
  onClosedChange: (closed: boolean) => void
}) {
  const isClosed = value === 'Fechado'

  return (
    <div className="grid gap-2 md:grid-cols-[120px_1fr_auto] md:items-center">
      <p className="text-sm text-muted-foreground">{label}</p>
      <Input
        placeholder="Ex: 08:00-18:00"
        value={isClosed ? '' : value}
        onChange={(event) => onValueChange(event.target.value)}
        disabled={isClosed}
      />
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <Checkbox checked={isClosed} onCheckedChange={(checked) => onClosedChange(checked === true)} />
        Fechado
      </label>
    </div>
  )
}

function TagsField({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder: string
}) {
  const [draft, setDraft] = useState('')

  const addTag = (rawValue: string) => {
    const tag = rawValue.trim()
    if (!tag) return

    const exists = values.some((item) => item.toLowerCase() === tag.toLowerCase())
    if (exists) return

    onChange([...values, tag])
    setDraft('')
  }

  const removeTag = (tag: string) => {
    onChange(values.filter((item) => item !== tag))
  }

  return (
    <Field label={label}>
      <div className="space-y-2">
        <Input
          placeholder={placeholder}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault()
              addTag(draft)
            }
          }}
          onBlur={() => addTag(draft)}
        />

        <div className="flex flex-wrap gap-2">
          {values.length === 0 && <p className="text-xs text-muted-foreground">Nenhum item adicionado.</p>}
          {values.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button type="button" onClick={() => removeTag(tag)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>
    </Field>
  )
}

function PersonalityOption({
  active,
  title,
  example,
  onClick,
}: {
  active: boolean
  title: string
  example: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-3 text-left transition-colors ${
        active ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground/50'
      }`}
    >
      <div className="flex items-center gap-2">
        <CircleHelp className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium">{title}</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{example}</p>
    </button>
  )
}

function ReviewRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-2 last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{formatLabel(value)}</span>
    </div>
  )
}
