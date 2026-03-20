"use client"

import { useState } from "react"
import { Building, Plus, Search, MoreVertical, Edit2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function AccountsClient({ initialTenants }: { initialTenants: any[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<any>(null)
  
  // Create Form State
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [document, setDocument] = useState("")
  const [maxAccounts, setMaxAccounts] = useState("1")

  // Edit Form State
  const [editName, setEditName] = useState("")
  const [editDomain, setEditDomain] = useState("")
  const [editMaxAccounts, setEditMaxAccounts] = useState("1")
  const [editIsActive, setEditIsActive] = useState(true)

  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const filteredTenants = initialTenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.domain && t.domain.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")

      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000)
      
      const { error } = await supabase.from('tenants').insert([{
        name,
        slug,
        owner_id: user.id,
        max_whatsapp_accounts: parseInt(maxAccounts) || 1
      }])

      if (error) throw error

      toast.success("Cliente criado com sucesso!")
      setIsCreateOpen(false)
      setName("")
      setEmail("")
      setPhone("")
      setDocument("")
      setMaxAccounts("1")
      router.refresh()
    } catch (error: any) {
      toast.error("Erro ao criar cliente", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleEditOpen = (tenant: any) => {
    setSelectedTenant(tenant)
    setEditName(tenant.name)
    setEditDomain(tenant.domain || "")
    setEditMaxAccounts(tenant.max_whatsapp_accounts?.toString() || "1")
    setEditIsActive(tenant.is_active)
    setIsEditOpen(true)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('tenants').update({
        name: editName,
        domain: editDomain,
        max_whatsapp_accounts: parseInt(editMaxAccounts) || 1,
        is_active: editIsActive
      }).eq('id', selectedTenant.id)

      if (error) throw error

      toast.success("Cliente atualizado com sucesso!")
      setIsEditOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error("Erro ao atualizar cliente", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas / Clientes</h1>
          <p className="text-muted-foreground">Gerencie seus sub-tenants e clientes white-label.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Criar Novo Cliente</DialogTitle>
                <DialogDescription>
                  Adicione um novo cliente e defina seus limites de uso.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome da Empresa</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Acme Corp" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contato@acme.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 90000-0000" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="doc">CNPJ/CPF</Label>
                    <Input id="doc" value={document} onChange={e => setDocument(e.target.value)} placeholder="00.000.000/0000-00" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="limit">Limite Contas WhatsApp</Label>
                  <Input id="limit" type="number" min="1" value={maxAccounts} onChange={e => setMaxAccounts(e.target.value)} required />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={loading}>{loading ? "Criando..." : "Criar Cliente"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Buscar por nome ou domínio..." 
            className="pl-8" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredTenants.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <Building className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Nenhum cliente encontrado</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Você ainda não possui clientes white-label ou nenhum resultado foi encontrado para sua busca.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTenants.map((tenant) => (
            <Card key={tenant.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{tenant.name}</CardTitle>
                  <div className="text-sm text-muted-foreground">{tenant.domain || 'Sem domínio'}</div>
                </div>
                <Badge variant={tenant.is_active ? 'default' : 'secondary'} className={tenant.is_active ? 'bg-green-500/15 text-green-600 hover:bg-green-500/25 dark:text-green-400' : ''}>
                  {tenant.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </CardHeader>
              <CardContent className="flex-1 py-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground mb-1">Criação</span>
                    <span className="font-medium">{new Date(tenant.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground mb-1">Plano</span>
                    <span className="font-medium capitalize">{tenant.plan || 'Free'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground mb-1">Agentes IA</span>
                    <span className="font-medium">{tenant.agents?.[0]?.count || 0} / {tenant.max_agents || 1}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground mb-1">WhatsApp</span>
                    <span className="font-medium">{tenant.whatsapp_accounts?.[0]?.count || 0} / {tenant.max_whatsapp_accounts || 1}</span>
                  </div>
                </div>
              </CardContent>
              <div className="p-4 pt-0 mt-auto">
                <Button variant="outline" className="w-full" onClick={() => handleEditOpen(tenant)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Editar Conta
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
              <DialogDescription>
                Atualize os dados e limites desta conta.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nome da Empresa</Label>
                <Input id="edit-name" value={editName} onChange={e => setEditName(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-domain">Domínio Personalizado</Label>
                <Input id="edit-domain" value={editDomain} onChange={e => setEditDomain(e.target.value)} placeholder="app.cliente.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-limit">Limite Contas WhatsApp</Label>
                <Input id="edit-limit" type="number" min="1" value={editMaxAccounts} onChange={e => setEditMaxAccounts(e.target.value)} required />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <Label>Status da Conta</Label>
                  <p className="text-sm text-muted-foreground">
                    Bloquear o acesso desativando a conta
                  </p>
                </div>
                <Switch 
                  checked={editIsActive} 
                  onCheckedChange={setEditIsActive} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar Alterações"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
