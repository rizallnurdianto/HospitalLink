import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react"
import { X } from "lucide-react"

type ToastAction = {
  label: string
  onClick: () => void
}

type ToastOptions = {
  icon?: React.ReactNode
  action?: ToastAction
  duration?: number
}

type Toast = {
  id: number
  message: string
  icon?: React.ReactNode
  action?: ToastAction
}

type ToastValue = {
  showToast: (message: string, opts?: ToastOptions) => void
}

const ToastContext = createContext<ToastValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, opts?: ToastOptions) => {
      const id = ++nextId.current
      // maksimal 3 toast tampil di layar sekaligus
      setToasts((list) => [
        ...list.slice(-2),
        { id, message, icon: opts?.icon, action: opts?.action },
      ])
      window.setTimeout(() => dismiss(id), opts?.duration ?? 3200)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:pr-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="toast-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-border bg-surface p-3 pr-3 shadow-[0_16px_40px_-12px_rgba(15,23,38,0.28)]"
          >
            {t.icon && (
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                {t.icon}
              </span>
            )}
            <p className="min-w-0 flex-1 text-[13px] font-semibold text-foreground">
              {t.message}
            </p>
            {t.action && (
              <button
                onClick={() => {
                  t.action?.onClick()
                  dismiss(t.id)
                }}
                className="flex-shrink-0 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-primary transition-colors hover:bg-primary-light"
              >
                {t.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Tutup notifikasi"
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-background hover:text-foreground"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast harus dipakai di dalam <ToastProvider>")
  return ctx
}
