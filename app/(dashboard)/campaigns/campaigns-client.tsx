"use client"

import { useState } from "react"
import { Search, Plus, Filter, Megaphone, Calendar, Send, Clock, PlayCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function CampaignsClient({ initialCampaigns, accounts }: { initialCampaigns: any[], accounts: any[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  
  // Create Form State
  const [name, setName] = useState("")
  const [accountId, setAccountId] = useState("")
  const [tagsInput, setTagsInput] = useState("")
  const [content, setContent] = useState("")
  const [scheduledFor, setScheduledFor] = useState("")
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const filteredCampaigns = initialCampaigns.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")
      
      const { data: tenants } = await supabase.from('tenants').select('id').eq('owner_id', user.id).limit(1)
      const tenantId = tenants?.[0]?.id
      if (!tenantId) throw new Error("Tenant não encontrado")

      const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t)
      const scheduledDate = scheduledFor ? new Date(scheduledFor).toISOString() : new Date().toISOString()
      const status = scheduledFor ? 'scheduled' : 'running'

      const { error } = await supabase.from('campaigns').insert([{
        tenant_id: tenantId,
        whatsapp_account_id: accountId,
        name,
        content,
        scheduled_for: scheduledDate,
        status,
        recipient_tags: tags,
        total_recipients: 0, // This would be calculated by a background worker based on tags
        messages_sent: 0
      }])

      if (error) throw error

      toast.success("Campanha agendada com sucesso!")
      setIsCreateOpen(false)
      setName("")
      setAccountId("")
      setTagsInput("")
      setContent("")
      setScheduledFor("")
      router.refresh()
    } catch (error: any) {
      toast.error("Erro ao criar campanha", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'draft': return <Badge variant="secondary">Rascunho</Badge>
      case 'scheduled': return <Badge variant="outline" className="border-blue-500/20 text-blue-600 bg-blue-500/10"><Clock className="w-3 h-3 mr-1"/> Agendada</Badge>
      case 'running': return <Badge className="bg-green-500/15 text-green-600 border-green-500/20"><PlayCircle className="w-3 h-3 mr-1"/> Em Andamento</Badge>
      case 'completed': return <Badge variant="default" className="bg-primary">Concluída</Badge>
      case 'cancelled': return <Badge variant="destructive">Cancelada</Badge>
      default: return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campanhas em Massa</h1>
          <p className="text-muted-foreground">Envie mensagens em lote para seus contatos e leads.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Disparar Nova Campanha</DialogTitle>
                <DialogDescription>
                  Configure uma nova mensagem em massa. Suporta variáveis como {'{{nome}}'}.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome da Campanha (Interno)</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Promoção Black Friday" />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="account">Conta Remetente</Label>
                  <Select value={accountId} onValueChange={setAccountId} required>
                    <SelectTrigger id="account">
                      <SelectValue placeholder="Selecione a conta WhatsApp" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.length === 0 ? (
                        <SelectItem value="none" disabled>Nenhuma conta conectada</SelectItem>
                      ) : (
                        accounts.map(acc => (
                          <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="tags">Tags Destinatárias (vazio = todos)</Label>
                  <Input id="tags" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="Lead, Vip, Prospect (separado por vírgula)" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="content">Conteúdo da Mensagem</Label>
                  <Textarea 
                    id="content" 
                    rows={4} 
                    value={content} 
                    onChange={e => setContent(e.target.value)} 
                    required 
                    placeholder="Olá {{nome}}, temos uma oferta especial..." 
                  />
                  <div className="text-xs text-muted-foreground">
                    Variáveis disponíveis: <span className="font-mono bg-muted px-1 py-0.5 rounded">{'{{nome}}'}</span>, <span className="font-mono bg-muted px-1 py-0.5 rounded">{'{{telefone}}'}</span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="schedule">Agendar para (Opcional)</Label>
                  <Input id="schedule" type="datetime-local" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)} />
                  <div className="text-xs text-muted-foreground">Deixe em branco para iniciar o disparo imediatamente.</div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={loading}>{loading ? "Agendando..." : "Criar Disparo"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar campanhas..." 
            className="pl-8" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {filteredCampaigns.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <Megaphone className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Nenhuma campanha encontrada</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Você ainda não criou nenhum disparo em massa.
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>Criar primeira campanha</Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((camp) => {
            const progress = camp.total_recipients > 0 ? Math.round((camp.messages_sent / camp.total_recipients) * 100) : 0;
            
            return (
              <Card key={camp.id} className="flex flex-col">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{camp.name}</CardTitle>
                    <div className="text-sm font-medium text-muted-foreground flex items-center">
                      <Send className="w-3 h-3 mr-1" />
                      Por: {camp.account?.name || 'Conta Excluída'}
                    </div>
                  </div>
                  {getStatusBadge(camp.status)}
                </CardHeader>
                <CardContent className="flex-1 py-4">
                  <div className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {camp.content}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Progresso do Disparo</span>
                      <span>{camp.messages_sent} / {camp.total_recipients}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all" 
                        style={{ width: `${progress}%` }} 
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-4">
                    <Calendar className="w-3.5 h-3.5" />
                    Agendado para: {new Date(camp.scheduled_for || camp.created_at).toLocaleString('pt-BR')}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
