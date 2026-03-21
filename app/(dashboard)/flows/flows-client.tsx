"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Workflow, Plus, Zap, Play, Pause, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

const TRIGGER_LABELS: Record<string, string> = {
  keyword: "Palavra-chave",
  first_message: "Primeira Mensagem",
  schedule: "Agendamento",
  webhook: "Webhook",
  manual: "Manual",
}

export function FlowsClient({ initialFlows = [], accounts = [] }: { initialFlows: any[], accounts: any[] }) {
  const [flows, setFlows] = useState(initialFlows)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [triggerType, setTriggerType] = useState("")
  const [triggerValue, setTriggerValue] = useState("")
  const [accountId, setAccountId] = useState("")
  const supabase = createClient()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !triggerType) { toast.error("Preencha os campos obrigatórios"); return }
    setIsLoading(true)
    try {
      const { data: member } = await supabase.from('team_members').select('tenant_id').limit(1).single()
      const { data, error } = await supabase
        .from('flows')
        .insert([{ name, description, trigger_type: triggerType, trigger_value: triggerValue, whatsapp_account_id: accountId || null, is_active: false, tenant_id: member?.tenant_id }])
        .select()
        .single()
      if (error) throw error
      setFlows([data, ...flows])
      toast.success("Fluxo criado com sucesso!")
      setIsDialogOpen(false)
      setName(""); setDescription(""); setTriggerType(""); setTriggerValue(""); setAccountId("")
    } catch (err: any) {
      toast.error("Erro ao criar fluxo")
    } finally { setIsLoading(false) }
  }

  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase.from('flows').update({ is_active: !currentState }).eq('id', id)
      if (error) throw error
      setFlows(flows.map(f => f.id === id ? { ...f, is_active: !currentState } : f))
    } catch { toast.error("Erro ao alterar status") }
  }

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('flows').delete().eq('id', id)
      setFlows(flows.filter(f => f.id !== id))
      toast.success("Fluxo removido")
    } catch { toast.error("Erro ao remover fluxo") }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fluxos de Automação</h1>
          <p className="text-muted-foreground">Configure fluxos de atendimento que respondem automaticamente a gatilhos.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="w-4 h-4 mr-2" /> Novo Fluxo
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Criar Fluxo</DialogTitle>
              <DialogDescription>Configure um novo fluxo de automação para atendimento.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="fname">Nome do Fluxo</Label>
                <Input id="fname" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Boas-vindas novos contatos" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fdesc">Descrição</Label>
                <Textarea id="fdesc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva o que este fluxo faz..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ftrigger">Gatilho</Label>
                  <Select value={triggerType} onValueChange={(val) => val && setTriggerType(val)} required>
                    <SelectTrigger id="ftrigger"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keyword">Palavra-chave</SelectItem>
                      <SelectItem value="first_message">Primeira Mensagem</SelectItem>
                      <SelectItem value="schedule">Agendamento</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fvalue">Valor do Gatilho</Label>
                  <Input id="fvalue" value={triggerValue} onChange={e => setTriggerValue(e.target.value)} placeholder={triggerType === 'keyword' ? 'Ex: oi, olá, info' : 'Opcional'} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="faccount">Conta WhatsApp</Label>
                <Select value={accountId} onValueChange={(val) => val && setAccountId(val)}>
                  <SelectTrigger id="faccount"><SelectValue placeholder="Todas as contas" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                    {accounts.length === 0 && <SelectItem value="none" disabled>Nenhuma conta conectada</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Criando...' : 'Criar Fluxo'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {flows.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
          <div className="p-4 bg-secondary rounded-full mb-4"><Workflow className="w-8 h-8 text-muted-foreground" /></div>
          <h2 className="text-xl font-semibold mb-2">Crie seu primeiro fluxo de automação</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">Automatize conversas do WhatsApp com gatilhos inteligentes sem escrever código.</p>
          <Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" /> Criar Fluxo</Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {flows.map(flow => (
            <Card key={flow.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-secondary rounded-md"><Workflow className="w-5 h-5 text-secondary-foreground" /></div>
                  <div className="flex items-center gap-2">
                    <Switch checked={flow.is_active} onCheckedChange={() => toggleActive(flow.id, flow.is_active)} />
                    <Badge variant={flow.is_active ? 'default' : 'secondary'}>{flow.is_active ? 'Ativo' : 'Inativo'}</Badge>
                  </div>
                </div>
                <CardTitle>{flow.name}</CardTitle>
                <CardDescription className="flex items-center gap-1"><Zap className="w-3 h-3" /> {TRIGGER_LABELS[flow.trigger_type] || flow.trigger_type}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {flow.description && <p className="text-sm text-muted-foreground">{flow.description}</p>}
                <div className="mt-3 text-sm"><span className="text-muted-foreground">Execuções: </span><span className="font-medium">{flow.execution_count || 0}</span></div>
              </CardContent>
              <CardFooter className="pt-4 border-t flex justify-between">
                <Button variant="ghost" size="sm">Editar Canvas</Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(flow.id)}><Trash2 className="w-4 h-4" /></Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
