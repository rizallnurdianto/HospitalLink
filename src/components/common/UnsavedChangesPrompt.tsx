import { useEffect } from "react"
import { useBlocker } from "react-router-dom"
import { ConfirmDialog } from "../ui"

type Props = {
  /** Jika true, navigasi dalam-app dicegat dan prompt keluar browser diaktifkan. */
  when: boolean
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
}

/**
 * Mencegah perubahan form yang belum disimpan hilang begitu saja. Memblokir
 * navigasi React Router (sidebar, top bar, tombol back, link dalam halaman)
 * dengan modal konfirmasi, dan mengaktifkan prompt native `beforeunload`
 * untuk refresh / tutup tab.
 *
 * Render di dalam halaman routed mana pun; berikan `when={isDirty}`.
 */
export default function UnsavedChangesPrompt({
  when,
  title = "Perubahan belum disimpan",
  message = "Kalau meninggalkan halaman ini sekarang, perubahan yang belum disimpan akan hilang.",
  confirmLabel = "Tinggalkan halaman",
  cancelLabel = "Tetap di sini",
}: Props) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (!when) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [when])

  // Jika guard dinonaktifkan (mis. setelah save berhasil) saat prompt masih
  // terbuka, lanjutkan navigasi yang tertunda.
  useEffect(() => {
    if (!when && blocker.state === "blocked") blocker.proceed()
  }, [when, blocker])

  if (blocker.state !== "blocked") return null

  return (
    <ConfirmDialog
      title={title}
      message={message}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      tone="danger"
      onConfirm={() => blocker.proceed()}
      onCancel={() => blocker.reset()}
    />
  )
}
