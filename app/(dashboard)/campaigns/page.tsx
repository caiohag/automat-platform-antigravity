import { createClient } from "@/lib/supabase/server"
import { CampaignsClient } from "./campaigns-client"

export default async function CampaignsPage() {
  const supabase = await createClient()

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*, account:whatsapp_accounts(name)')
    .order('created_at', { ascending: false })

  const { data: accounts } = await supabase
    .from('whatsapp_accounts')
    .select('id, name')
    .eq('status', 'connected')

  return <CampaignsClient initialCampaigns={campaigns || []} accounts={accounts || []} />
}
