import { createClient } from "@/lib/supabase/server"
import { WhatsappClient } from "./whatsapp-client"

export default async function WhatsappPage() {
  const supabase = await createClient()

  // Fetch accounts with related agent names if any
  const { data: accounts } = await supabase
    .from('whatsapp_accounts')
    .select(`*, agent:agents(id, name)`)
    .order('created_at', { ascending: false })

  // Fetch active agents for the dropdown when selecting AI Agent routing
  const { data: agents } = await supabase
    .from('agents')
    .select('id, name')
    .eq('is_active', true)

  return <WhatsappClient initialAccounts={accounts || []} agents={agents || []} />
}
