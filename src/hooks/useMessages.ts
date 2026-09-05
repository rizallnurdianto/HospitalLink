import { useCallback, useEffect, useState } from "react"
import {
  getMessageHospital,
  listMessages,
  sendMessage,
  subscribeToMessages,
} from "../api/messages"
import { useAuth } from "../context/AuthContext"
import type { Message } from "../types/db"

export function useMessages(conversationId: string | null) {
  const { session, isAdmin } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      return
    }
    let active = true
    setLoading(true)
    listMessages(conversationId)
      .then((rows) => active && setMessages(rows))
      .catch((e) => active && setError((e as Error).message))
      .finally(() => active && setLoading(false))

    const upsert = (msg: Message) =>
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      )

    const unsub = subscribeToMessages(conversationId, async (msg) => {
      // payload realtime tidak menyertakan join hospital; ambil datanya jika perlu
      if (msg.hospital_id && !msg.hospital) {
        const hospital = await getMessageHospital(msg.hospital_id)
        if (!active) return
        upsert({ ...msg, hospital })
      } else {
        upsert(msg)
      }
    })
    return () => {
      active = false
      unsub()
    }
  }, [conversationId])

  const send = useCallback(
    async (body: string, hospitalId?: string | null) => {
      if (!conversationId || !session) return
      if (!body.trim() && !hospitalId) return
      setSending(true)
      try {
        const msg = await sendMessage({
          conversationId,
          senderId: session.user.id,
          senderRole: isAdmin ? "admin" : "patient",
          body,
          hospitalId,
        })
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
        )
      } catch (e) {
        setError((e as Error).message)
        throw e
      } finally {
        setSending(false)
      }
    },
    [conversationId, session, isAdmin],
  )

  return { messages, loading, error, send, sending }
}
