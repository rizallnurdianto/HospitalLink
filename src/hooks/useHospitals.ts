import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "../lib/supabase"
import {
  listActiveHospitals,
  listAllHospitals,
  getHospitalBySlug,
} from "../api/hospitals"
import type { Hospital } from "../types/db"

type State = {
  hospitals: Hospital[]
  loading: boolean
  error: string | null
}

/** scope "active" = Portal Pengguna, "all" = Portal Admin. Update live via realtime. */
export function useHospitals(scope: "active" | "all" = "active") {
  const [state, setState] = useState<State>({
    hospitals: [],
    loading: true,
    error: null,
  })
  // unik per instance hook; nama channel tetap akan error saat dua komponen
  // subscribe ke topik yang sama (Supabase throws "cannot add callbacks after subscribe()").
  const cid = useRef(Math.random().toString(36).slice(2))

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const rows =
        scope === "all" ? await listAllHospitals() : await listActiveHospitals()
      setState({ hospitals: rows, loading: false, error: null })
    } catch (e) {
      setState({ hospitals: [], loading: false, error: (e as Error).message })
    }
  }, [scope])

  useEffect(() => {
    load()
    const channel = supabase
      .channel(`hospitals-${scope}-${cid.current}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hospitals" },
        () => load(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load, scope])

  return { ...state, reload: load }
}

export function useHospital(slug: string | undefined) {
  const [hospital, setHospital] = useState<Hospital | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    let active = true
    setLoading(true)
    getHospitalBySlug(slug)
      .then((h) => {
        if (active) {
          setHospital(h)
          setError(null)
        }
      })
      .catch((e) => active && setError((e as Error).message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [slug])

  return { hospital, loading, error }
}
