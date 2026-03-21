"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RotateCcw, Plus, MousePointerClick, MessageSquareWarning, Clock, Megaphone, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export function RemarketingClient({ initialCampaigns = [], accounts = [] }: { initialCampaigns: any[], accounts: any[] }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const [name, setName] = useState("")
  const [trigger, setTrigger] = useState("")
  const [delay, setDelay] = useState("")
  const [message, setMessage] = useState("")
  const [accountId, setAccountId] = useState("")
  
  const [statusFilter, setStatusFilter] = useState("all")

  const supabase = createClient()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !trigger || !message || !accountId || !delay) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    setIsLoading(true)
    
    // Convert trigger and delay into JSONB filter_tags equivalent since DB is strict MVP
    const campaignData = {
      name,
      message,
      status: "running",
      campaign_type: "remarketing",
      use_rotation: false,
      whatsapp_account_ids: JSON.stringify([accountId]),
      filter_tags: { trigger, delay }
    }

    try {
      const { data: tenantData } = await supabase.from('team_members').select('tenant_id').limit(1).single()
      
      const { data, error } = await supabase
        .from('campaigns')
        .insert([{ ...campaignData, tenant_id: tenantData?.tenant_id }])
        .select()
        .single()

      if (error) throw error

      setCampaigns([data, ...campaigns])
      toast.success("Campanha de remarketing ativada!")
      setIsDialogOpen(false)
      
      // Reset form
      setName("")
      setTrigger("")
      setDelay("")
      setMessage("")
      setAccountId("")
    } catch (err: any) {
      console.error(err)
      toast.error("Erro ao configurar remarketing")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('campaigns').delete().eq('id', id)
      if (error) throw error
      setCampaigns(campaigns.filter(c => c.id !== id))
      toast.success("Campanha removida")
    } catch (err) {
      toast.error("Erro ao remover campanha")
    }
  }

  const filtered = statusFilter === 'all' 
    ? campaigns 
    : campaigns.filter(c => c.status === statusFilter)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Remarketing</h1>
          <p className="text-muted-foreground">Recupere vendas e converta contatos inativos automaticamente.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Campanha
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Criar Campanha de Remarketing</DialogTitle>
              <DialogDescription>
                Configure gatilhos automáticos para reengajar contatos pelo WhatsApp.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Automação</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Carrinho Abandonado 2h" required />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="trigger">Gatilho (Quando)</Label>
                  <Select value={trigger} onValueChange={(val) => val && setTrigger(val)} required>
                    <SelectTrigger id="trigger">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cart_abandoned">Carrinho Abandonado</SelectItem>
                      <SelectItem value="no_reply">Sem Resposta no Chat</SelectItem>
                      <SelectItem value="inactive_30d">Inativo (30 dias)</SelectItem>
                      <SelectItem value="pix_pending">PIX Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="delay">Tempo de Espera</Label>
                  <Select value={delay} onValueChange={(val) => val && setDelay(val)} required>
                    <SelectTrigger id="delay">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10_min">Após 10 Minutos</SelectItem>
                      <SelectItem value="1_hour">Após 1 Hora</SelectItem>
                      <SelectItem value="24_hours">Após 24 Horas</SelectItem>
                      <SelectItem value="3_days">Após 3 Dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="account">Conta Remetente</Label>
                <Select value={accountId} onValueChange={(val) => val && setAccountId(val)} required>
                  <SelectTrigger id="account">
                    <SelectValue placeholder="Selecione o WhatsApp" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.phone_number})</SelectItem>
                    ))}
                    {accounts.length === 0 && (
                      <SelectItem value="no_accounts" disabled>Nenhuma conta conectada</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="message">Mensagem HMTL/Texto</Label>
                <Textarea 
                  id="message" 
                  value={message} 
                  onChange={e => setMessage(e.target.value)} 
                  placeholder="Olá! Vi que você deixou alguns itens no carrinho..." 
                  className="min-h-[100px]"
                  required 
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Ativar Remarketing'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="running">Ativos / Rodando</SelectItem>
            <SelectItem value="paused">Pausados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center border-dashed">
          <div className="p-4 bg-secondary rounded-full mb-4">
            <RotateCcw className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Nenhuma campanha de remarketing</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Crie sua primeira campanha de remarketing para reengajar contatos automaticamente.
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            Criar Campanha
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((campaign) => {
            const tags = typeof campaign.filter_tags === 'object' ? campaign.filter_tags : {}
            const triggerMap: any = { cart_abandoned: 'Carrinho Abandonado', no_reply: 'Sem Resposta', inactive_30d: 'Inativo 30d', pix_pending: 'PIX Pendente' }
            const triggerLabel = triggerMap[tags?.trigger] || "Automático"

            return (
              <Card key={campaign.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-secondary rounded-md">
                      <Megaphone className="w-5 h-5 text-secondary-foreground" />
                    </div>
                    <Badge variant={campaign.status === 'running' ? 'default' : 'secondary'}>
                      {campaign.status === 'running' ? 'Ativo' : 'Pausado'}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{campaign.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <MousePointerClick className="w-3 h-3" /> Gatilho: {triggerLabel}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="bg-muted p-3 rounded-md text-sm truncate">
                    "{campaign.message}"
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{campaign.sent_count || 0}</div>
                      <div className="text-xs text-muted-foreground">Disparos</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{campaign.read_count || 0}</div>
                      <div className="text-xs text-muted-foreground">Leituras</div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t flex justify-between">
                  <Button variant="ghost" className="text-muted-foreground">Editar</Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(campaign.id)}>
                    <Trash2 className="w-4 h-4" />
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
