"use client"

import { useState } from "react"
import { Search, Plus, Filter, Tag, LayoutTemplate, RefreshCw, CheckCircle, Clock, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
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

export function TemplatesClient({ initialTemplates }: { initialTemplates: any[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  
  // Create Form State
  const [name, setName] = useState("")
  const [category, setCategory] = useState("marketing")
  const [language, setLanguage] = useState("pt_BR")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const filteredTemplates = initialTemplates.filter(t => 
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.content?.toLowerCase().includes(searchTerm.toLowerCase())
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

      // Simulando aprovação da Meta apenas para demonstração (geralmente vai para pending)
      const mockStatus = Math.random() > 0.5 ? 'approved' : 'pending'

      const { error } = await supabase.from('templates').insert([{
        tenant_id: tenantId,
        name: name.toLowerCase().replace(/\s+/g, '_'),
        category,
        language,
        content,
        status: mockStatus,
      }])

      if (error) throw error

      toast.success("Template salvo com sucesso!")
      setIsCreateOpen(false)
      setName("")
      setCategory("marketing")
      setLanguage("pt_BR")
      setContent("")
      router.refresh()
    } catch (error: any) {
      toast.error("Erro ao criar template", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved': return <Badge className="bg-green-500/15 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1"/> Aprovado</Badge>
      case 'pending': return <Badge variant="secondary" className="bg-yellow-500/15 text-yellow-600 border-yellow-500/20"><Clock className="w-3 h-3 mr-1"/> Em Análise</Badge>
      case 'rejected': return <Badge variant="destructive" className="bg-red-500/15 text-red-600 border-red-500/20"><XCircle className="w-3 h-3 mr-1"/> Rejeitado</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const getCategoryLabel = (cat: string) => {
    const cats: Record<string, string> = {
      marketing: "Marketing",
      utility: "Utilidade",
      authentication: "Autenticação",
      service: "Serviço"
    }
    return cats[cat] || cat
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates WhatsApp</h1>
          <p className="text-muted-foreground">Gerencie templates de mensagens pré-aprovadas (HSM) pela Meta.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sincronizar Meta
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger render={
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Template
              </Button>
            } />
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Criar Novo Template (HSM)</DialogTitle>
                  <DialogDescription>
                    Crie um modelo de mensagem estruturado para envio massivo ou automações ativas. O template passará por aprovação da Meta.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome do Template</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="promocao_black_friday" />
                    <span className="text-xs text-muted-foreground">O nome deve conter apenas letras minúsculas e underlines.</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select value={category} onValueChange={(val) => val && setCategory(val)}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="utility">Utilidade</SelectItem>
                          <SelectItem value="authentication">Autenticação</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lang">Idioma</Label>
                      <Select value={language} onValueChange={(val) => val && setLanguage(val)}>
                        <SelectTrigger id="lang">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt_BR">Português (BR)</SelectItem>
                          <SelectItem value="en_US">Inglês (US)</SelectItem>
                          <SelectItem value="es_ES">Espanhol (ES)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="content">Corpo da Mensagem</Label>
                    <Textarea 
                      id="content" 
                      rows={4} 
                      value={content} 
                      onChange={e => setContent(e.target.value)} 
                      required 
                      placeholder="Olá {{1}}, confira nossa nova promoção acessando o link: {{2}}" 
                    />
                    <div className="text-xs text-muted-foreground">
                      Use chaves duplas numeradas <span className="font-mono bg-muted px-1 py-0.5 rounded">{'{{1}}'}</span> para variáveis.
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={loading}>{loading ? "Enviando..." : "Submeter para Aprovação"}</Button>
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
            placeholder="Buscar templates por nome ou conteúdo..." 
            className="pl-8" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {filteredTemplates.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <LayoutTemplate className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Nenhum template encontrado</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Você ainda não possui templates de mensagens aprovados pela Meta.
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>Criar meu primeiro template</Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base truncate" title={template.name}>{template.name}</CardTitle>
                  <div className="text-xs font-medium text-muted-foreground">
                    {getCategoryLabel(template.category)} • {template.language}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 py-4">
                <div className="p-3 bg-muted/30 rounded-md border text-sm text-foreground mb-4 min-h-[100px] whitespace-pre-wrap">
                  {template.content}
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                  {getStatusBadge(template.status)}
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(template.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
