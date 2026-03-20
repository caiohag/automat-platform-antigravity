"use client"

import { useState } from "react"
import { Search, Plus, Filter, MoreHorizontal, User, Calendar, DollarSign } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function KanbanClient({ initialStages, initialLeads }: { initialStages: any[], initialLeads: any[] }) {
  const [stages, setStages] = useState(initialStages)
  const [leads, setLeads] = useState(initialLeads)
  const [searchTerm, setSearchTerm] = useState("")

  const supabase = createClient()

  const filteredLeads = leads.filter(l => 
    l.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault() // Necessary to allow dropping
  }

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData("leadId")
    if (!leadId) return

    const lead = leads.find(l => l.id === leadId)
    if (!lead || lead.pipeline_stage_id === stageId) return

    // Optimistic update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, pipeline_stage_id: stageId } : l))

    try {
      const { error } = await supabase
        .from('leads')
        .update({ pipeline_stage_id: stageId })
        .eq('id', leadId)

      if (error) throw error
    } catch (error: any) {
      toast.error("Erro ao mover lead", { description: error.message })
      // Revert optimism if failed
      setLeads(initialLeads)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kanban de Vendas</h1>
          <p className="text-muted-foreground">Gerencie suas oportunidades de negócio em tempo real.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar leads..." 
              className="pl-8 w-[200px]" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Oportunidade
          </Button>
        </div>
      </div>

      {stages.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed flex-1">
          <h2 className="text-xl font-semibold mb-2">Nenhum estágio configurado</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Você precisa criar estágios no funil de vendas antes de gerenciar oportunidades no Kanban.
          </p>
          <Button onClick={() => window.location.href = '/pipeline'}>
            Configurar Funil
          </Button>
        </Card>
      ) : (
        <ScrollArea className="flex-1 w-full whitespace-nowrap rounded-lg border bg-muted/10 p-4">
          <div className="flex gap-4 h-full">
            {stages.map((stage) => {
              const stageLeads = filteredLeads.filter(l => l.pipeline_stage_id === stage.id)
              
              return (
                <div 
                  key={stage.id} 
                  className="flex flex-col w-[320px] shrink-0 h-full"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  <div className="flex items-center justify-between bg-card p-3 rounded-t-lg border-x border-t shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color || '#ccc' }} />
                      <h3 className="font-semibold text-sm">{stage.name}</h3>
                      <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                        {stageLeads.length}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                  
                  <div className="flex-1 bg-muted/30 border-x border-b rounded-b-lg p-2 overflow-y-auto space-y-2 pb-4 flex flex-col min-h-[150px]">
                    {stageLeads.map((lead) => (
                      <Card 
                        key={lead.id} 
                        className="cursor-move hover:ring-1 hover:ring-primary shadow-sm"
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-sm whitespace-normal leading-tight line-clamp-2">
                              {lead.title || `Oportunidade de ${lead.contact?.name}`}
                            </h4>
                            <DropdownMenu>
                              <DropdownMenuTrigger render={
                                <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1">
                                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                </Button>
                              } />
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Editar</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          {lead.contact && (
                            <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                              <Avatar className="w-5 h-5">
                                <AvatarFallback className="text-[10px]">
                                  {lead.contact.name?.substring(0, 2).toUpperCase() || 'NA'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">{lead.contact.name}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 border-t pt-2">
                            <div className="flex items-center gap-1 font-medium text-foreground">
                              {lead.value ? (
                                <>
                                  <DollarSign className="w-3.5 h-3.5 text-green-600 dark:text-green-500" />
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value)}
                                </>
                              ) : 'Sem valor'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 opacity-70" />
                              {new Date(lead.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {stageLeads.length === 0 && (
                      <div className="p-4 text-center border-2 border-dashed border-muted-foreground/20 rounded-lg text-muted-foreground text-xs m-2">
                        Arraste cards para cá
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  )
}
