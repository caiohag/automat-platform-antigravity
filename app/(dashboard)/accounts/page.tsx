import { createClient } from "@/lib/supabase/server"
import { AccountsClient } from "./accounts-client"

export default async function AccountsPage() {
  const supabase = await createClient()

  // Fetch tenants with counts
  const { data: tenants } = await supabase
    .from('tenants')
    .select(`
      *,
      agents:agents(count),
      whatsapp_accounts:whatsapp_accounts(count)
    `)
    .order('created_at', { ascending: false })

  return <AccountsClient initialTenants={tenants || []} />
}
