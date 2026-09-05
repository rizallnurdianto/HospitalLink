import { supabase } from "../lib/supabase"
import type { Message, MessageHospital, UserRole } from "../types/db"

const SELECT =
  "id, conversation_id, sender_id, sender_role, body, hospital_id, created_at, hospital:hospitals(id, slug, name, location, image_url, type, is_open_24h)"

export async function listMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(SELECT)
    .eq("conversation_id", conversationId)
    .order("created_at")
  if (error) throw error
  return (data ?? []) as unknown as Message[]
}

export async function sendMessage(args: {
  conversationId: string
  senderId: string
  senderRole: UserRole
  body: string
  hospitalId?: string | null
}): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: args.conversationId,
      sender_id: args.senderId,
      sender_role: args.senderRole,
      body: args.body.trim(),
      hospital_id: args.hospitalId ?? null,
    })
    .select(SELECT)
    .single()
  if (error) throw error
  return data as unknown as Message
}

/** Ambil kartu hospital untuk pesan yang diterima lewat realtime (tidak ada join). */
export async function getMessageHospital(
  hospitalId: string,
): Promise<MessageHospital | null> {
  const { data, error } = await supabase
    .from("hospitals")
    .select("id, slug, name, location, image_url, type, is_open_24h")
    .eq("id", hospitalId)
    .maybeSingle()
  if (error) return null
  return data as MessageHospital ?? null
}

/** Subscribe ke pesan baru dalam satu conversation. Mengembalikan fungsi unsubscribe. */
export function subscribeToMessages(
  conversationId: string,
  onInsert: (message: Message) => void,
): () => void {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onInsert(payload.new as Message),
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
