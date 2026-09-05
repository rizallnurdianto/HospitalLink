import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "../lib/supabase"
import { listAllConversations, listMyConversations } from "../api/conversations"
import { useAuth } from "../context/AuthContext"
import type { Conversation } from "../types/db"

export function useConversations(scope: "mine" | "all") {
  const { session } = useAuth()
  const userId = session?.user.id
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // unik per instance hook agar dua komponen bisa mengamati scope yang sama
  const cid = useRef(Math.random().toString(36).slice(2))

  const load = useCallback(async () => {
    if (scope === "mine" && !userId) return
    try {
      const rows =
        scope === "all"
          ? await listAllConversations()
          : await listMyConversations(userId!)
      setConversations(rows)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [scope, userId])

  useEffect(() => {
    load()
    const channel = supabase
      .channel(`conversations-${scope}-${cid.current}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => load(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load, scope])

  return { conversations, loading, error, reload: load }
}
