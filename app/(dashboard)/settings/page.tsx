import { createClient } from "@/lib/supabase/server"
import { SettingsClient } from "./settings-client"

export default async function SettingsPage() {
  const supabase = await createClient()

  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (!error) user = data.user
  } catch (err) { console.error("Auth error:", err) }

  return <SettingsClient user={user} />
}
