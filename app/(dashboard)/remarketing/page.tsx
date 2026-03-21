import { createClient } from "@/lib/supabase/server"
import { RemarketingClient } from "./remarketing-client"

export default async function RemarketingPage() {
  const supabase = await createClient()

  const safeQuery = async (query: any) => {
    try {
      const { data, error } = await query
      if (error) {
        console.error("Query error:", error)
        return []
      }
      return data || []
    } catch (err) {
      console.error("Query exception:", err)
      return []
    }
  }

  const campaigns = await safeQuery(
    supabase
      .from('campaigns')
      .select('*')
      .eq('campaign_type', 'remarketing')
      .order('created_at', { ascending: false })
  )

  const accounts = await safeQuery(
    supabase
      .from('whatsapp_accounts')
      .select('id, name, phone_number, status')
      .eq('status', 'connected')
  )

  return (
    <div className="flex-1 space-y-4">
      <RemarketingClient initialCampaigns={campaigns} accounts={accounts} />
    </div>
  )
}
