"use client"

import { useState, useEffect, useRef } from "react"
import { Search, MoreVertical, Send, Paperclip, Phone, Bot, User, Filter, CheckCheck } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

export function ChatClient({ initialConversations }: { initialConversations: any[] }) {
  const [conversations, setConversations] = useState(initialConversations)
  const [selectedChat, setSelectedChat] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [filter, setFilter] = useState("open") // open, closed, all
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const filteredConversations = conversations.filter(c => {
    if (filter === "all") return true
    return c.status === filter
  })

  useEffect(() => {
    if (selectedChat) {
      // Fetch messages for selected chat
      const fetchMessages = async () => {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', selectedChat.id)
          .order('created_at', { ascending: true })
        
        if (data) setMessages(data)
      }
      fetchMessages()

      // Realtime subscription for new messages
      const channel = supabase.channel('realtime:messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedChat.id}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new])
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedChat, supabase])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedChat) return

    const messageText = newMessage
    setNewMessage("")

    // Optimistic UI updates could be added here
    await supabase.from('messages').insert([{
      conversation_id: selectedChat.id,
      sender_type: 'user', // Human agent
      direction: 'outbound',
      content: messageText,
      status: 'sent'
    }])

    // The realtime subscription will pick up the insertion
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] bg-background border rounded-lg overflow-hidden">
      
      {/* Left Column: Chat List */}
      <div className="w-80 border-r flex flex-col bg-muted/10">
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Conversas</h2>
            <Button variant="ghost" size="icon">
              <Filter className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar contatos..." className="pl-8 bg-background" />
          </div>
          <Tabs value={filter} onValueChange={setFilter} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="open">Abertas</TabsTrigger>
              <TabsTrigger value="closed">Fechadas</TabsTrigger>
              <TabsTrigger value="all">Todas</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground mt-10">
              Nenhuma conversa encontrada.
            </div>
          ) : (
            filteredConversations.map((chat) => (
              <div 
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={cn(
                  "p-4 border-b cursor-pointer hover:bg-accent/50 transition-colors flex gap-3",
                  selectedChat?.id === chat.id ? "bg-accent" : ""
                )}
              >
                <Avatar>
                  <AvatarFallback>{chat.contact?.name?.substring(0, 2).toUpperCase() || 'NA'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm truncate">{chat.contact?.name || chat.contact?.phone}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(chat.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground truncate flex-1">
                      {chat.contact?.phone}
                    </span>
                    {chat.unread_count > 0 && (
                      <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center p-0 px-1.5 text-[10px]">
                        {chat.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Middle Column: Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {selectedChat ? (
          <>
            {/* Chat Area Header */}
            <div className="h-16 border-b flex items-center justify-between px-6 bg-muted/5">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{selectedChat.contact?.name?.substring(0, 2).toUpperCase() || 'NA'}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedChat.contact?.name || "Desconhecido"}</h3>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>{selectedChat.contact?.phone}</span>
                    <span className="text-muted-foreground/30">•</span>
                    <span className={selectedChat.status === 'open' ? "text-green-500" : ""}>
                      {selectedChat.status === 'open' ? 'Aberto' : 'Fechado'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">Resolver</Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5 text-muted-foreground" />
                </Button>
              </div>
            </div>

            {/* Chat Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
                  <Bot className="w-10 h-10 opacity-20" />
                  <p className="text-sm">Iniciando conversa com {selectedChat.contact?.name}</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isOutbound = msg.direction === 'outbound'
                  return (
                    <div key={msg.id} className={cn("flex flex-col max-w-[75%]", isOutbound ? "ml-auto items-end" : "mr-auto items-start")}>
                      
                      <div className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1 mx-1">
                        {isOutbound ? (
                          msg.sender_type === 'agent' ? <><Bot className="w-3 h-3" /> IA Automação</> : <><User className="w-3 h-3" /> Humano</>
                        ) : selectedChat.contact?.name}
                      </div>

                      <div className={cn(
                        "px-4 py-2 rounded-2xl text-sm relative",
                        isOutbound 
                          ? "bg-primary text-primary-foreground rounded-tr-sm" 
                          : "bg-muted rounded-tl-sm"
                      )}>
                        {msg.content}
                      </div>
                      
                      <div className="text-[10px] text-muted-foreground mt-1 mx-1 flex items-center gap-1">
                        {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {isOutbound && <CheckCheck className={cn("w-3 h-3", msg.status === 'read' ? "text-blue-500" : "opacity-50")} />}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t bg-muted/5">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite uma mensagem..." 
                  className="flex-1"
                />
                <Button type="submit" size="icon" className="shrink-0" disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-lg font-medium">Selecione uma conversa</p>
            <p className="text-sm">Escolha um contato na lista para iniciar o atendimento</p>
          </div>
        )}
      </div>

      {/* Right Column: Contact Detail */}
      {selectedChat && (
        <div className="w-72 border-l bg-muted/5 flex flex-col hidden lg:flex">
          <div className="h-16 border-b flex items-center px-4 font-semibold text-sm">
            Detalhes do Contato
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="flex flex-col items-center mb-6">
              <Avatar className="w-20 h-20 mb-3">
                <AvatarFallback className="text-2xl">{selectedChat.contact?.name?.substring(0, 2).toUpperCase() || 'NA'}</AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-lg text-center leading-tight">{selectedChat.contact?.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{selectedChat.contact?.phone}</p>
            </div>

            <Separator className="my-4" />

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-muted-foreground block mb-1">Tags</span>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="font-normal text-xs">Lead</Badge>
                  <Badge variant="outline" className="font-normal text-xs">Vip</Badge>
                  <Badge variant="outline" className="font-normal text-xs bg-primary/10 text-primary border-primary/20">+ Add</Badge>
                </div>
              </div>
              
              <div>
                <span className="text-muted-foreground block mb-1">E-mail</span>
                <div className="font-medium truncate">{selectedChat.contact?.email || 'Não informado'}</div>
              </div>

              <div>
                <span className="text-muted-foreground block mb-1">Criado em</span>
                <div className="font-medium">
                  {selectedChat.contact?.created_at ? new Date(selectedChat.contact.created_at).toLocaleDateString('pt-BR') : '-'}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
