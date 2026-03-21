import { createClient } from "@/lib/supabase/server"
import { SchedulesClient } from "./schedules-client"

export default async function SchedulesPage() {
  const supabase = await createClient()

  const safeQuery = async (query: any) => {
    try {
      const { data, error } = await query
      if (error) { console.error("Query error:", error); return [] }
      return data || []
    } catch (err) { console.error("Query exception:", err); return [] }
  }

  const schedules = await safeQuery(
    supabase
      .from('schedules')
      .select('*, contacts(name, phone_number)')
      .order('scheduled_at', { ascending: true })
  )
  const contacts = await safeQuery(
    supabase.from('contacts').select('id, name, phone_number').order('name')
  )

  return <SchedulesClient initialSchedules={schedules} contacts={contacts} />
}
