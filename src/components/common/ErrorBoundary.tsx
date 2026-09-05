import { Component, type ErrorInfo, type ReactNode } from "react"

type Props = { children: ReactNode }
type State = { error: Error | null }

/** Menangkap crash saat render agar bug di satu layar tidak membuat seluruh app blank putih. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error:", error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-light">
          <span className="font-display text-2xl font-extrabold text-danger">
            !
          </span>
        </div>
        <div>
          <p className="font-display text-lg font-bold text-foreground">
            Terjadi kesalahan
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Halaman gagal dimuat. Coba muat ulang. Jika masih bermasalah,
            hubungi tim HospitalLink.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-primary px-5 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-primary-hover"
        >
          Muat Ulang
        </button>
      </div>
    )
  }
}
