import { createClient } from "@/lib/supabase/server"
import { SubscriptionClient } from "./subscription-client"

export default async function SubscriptionPage() {
  const supabase = await createClient()

  const safeQuery = async (query: any) => {
    try {
      const { data, error } = await query
      if (error) { console.error("Query error:", error); return null }
      return data
    } catch (err) { console.error("Query exception:", err); return null }
  }

  const safeCount = async (query: any): Promise<number> => {
    try {
      const { count, error } = await query
      if (error) { console.error("Count error:", error); return 0 }
      return count || 0
    } catch (err) { console.error("Count exception:", err); return 0 }
  }

  const subscription = await safeQuery(
    supabase.from('subscriptions').select('*').limit(1).single()
  )

  const agentsCount = await safeCount(supabase.from('agents').select('*', { count: 'exact', head: true }))
  const whatsappCount = await safeCount(supabase.from('whatsapp_accounts').select('*', { count: 'exact', head: true }))
  const membersCount = await safeCount(supabase.from('team_members').select('*', { count: 'exact', head: true }))
  const messagesUsed = await safeCount(supabase.from('messages').select('*', { count: 'exact', head: true }))

  const usage = { agentsCount, whatsappCount, membersCount, messagesUsed }

  return <SubscriptionClient subscription={subscription} usage={usage} />
}
