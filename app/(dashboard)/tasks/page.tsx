import { createClient } from "@/lib/supabase/server"
import { TasksClient } from "./tasks-client"

export default async function TasksPage() {
  const supabase = await createClient()

  const safeQuery = async (query: any) => {
    try {
      const { data, error } = await query
      if (error) { console.error("Query error:", error); return [] }
      return data || []
    } catch (err) { console.error("Query exception:", err); return [] }
  }

  const tasks = await safeQuery(
    supabase.from('tasks').select('*, contacts(name), leads(title)').order('created_at', { ascending: false })
  )
  const contacts = await safeQuery(
    supabase.from('contacts').select('id, name').order('name')
  )
  const leads = await safeQuery(
    supabase.from('leads').select('id, title').order('title')
  )
  const members = await safeQuery(
    supabase.from('team_members').select('id, name, email').order('name')
  )

  return <TasksClient initialTasks={tasks} contacts={contacts} leads={leads} members={members} />
}
