"use client"

import { useState } from "react"
import { Plus, GripVertical, Trash2, Edit2, Columns3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function PipelineClient({ initialStages }: { initialStages: any[] }) {
  const [stages, setStages] = useState(initialStages)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [name, setName] = useState("")
  const [color, setColor] = useState("#3b82f6") // Default blue
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")
      
      const { data: tenants } = await supabase.from('tenants').select('id').eq('owner_id', user.id).limit(1)
      const tenantId = tenants?.[0]?.id
      if (!tenantId) throw new Error("Tenant não encontrado")

      const nextOrder = stages.length > 0 ? Math.max(...stages.map(s => s.order_index)) + 1 : 0

      const { error } = await supabase.from('pipeline_stages').insert([{
        tenant_id: tenantId,
        name,
        color,
        order_index: nextOrder
      }])

      if (error) throw error

      toast.success("Estágio criado com sucesso!")
      setIsCreateOpen(false)
      setName("")
      setColor("#3b82f6")
      router.refresh()
    } catch (error: any) {
      toast.error("Erro ao criar estágio", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este estágio? Os leads ativos precisarão ser movidos.")) return
    
    try {
      const { error } = await supabase.from('pipeline_stages').delete().eq('id', id)
      if (error) throw error
      toast.success("Estágio removido!")
      router.refresh()
    } catch (error: any) {
      toast.error("Erro ao remover", { description: error.message })
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estágios do Funil</h1>
          <p className="text-muted-foreground">Configure as etapas de negociação para o seu CRM Kanban.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Estágio
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Adicionar Estágio</DialogTitle>
                <DialogDescription>
                  Crie uma nova coluna para organizar seus leads no funil de vendas.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome do Estágio</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Qualificação, Proposta Enviada" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="color">Cor da Coluna</Label>
                  <div className="flex gap-2 items-center">
                    <Input id="color" type="color" className="w-14 h-10 p-1" value={color} onChange={e => setColor(e.target.value)} />
                    <Input value={color} onChange={e => setColor(e.target.value)} placeholder="#000000" className="uppercase font-mono" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={loading}>{loading ? "Adicionando..." : "Criar Estágio"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Columns3 className="w-5 h-5" />
            Estrutura do Funil
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {stages.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              Você ainda não configurou nenhum estágio. Crie o primeiro estágio do seu funil comercial.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {stages.map((stage) => (
                <div key={stage.id} className="flex items-center justify-between p-4 bg-muted/5 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab opacity-50 hover:opacity-100" />
                    <div 
                      className="w-4 h-4 rounded-full border shadow-sm" 
                      style={{ backgroundColor: stage.color || '#ccc' }} 
                    />
                    <div className="font-medium text-base">{stage.name}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(stage.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
