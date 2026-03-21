import { NextRequest, NextResponse } from 'next/server'

import { openai } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'

type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { agentId, message, history = [] } = await req.json()

    if (!agentId || !message) {
      return NextResponse.json(
        { error: 'agentId e message são obrigatórios' },
        { status: 400 },
      )
    }

    const sanitizedHistory: ChatMessage[] = Array.isArray(history)
      ? history
          .filter(
            (item): item is ChatMessage =>
              item &&
              typeof item === 'object' &&
              (item.role === 'user' || item.role === 'assistant' || item.role === 'system') &&
              typeof item.content === 'string',
          )
          .slice(-20)
      : []

    const { data: agent, error } = await supabase
      .from('agents')
      .select('system_prompt, model, temperature')
      .eq('id', agentId)
      .single()

    if (error || !agent) {
      return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 })
    }

    const completion = await openai.chat.completions.create({
      model: agent.model || 'gpt-4o',
      temperature: agent.temperature ?? 0.7,
      max_tokens: 500,
      messages: [
        { role: 'system', content: agent.system_prompt || 'Você é um assistente útil.' },
        ...sanitizedHistory,
        { role: 'user', content: message },
      ],
    })

    return NextResponse.json({
      response: completion.choices[0]?.message?.content || '',
    })
  } catch (err) {
    console.error('[chat/route] error:', err)
    return NextResponse.json(
      { error: 'Erro interno ao processar mensagem' },
      { status: 500 },
    )
  }
}
