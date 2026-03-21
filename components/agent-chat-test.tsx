'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, Loader2, SendHorizontal, Trash2, UserRound } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export function AgentChatTest({
  agentId,
  agentName,
}: {
  agentId: string
  agentName: string
}) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const sendMessage = async () => {
    const content = input.trim()
    if (!content || isLoading) return

    const nextMessages = [...messages, { role: 'user' as const, content }]
    setMessages(nextMessages)
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          message: content,
          history: messages.map((item) => ({ role: item.role, content: item.content })),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Erro ao enviar mensagem')
        setMessages(messages)
        return
      }

      const assistantReply = typeof result.response === 'string' ? result.response : ''
      setMessages((prev) => [...prev, { role: 'assistant', content: assistantReply }])
    } catch (error) {
      console.error('[agent-chat-test] error:', error)
      toast.error('Não foi possível enviar a mensagem')
      setMessages(messages)
    } finally {
      setIsLoading(false)
    }
  }

  const clearConversation = () => {
    setMessages([])
    setInput('')
  }

  return (
    <div className="flex h-[560px] flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-primary/10 p-1.5">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{agentName}</p>
            <p className="text-xs text-muted-foreground">Chat de teste</p>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={clearConversation}>
          <Trash2 className="mr-2 h-4 w-4" />
          Limpar conversa
        </Button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Envie uma mensagem para testar o comportamento do agente.
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex max-w-[85%] items-start gap-2 ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div className="rounded-full bg-muted p-1.5">
                {message.role === 'user' ? (
                  <UserRound className="h-3.5 w-3.5" />
                ) : (
                  <Bot className="h-3.5 w-3.5 text-primary" />
                )}
              </div>

              <div
                className={`rounded-2xl px-3 py-2 text-sm ${
                  message.role === 'user'
                    ? 'rounded-br-sm bg-primary text-primary-foreground'
                    : 'rounded-bl-sm bg-muted text-foreground'
                }`}
              >
                {message.content}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Digitando...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3">
        <div className="flex gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void sendMessage()
              }
            }}
            disabled={isLoading}
          />
          <Button onClick={() => void sendMessage()} disabled={!input.trim() || isLoading}>
            <SendHorizontal className="mr-2 h-4 w-4" />
            Enviar
          </Button>
        </div>
      </div>
    </div>
  )
}
