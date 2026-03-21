'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

export async function toggleAgentStatus(agentId: string, isActive: boolean) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Não autorizado' }
    }

    const { error } = await supabase
      .from('agents')
      .update({ is_active: isActive })
      .eq('id', agentId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/agents')
    revalidatePath(`/agents/${agentId}`)

    return { success: true }
  } catch (error) {
    console.error('[agents/actions] toggleAgentStatus error:', error)
    return { success: false, error: 'Erro interno ao atualizar status' }
  }
}
