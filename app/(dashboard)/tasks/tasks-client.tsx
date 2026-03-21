"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckSquare, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const PRIORITY_STYLES: Record<string, { label: string; className: string }> = {
  low: { label: 'Baixa', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  medium: { label: 'Média', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  high: { label: 'Alta', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  urgent: { label: 'Urgente', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

const STATUS_LABELS: Record<string, string> = { pending: 'Pendente', in_progress: 'Em Andamento', completed: 'Concluída' }

export function TasksClient({ initialTasks = [], contacts = [], leads = [], members = [] }: { initialTasks: any[], contacts: any[], leads: any[], members: any[] }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [priority, setPriority] = useState("medium")
  const [assigneeId, setAssigneeId] = useState("")
  const [contactId, setContactId] = useState("")
  const [leadId, setLeadId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const supabase = createClient()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) { toast.error("Informe o título da tarefa"); return }
    setIsLoading(true)
    try {
      const { data: member } = await supabase.from('team_members').select('tenant_id').limit(1).single()
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ title, description: desc, priority, status: 'pending', assignee_id: assigneeId || null, contact_id: contactId || null, lead_id: leadId || null, due_date: dueDate || null, tenant_id: member?.tenant_id }])
        .select()
        .single()
      if (error) throw error
      setTasks([data, ...tasks])
      toast.success("Tarefa criada!")
      setIsDialogOpen(false)
      setTitle(""); setDesc(""); setPriority("medium"); setAssigneeId(""); setContactId(""); setLeadId(""); setDueDate("")
    } catch (err) {
      toast.error("Erro ao criar tarefa")
    } finally { setIsLoading(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('tasks').delete().eq('id', id)
      setTasks(tasks.filter(t => t.id !== id))
      toast.success("Tarefa removida")
    } catch { toast.error("Erro ao remover") }
  }

  const filtered = tasks.filter(t =>
    (statusFilter === 'all' || t.status === statusFilter) &&
    (priorityFilter === 'all' || t.priority === priorityFilter)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tarefas</h1>
          <p className="text-muted-foreground">Gerencie as atividades da sua equipe de atendimento.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button />}><Plus className="w-4 h-4 mr-2" /> Nova Tarefa</DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nova Tarefa</DialogTitle>
              <DialogDescription>Crie uma atividade para a sua equipe.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="ttitle">Título *</Label>
                <Input id="ttitle" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Ligar para cliente" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tdesc">Descrição</Label>
                <Textarea id="tdesc" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Detalhes sobre a tarefa..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Prioridade</Label>
                  <Select value={priority} onValueChange={(val) => val && setPriority(val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tdue">Prazo</Label>
                  <Input id="tdue" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Responsável</Label>
                <Select value={assigneeId} onValueChange={(val) => val && setAssigneeId(val)}>
                  <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                  <SelectContent>
                    {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name || m.email}</SelectItem>)}
                    {members.length === 0 && <SelectItem value="none" disabled>Nenhum membro</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Contato</Label>
                  <Select value={contactId} onValueChange={(val) => val && setContactId(val)}>
                    <SelectTrigger><SelectValue placeholder="(opcional)" /></SelectTrigger>
                    <SelectContent>
                      {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Lead</Label>
                  <Select value={leadId} onValueChange={(val) => val && setLeadId(val)}>
                    <SelectTrigger><SelectValue placeholder="(opcional)" /></SelectTrigger>
                    <SelectContent>
                      {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Criando...' : 'Criar Tarefa'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="completed">Concluída</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(val) => val && setPriorityFilter(val)}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Prioridades</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {tasks.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
          <div className="p-4 bg-secondary rounded-full mb-4"><CheckSquare className="w-8 h-8 text-muted-foreground" /></div>
          <h2 className="text-xl font-semibold mb-2">Nenhuma tarefa encontrada</h2>
          <p className="text-muted-foreground mb-6">Crie a primeira tarefa para a sua equipe de atendimento.</p>
          <Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" /> Nova Tarefa</Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const p = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium
            return (
              <Card key={task.id}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <CheckSquare className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{task.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {task.due_date && <span>Prazo: {new Date(task.due_date).toLocaleDateString('pt-BR')}</span>}
                        {task.contacts?.name && <span className="ml-2">· {task.contacts.name}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("text-xs px-2 py-0.5 rounded border font-medium", p.className)}>{p.label}</span>
                    <Badge variant="secondary">{STATUS_LABELS[task.status] || task.status}</Badge>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(task.id)}><Trash2 className="w-4 h-4" /></Button>
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
