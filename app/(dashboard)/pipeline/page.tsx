import { createClient } from "@/lib/supabase/server"
import { PipelineClient } from "./pipeline-client"

export default async function PipelinePage() {
  const supabase = await createClient()

  const { data: stages } = await supabase
    .from('pipeline_stages')
    .select('*')
    .order('order_index', { ascending: true })

  return <PipelineClient initialStages={stages || []} />
}
