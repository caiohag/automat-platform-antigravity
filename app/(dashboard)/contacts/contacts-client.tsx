"use client"

import { useState } from "react"
import { Search, Plus, Filter, MoreHorizontal, User, Mail, Phone, Tag, Calendar, Download } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function ContactsClient({ initialContacts }: { initialContacts: any[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<any>(null)
  
  // Create Form State
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [tagsInput, setTagsInput] = useState("")
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const filteredContacts = initialContacts.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone?.includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
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

      const { error } = await supabase.from('contacts').insert([{
        tenant_id: tenantId,
        name,
        phone,
        email,
        tags
      }])

      if (error) throw error

      toast.success("Contato adicionado com sucesso!")
      setIsCreateOpen(false)
      setName("")
      setPhone("")
      setEmail("")
      setTagsInput("")
      router.refresh()
    } catch (error: any) {
      toast.error("Erro ao criar contato", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contatos</h1>
          <p className="text-muted-foreground">Gerencie sua base de clientes, leads e pessoas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger render={
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Contato
              </Button>
            } />
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Adicionar Contato</DialogTitle>
                  <DialogDescription>
                    Cadastre um novo número ou lead na plataforma manualmente.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: João da Silva" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Telefone (WhatsApp)</Label>
                    <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="5511999999999" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="joao@exemplo.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                    <Input id="tags" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="Lead, Vip, Cliente" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome, número ou email..." 
            className="pl-8" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contato</TableHead>
              <TableHead>Telefone / WhatsApp</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Nenhum contato encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{contact.name?.substring(0, 2).toUpperCase() || 'NA'}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{contact.name || 'Desconhecido'}</span>
                        <span className="text-xs text-muted-foreground">{contact.email || 'Sem email'}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{contact.phone || 'Sem telefone'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {contact.tags && Array.isArray(contact.tags) ? (
                        contact.tags.map((tag: string, i: number) => (
                          <Badge key={i} variant="secondary" className="font-normal text-xs">{tag}</Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(contact.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Sheet>
                      <SheetTrigger render={
                        <Button variant="ghost" size="sm" onClick={() => setSelectedContact(contact)}>
                          Ver Detalhes
                        </Button>
                      } />
                      <SheetContent className="w-[400px] sm:w-[540px]">
                        <SheetHeader>
                          <SheetTitle>Detalhes do Contato</SheetTitle>
                          <SheetDescription>
                            Informações completas e histórico deste contato.
                          </SheetDescription>
                        </SheetHeader>
                        <div className="py-6 space-y-6">
                          <div className="flex flex-col items-center">
                            <Avatar className="w-24 h-24 mb-4">
                              <AvatarFallback className="text-3xl">{selectedContact?.name?.substring(0, 2).toUpperCase() || 'NA'}</AvatarFallback>
                            </Avatar>
                            <h2 className="text-2xl font-bold">{selectedContact?.name}</h2>
                            <p className="text-muted-foreground">{selectedContact?.phone}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <Card>
                              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <Mail className="w-5 h-5 text-muted-foreground mb-2" />
                                <span className="text-sm font-medium">E-mail</span>
                                <span className="text-xs text-muted-foreground truncate w-full" title={selectedContact?.email}>{selectedContact?.email || 'Nenhum'}</span>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <Calendar className="w-5 h-5 text-muted-foreground mb-2" />
                                <span className="text-sm font-medium">Cliente desde</span>
                                <span className="text-xs text-muted-foreground">{selectedContact?.created_at ? new Date(selectedContact.created_at).toLocaleDateString('pt-BR') : '-'}</span>
                              </CardContent>
                            </Card>
                          </div>

                          <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                              <Tag className="w-4 h-4" />
                              Tags de Segmentação
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {selectedContact?.tags && Array.isArray(selectedContact.tags) && selectedContact.tags.length > 0 ? (
                                selectedContact.tags.map((tag: string, i: number) => (
                                  <Badge key={i} variant="secondary">{tag}</Badge>
                                ))
                              ) : (
                                <span className="text-muted-foreground text-sm">Nenhuma tag atribuída.</span>
                              )}
                              <Badge variant="outline" className="border-dashed cursor-pointer hover:bg-muted text-muted-foreground">+ Add Tag</Badge>
                            </div>
                          </div>
                          
                          <div className="pt-4 border-t flex justify-end gap-2">
                             <Button variant="outline" onClick={() => window.location.href = '/chat'}>
                               Abrir no Chat
                             </Button>
                             <Button>Editar Contato</Button>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
