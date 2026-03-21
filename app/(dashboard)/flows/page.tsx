import { createClient } from "@/lib/supabase/server"
import { FlowsClient } from "./flows-client"

export default async function FlowsPage() {
  const supabase = await createClient()

  const safeQuery = async (query: any) => {
    try {
      const { data, error } = await query
      if (error) { console.error("Query error:", error); return [] }
      return data || []
    } catch (err) { console.error("Query exception:", err); return [] }
  }

  const flows = await safeQuery(
    supabase.from('flows').select('*').order('created_at', { ascending: false })
  )
  const accounts = await safeQuery(
    supabase.from('whatsapp_accounts').select('id, name, phone_number').eq('status', 'connected')
  )

  return <FlowsClient initialFlows={flows} accounts={accounts} />
}
