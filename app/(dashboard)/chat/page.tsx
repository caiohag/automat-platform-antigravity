import { createClient } from "@/lib/supabase/server"
import { ChatClient } from "./chat-client"

export default async function ChatPage() {
  const supabase = await createClient()

  // Fetch initial conversations with contact info
  const { data: conversations } = await supabase
    .from('conversations')
    .select(`*, contact:contacts(*)`)
    .order('updated_at', { ascending: false })

  return <ChatClient initialConversations={conversations || []} />
}
