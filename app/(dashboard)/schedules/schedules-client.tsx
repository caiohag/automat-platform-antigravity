"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarClock, Plus, Trash2, User } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Concluído',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'secondary',
  confirmed: 'default',
  cancelled: 'destructive',
  completed: 'outline',
}

export function SchedulesClient({ initialSchedules = [], contacts = [] }: { initialSchedules: any[], contacts: any[] }) {
  const [schedules, setSchedules] = useState(initialSchedules)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")

  const [title, setTitle] = useState("")
  const [contactId, setContactId] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [duration, setDuration] = useState("60")
  const [recurrence, setRecurrence] = useState("once")
  const supabase = createClient()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !scheduledAt) { toast.error("Preencha título e data"); return }
    setIsLoading(true)
    try {
      const { data: member } = await supabase.from('team_members').select('tenant_id').limit(1).single()
      const { data, error } = await supabase
        .from('schedules')
        .insert([{ title, contact_id: contactId || null, scheduled_at: scheduledAt, duration_minutes: parseInt(duration), recurrence, status: 'pending', tenant_id: member?.tenant_id }])
        .select()
        .single()
      if (error) throw error
      setSchedules([data, ...schedules])
      toast.success("Agendamento criado!")
      setIsDialogOpen(false)
      setTitle(""); setContactId(""); setScheduledAt(""); setDuration("60"); setRecurrence("once")
    } catch (err) {
      toast.error("Erro ao criar agendamento")
    } finally { setIsLoading(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('schedules').delete().eq('id', id)
      setSchedules(schedules.filter(s => s.id !== id))
      toast.success("Agendamento removido")
    } catch { toast.error("Erro ao remover") }
  }

  const filtered = statusFilter === 'all' ? schedules : schedules.filter(s => s.status === statusFilter)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
          <p className="text-muted-foreground">Gerencie compromissos e reuniões com seus contatos.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button />}><Plus className="w-4 h-4 mr-2" /> Novo Agendamento</DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
              <DialogDescription>Agende um compromisso com um contato.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="stitle">Título</Label>
                <Input id="stitle" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Reunião de briefing" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="scontact">Contato</Label>
                <Select value={contactId} onValueChange={(val) => val && setContactId(val)}>
                  <SelectTrigger id="scontact"><SelectValue placeholder="Selecione um contato (opcional)" /></SelectTrigger>
                  <SelectContent>
                    {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name} — {c.phone_number}</SelectItem>)}
                    {contacts.length === 0 && <SelectItem value="none" disabled>Nenhum contato cadastrado</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="sdate">Data e Hora</Label>
                  <Input id="sdate" type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sduration">Duração (min)</Label>
                  <Input id="sduration" type="number" value={duration} onChange={e => setDuration(e.target.value)} min="15" max="480" step="15" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="srecurrence">Recorrência</Label>
                <Select value={recurrence} onValueChange={(val) => val && setRecurrence(val)}>
                  <SelectTrigger id="srecurrence"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Única vez</SelectItem>
                    <SelectItem value="daily">Diária</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Agendar'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="confirmed">Confirmado</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {schedules.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
          <div className="p-4 bg-secondary rounded-full mb-4"><CalendarClock className="w-8 h-8 text-muted-foreground" /></div>
          <h2 className="text-xl font-semibold mb-2">Nenhum agendamento encontrado</h2>
          <p className="text-muted-foreground mb-6">Agende reuniões e compromissos com seus contatos.</p>
          <Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" /> Novo Agendamento</Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(schedule => (
            <Card key={schedule.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-2 bg-secondary rounded-md shrink-0"><CalendarClock className="w-5 h-5 text-secondary-foreground" /></div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{schedule.title}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      {schedule.contacts?.name && <><User className="w-3 h-3" />{schedule.contacts.name}</>}
                      <span>{new Date(schedule.scheduled_at).toLocaleString('pt-BR')}</span>
                      {schedule.duration_minutes && <span>· {schedule.duration_minutes} min</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={STATUS_COLORS[schedule.status] as any}>
                    {STATUS_LABELS[schedule.status] || schedule.status}
                  </Badge>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(schedule.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
