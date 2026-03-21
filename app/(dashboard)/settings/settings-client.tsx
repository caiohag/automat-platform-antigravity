"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { User, Shield, Bell, Save } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export function SettingsClient({ user }: { user: any }) {
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "")
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifWhatsapp, setNotifWhatsapp] = useState(true)
  const [notifSystem, setNotifSystem] = useState(true)
  const supabase = createClient()

  const email = user?.email || ""
  const initials = (fullName || email || "U").substring(0, 2).toUpperCase()

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } })
      if (error) throw error
      toast.success("Perfil atualizado!")
    } catch (err) {
      toast.error("Erro ao atualizar perfil")
    } finally { setIsSavingProfile(false) }
  }

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 8) { toast.error("Senha deve ter pelo menos 8 caracteres"); return }
    setIsSavingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success("Senha atualizada com sucesso!")
      setCurrentPassword(""); setNewPassword("")
    } catch (err) {
      toast.error("Erro ao alterar senha")
    } finally { setIsSavingPassword(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie seu perfil, segurança e preferências de notificação.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile"><User className="w-4 h-4 mr-2" /> Perfil</TabsTrigger>
          <TabsTrigger value="security"><Shield className="w-4 h-4 mr-2" /> Segurança</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-2" /> Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle>Informações do Perfil</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{fullName || "Sem nome"}</p>
                    <p className="text-sm text-muted-foreground">{email}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fname">Nome completo</Label>
                    <Input id="fname" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome completo" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="femail">E-mail</Label>
                    <Input id="femail" value={email} disabled className="text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">E-mail não pode ser alterado diretamente.</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSavingProfile}>
                    <Save className="w-4 h-4 mr-2" />{isSavingProfile ? 'Salvando...' : 'Salvar Perfil'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader><CardTitle>Alterar Senha</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSavePassword} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="newpwd">Nova Senha</Label>
                  <Input id="newpwd" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 8 caracteres" minLength={8} required />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSavingPassword}>
                    <Shield className="w-4 h-4 mr-2" />{isSavingPassword ? 'Salvando...' : 'Alterar Senha'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle>Sessões Ativas</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Histórico de dispositivos conectados estará disponível em breve.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader><CardTitle>Preferências de Notificação</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>Notificações por E-mail</Label>
                  <p className="text-sm text-muted-foreground">Receber resumo diário de atendimentos por e-mail.</p>
                </div>
                <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>Notificações pelo WhatsApp</Label>
                  <p className="text-sm text-muted-foreground">Ser alertado quando um lead chegar sem agente disponível.</p>
                </div>
                <Switch checked={notifWhatsapp} onCheckedChange={setNotifWhatsapp} />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>Notificações do Sistema</Label>
                  <p className="text-sm text-muted-foreground">Alertas sobre campanhas concluídas e erros críticos.</p>
                </div>
                <Switch checked={notifSystem} onCheckedChange={setNotifSystem} />
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => toast.success("Preferências salvas!")}>
                  <Save className="w-4 h-4 mr-2" /> Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
