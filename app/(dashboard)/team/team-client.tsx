"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, UserPlus, Shield, User, HeadphonesIcon } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

const ROLE_CONFIG: Record<string, { label: string; variant: any; icon: any }> = {
  admin: { label: 'Admin', variant: 'default', icon: Shield },
  supervisor: { label: 'Supervisor', variant: 'secondary', icon: HeadphonesIcon },
  agent: { label: 'Agente', variant: 'outline', icon: User },
}

export function TeamClient({ initialMembers = [] }: { initialMembers: any[] }) {
  const [members, setMembers] = useState(initialMembers)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("agent")
  const supabase = createClient()

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { toast.error("Informe o e-mail"); return }
    setIsLoading(true)
    try {
      const { data: currentMember } = await supabase.from('team_members').select('tenant_id').limit(1).single()
      const { data, error } = await supabase
        .from('team_members')
        .insert([{ email, role, status: 'invited', tenant_id: currentMember?.tenant_id }])
        .select()
        .single()
      if (error) throw error
      setMembers([data, ...members])
      toast.success(`Convite enviado para ${email}`)
      setIsDialogOpen(false)
      setEmail(""); setRole("agent")
    } catch (err) {
      toast.error("Erro ao convidar membro")
    } finally { setIsLoading(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipe</h1>
          <p className="text-muted-foreground">Gerencie os membros da sua equipe de atendimento.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button />}><UserPlus className="w-4 h-4 mr-2" /> Convidar Membro</DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Convidar Membro</DialogTitle>
              <DialogDescription>Envie um convite para um novo membro da equipe.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="memail">E-mail *</Label>
                <Input id="memail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" required />
              </div>
              <div className="grid gap-2">
                <Label>Papel</Label>
                <Select value={role} onValueChange={(val) => val && setRole(val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin — Acesso total</SelectItem>
                    <SelectItem value="supervisor">Supervisor — Vê tudo, não configura</SelectItem>
                    <SelectItem value="agent">Agente — Só atendimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Enviando...' : 'Enviar Convite'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {members.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
          <div className="p-4 bg-secondary rounded-full mb-4"><Users className="w-8 h-8 text-muted-foreground" /></div>
          <h2 className="text-xl font-semibold mb-2">Convide membros para sua equipe</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">Adicione agentes, supervisores e admins para gerenciar o atendimento juntos.</p>
          <Button onClick={() => setIsDialogOpen(true)}><UserPlus className="w-4 h-4 mr-2" /> Convidar</Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {members.map(member => {
            const cfg = ROLE_CONFIG[member.role] || ROLE_CONFIG.agent
            const initials = (member.name || member.email || "U").substring(0, 2).toUpperCase()
            return (
              <Card key={member.id}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.name || member.email}</div>
                      <div className="text-sm text-muted-foreground">{member.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    <Badge variant={member.status === 'active' ? 'outline' : 'secondary'}>
                      {member.status === 'active' ? 'Ativo' : 'Convite Enviado'}
                    </Badge>
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
