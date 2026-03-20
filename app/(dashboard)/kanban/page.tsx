import { createClient } from "@/lib/supabase/server"
import { KanbanClient } from "./kanban-client"

export default async function KanbanPage() {
  const supabase = await createClient()

  // Fetch stages
  const { data: stages } = await supabase
    .from('pipeline_stages')
    .select('*')
    .order('order_index', { ascending: true })

  // Fetch leads with contact
  const { data: leads } = await supabase
    .from('leads')
    .select('*, contact:contacts(*)')
    .order('created_at', { ascending: false })

  return <KanbanClient initialStages={stages || []} initialLeads={leads || []} />
}
