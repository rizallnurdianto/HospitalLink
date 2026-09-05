import { useCallback, useEffect, useState } from "react"
import { getSettings } from "../api/settings"
import type { SettingsMap } from "../types/db"

export function useSettings() {
  const [settings, setSettings] = useState<SettingsMap | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    getSettings()
      .then((s) => {
        setSettings(s)
        setError(null)
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  return { settings, loading, error, reload: load }
}
