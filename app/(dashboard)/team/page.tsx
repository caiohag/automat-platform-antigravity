import { createClient } from "@/lib/supabase/server"
import { TeamClient } from "./team-client"

export default async function TeamPage() {
  const supabase = await createClient()

  const safeQuery = async (query: any) => {
    try {
      const { data, error } = await query
      if (error) { console.error("Query error:", error); return [] }
      return data || []
    } catch (err) { console.error("Query exception:", err); return [] }
  }

  const members = await safeQuery(
    supabase.from('team_members').select('*').order('created_at', { ascending: false })
  )

  return <TeamClient initialMembers={members} />
}
