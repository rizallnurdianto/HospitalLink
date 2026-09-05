import { useEffect, useRef } from "react"

/**
 * Menutup popover / dropdown / menu yang terbuka saat pointer ditekan di luar
 * elemen, dan opsional saat Escape. Mengembalikan ref untuk dipasang ke elemen
 * yang dianggap "di dalam" — `mousedown` di luar elemen tsb (atau Escape, jika
 * `escape` diaktifkan) memanggil `onClose`. Listener hanya aktif selama `open` true.
 */
export function useDismissable<T extends HTMLElement = HTMLDivElement>(
  open: boolean,
  onClose: () => void,
  { escape = false }: { escape?: boolean } = {},
) {
  const ref = useRef<T>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCloseRef.current()
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (escape && e.key === "Escape") onCloseRef.current()
    }
    document.addEventListener("mousedown", onDown)
    if (escape) document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open, escape])

  return ref
}
