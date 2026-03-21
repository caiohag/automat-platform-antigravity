import { createClient } from "@/lib/supabase/server"
import { WhiteLabelClient } from "./white-label-client"

export default async function WhiteLabelPage() {
  const supabase = await createClient()

  let tenant = null
  try {
    const { data: member } = await supabase.from('team_members').select('tenant_id').limit(1).single()
    if (member?.tenant_id) {
      const { data, error } = await supabase.from('tenants').select('*').eq('id', member.tenant_id).single()
      if (!error) tenant = data
    }
  } catch (err) { console.error("Tenant query error:", err) }

  return <WhiteLabelClient tenant={tenant} />
}
