import { getOpenAI } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { agentId, message, history = [] } = await req.json()

    if (!agentId || !message) {
      return NextResponse.json({ error: 'agentId e message são obrigatórios' }, { status: 400 })
    }

    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (error || !agent) {
      return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 })
    }

    const completion = await getOpenAI().chat.completions.create({
      model: agent.model || 'gpt-4o',
      temperature: agent.temperature ?? 0.7,
      max_tokens: 500,
      messages: [
        { role: 'system', content: agent.system_prompt || 'Você é um assistente útil.' },
        ...history,
        { role: 'user', content: message },
      ],
    })

    return NextResponse.json({
      response: completion.choices[0].message.content,
    })
  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
