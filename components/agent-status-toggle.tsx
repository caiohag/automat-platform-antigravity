'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { toggleAgentStatus } from '@/app/(dashboard)/agents/actions'
import { Switch } from '@/components/ui/switch'

export function AgentStatusToggle({
  agentId,
  initialActive,
}: {
  agentId: string
  initialActive: boolean
}) {
  const [active, setActive] = useState(initialActive)
  const [isPending, startTransition] = useTransition()

  const onToggle = (nextChecked: boolean) => {
    const previous = active
    setActive(nextChecked)

    startTransition(async () => {
      const result = await toggleAgentStatus(agentId, nextChecked)

      if (!result.success) {
        setActive(previous)
        toast.error(result.error || 'Não foi possível atualizar o status')
        return
      }

      toast.success(nextChecked ? 'Agente ativado' : 'Agente desativado')
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Switch checked={active} onCheckedChange={onToggle} disabled={isPending} />
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      ) : (
        <span className="text-xs text-muted-foreground">{active ? 'Ativo' : 'Inativo'}</span>
      )}
    </div>
  )
}
