"use client"

import { useState } from "react"
import { Smartphone, Plus, QrCode, RefreshCw, LogOut, CheckCircle, Wifi, WifiOff } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function WhatsappClient({ initialAccounts, agents }: { initialAccounts: any[], agents: any[] }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Create Form State
  const [name, setName] = useState("")
  const [connectionType, setConnectionType] = useState("cloud_api")
  const [routingMode, setRoutingMode] = useState("human")
  const [selectedAgent, setSelectedAgent] = useState("")
  const [learningMode, setLearningMode] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")
      
      // Get the correct tenant_id for the current user
      const { data: tenants } = await supabase.from('tenants').select('id').eq('owner_id', user.id).limit(1)
      const tenantId = tenants?.[0]?.id
      if (!tenantId) throw new Error("Tenant não encontrado")

      const payload: any = {
        tenant_id: tenantId,
        name,
        connection_type: connectionType,
        routing_mode: routingMode,
        learning_mode: learningMode,
        // when creating a new connection, we simulate connecting
        status: 'connecting'
      }

      if (routingMode === 'ai_agent' && selectedAgent) {
        payload.agent_id = selectedAgent
      }

      const { error } = await supabase.from('whatsapp_accounts').insert([payload])

      if (error) throw error

      toast.success("Conta do WhatsApp adicionada com sucesso!")
      setIsCreateOpen(false)
      setName("")
      setConnectionType("cloud_api")
      setRoutingMode("human")
      setSelectedAgent("")
      setLearningMode(false)
      router.refresh()
    } catch (error: any) {
      toast.error("Erro ao adicionar conta", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500/15 text-green-600 hover:bg-green-500/25 dark:text-green-400 border-green-500/20"><Wifi className="w-3 h-3 mr-1" /> Conectado</Badge>
      case 'connecting':
        return <Badge variant="secondary" className="bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25 dark:text-yellow-400 border-yellow-500/20"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Conectando</Badge>
      case 'disconnected':
      case 'banned':
        return <Badge variant="destructive" className="bg-red-500/15 text-red-600 hover:bg-red-500/25 dark:text-red-400 border-red-500/20"><WifiOff className="w-3 h-3 mr-1" /> Desconectado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRoutingLabel = (mode: string) => {
    const modes: Record<string, string> = {
      human: "Humano",
      ai_agent: "Agente IA",
      hybrid: "Híbrido",
      flow: "Fluxo Automatizado"
    }
    return modes[mode] || mode
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas do WhatsApp</h1>
          <p className="text-muted-foreground">Conecte e gerencie seus números para atendimento e automação.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Conectar WhatsApp
            </Button>
          } />
          <DialogContent className="sm:max-w-[450px]">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Nova Conexão WhatsApp</DialogTitle>
                <DialogDescription>
                  Adicione um novo número para enviar e receber mensagens.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Identificação da Conta</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Suporte Principal" />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo de Conexão</Label>
                  <Select value={connectionType} onValueChange={(val) => val && setConnectionType(val)}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cloud_api">Cloud API Oficial (Recomendado)</SelectItem>
                      <SelectItem value="evolution">Evolution API (QR Code / Baileys)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="routing">Modo de Roteamento</Label>
                  <Select value={routingMode} onValueChange={(val) => val && setRoutingMode(val)}>
                    <SelectTrigger id="routing">
                      <SelectValue placeholder="Selecione o roteamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="human">Apenas Humanos</SelectItem>
                      <SelectItem value="ai_agent">Agente IA</SelectItem>
                      <SelectItem value="hybrid">Híbrido (IA + Humano)</SelectItem>
                      <SelectItem value="flow">Flow Builder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {routingMode === 'ai_agent' || routingMode === 'hybrid' ? (
                  <div className="grid gap-2">
                    <Label htmlFor="agent">Agente IA Responsável</Label>
                    <Select value={selectedAgent} onValueChange={(val) => val && setSelectedAgent(val)}>
                      <SelectTrigger id="agent">
                        <SelectValue placeholder="Selecione um agente" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}

                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <Label className="text-base">Modo de Aprendizado</Label>
                    <p className="text-sm text-muted-foreground">
                      A IA apenas observará humanos respondendo para treinar a bae.
                    </p>
                  </div>
                  <Switch checked={learningMode} onCheckedChange={setLearningMode} disabled={routingMode !== 'ai_agent' && routingMode !== 'hybrid'} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={loading}>{loading ? "Adicionando..." : "Prosseguir"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {initialAccounts.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Nenhuma conta conectada</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Você ainda não conectou nenhum número de WhatsApp à plataforma.
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>
            Conectar meu primeiro número
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {initialAccounts.map((account) => (
            <Card key={account.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    {account.name}
                  </CardTitle>
                  <div className="text-sm font-medium text-muted-foreground h-5">
                    {account.phone_number ? `+${account.phone_number}` : "Aguardando sincronização"}
                  </div>
                </div>
                {getStatusBadge(account.status)}
              </CardHeader>
              <CardContent className="flex-1 py-4">
                
                {account.status === 'connecting' && account.connection_type === 'evolution' ? (
                   <div className="flex flex-col items-center justify-center py-6 border rounded-lg bg-muted/40 border-dashed">
                      <QrCode className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
                      <p className="text-sm font-medium">Buscando QR Code...</p>
                      <p className="text-xs text-muted-foreground text-center px-4 mt-1">Abra o WhatsApp no seu celular para escanear.</p>
                   </div>
                ) : (
                  <div className="grid grid-cols-2 gap-y-4 text-sm mt-2">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground mb-1">Conexão</span>
                      <span className="font-medium text-xs bg-secondary w-fit px-2 py-0.5 rounded-md">
                        {account.connection_type === 'cloud_api' ? 'Cloud API' : 'Evolution'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground mb-1">Roteamento</span>
                      <span className="font-medium">{getRoutingLabel(account.routing_mode)}</span>
                    </div>
                    
                    {account.agent && (
                      <div className="flex flex-col col-span-2">
                        <span className="text-muted-foreground mb-1">Agente Vinculado</span>
                        <span className="font-medium flex items-center">
                          <CheckCircle className="w-3 h-3 text-primary mr-1" />
                          {account.agent.name}
                        </span>
                      </div>
                    )}
                    
                    {account.learning_mode && (
                      <div className="flex flex-col col-span-2">
                        <span className="text-muted-foreground mb-1 text-yellow-600 dark:text-yellow-400 font-medium text-xs uppercase tracking-wider">Modo de Aprendizado Ativo</span>
                      </div>
                    )}
                  </div>
                )}
                
              </CardContent>
              <CardFooter className="pt-4 border-t flex gap-2">
                <Button variant="outline" className="flex-1" disabled={account.status === 'connecting'}>
                  Sincronizar
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <LogOut className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
