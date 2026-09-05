import { useState } from "react"
import { Link, Navigate, useLocation } from "react-router-dom"
import {
  ArrowLeft,
  Baby,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Heart,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  ShieldCheck,
  Stethoscope,
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { isProfileComplete } from "../../lib/authFlow"
import FullscreenLoader from "../../components/common/FullscreenLoader"
import { Alert, Button } from "../../components/ui"

export default function LoginPage() {
  const { session, profile, loading, signIn } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!loading && session) {
    if (!profile) return <FullscreenLoader />
    if (profile.role === "admin") return <Navigate to="/admin" replace />
    if (!isProfileComplete(profile))
      return <Navigate to="/setup-profile" replace />
    const from = (location.state as { from?: Location })?.from?.pathname
    return <Navigate to={from ?? "/beranda"} replace />
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await signIn(email.trim(), password)
      // Pengalihan ditangani oleh <Navigate> di atas setelah profil dimuat
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Masuk ke HospitalLink"
      subtitle="Gunakan akun Anda untuk melanjutkan."
    >
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <Field icon={<Mail size={15} />} label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-subtle"
          />
        </Field>
        <PasswordField value={password} onChange={setPassword} />

        <div className="-mt-1 flex justify-end">
          <Link
            to="/lupa-password"
            className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
          >
            Lupa kata sandi?
          </Link>
        </div>

        {error && <Alert tone="error">{error}</Alert>}

        <Button type="submit" block size="lg" loading={busy} className="mt-1">
          Masuk
        </Button>
      </form>

      <GoogleAuthButton label="Masuk dengan Google" />

      <p className="mt-5 text-center text-xs text-muted">
        Belum punya akun?{" "}
        <Link
          to="/register"
          className="font-semibold text-primary underline-offset-2 hover:underline"
        >
          Daftar sekarang
        </Link>
      </p>
    </AuthShell>
  )
}

const CATEGORY_ICONS = [
  { icon: <Building2 size={15} />, color: "#1a54c3" },
  { icon: <Baby size={15} />, color: "#7c3aed" },
  { icon: <Heart size={15} />, color: "#e11d48" },
  { icon: <Stethoscope size={15} />, color: "#0d9488" },
]

/**
 * Shell auth split-screen; layout 40/60. Panel kiri murni visual (tanpa teks
 * marketing): mock kartu app melayang + ikon di atas gradien biru lembut
 * ala Dashboard/landing. Form di kanan pakai token shared aplikasi. Diukur
 * agar pas di viewport tanpa scroll halaman (`h-dvh`); kolom form baru
 * scroll sendiri kalau layar sangat pendek tidak muat.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  backTo = "/",
  backLabel = "Kembali ke Beranda",
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  backTo?: string | null
  backLabel?: string
}) {
  return (
    // Dibatasi lebar + di-center (bg-background body terlihat di sisi kanan-kiri)
    // agar layar ultra-wide tidak meregangkan dua panel jadi tipis dan merusak proporsi.
    <div className="mx-auto h-dvh max-w-[1520px] overflow-hidden bg-surface lg:grid lg:grid-cols-[2fr_3fr]">
      {/* kiri: panel visual saja, tanpa teks */}
      <aside
        className="relative hidden overflow-hidden lg:flex lg:h-dvh lg:items-center lg:justify-center"
        style={{
          background: "linear-gradient(135deg, #EEF3FD 0%, #D1E0FB 100%)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-14 h-52 w-52 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(26,84,195,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(26,84,195,0.06) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
            maskImage:
              "radial-gradient(ellipse at center, black 35%, transparent 78%)",
          }}
        />

        {/* logo */}
        <div className="absolute left-10 top-10 flex items-center gap-2.5 xl:left-14 xl:top-14">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/25">
            <span className="font-display text-lg font-extrabold text-white">
              H
            </span>
          </span>
          <span className="font-display text-base font-extrabold text-foreground">
            HospitalLink
          </span>
        </div>

        {/* visual utama: mock kartu app melayang */}
        <div className="relative w-full max-w-[280px]">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-primary/15">
            <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-primary-light via-primary-light to-primary/15">
              <Building2
                size={30}
                strokeWidth={1.5}
                className="text-primary/40"
              />
              <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-surface text-danger shadow-sm">
                <Heart size={13} fill="currentColor" />
              </span>
              <span className="absolute bottom-3 left-3 flex h-6 items-center gap-1 rounded-full bg-success px-2.5 text-white shadow-sm">
                <CheckCircle2 size={11} />
              </span>
            </div>
            <div className="space-y-2.5 p-4">
              <div className="h-2.5 w-3/4 rounded-full bg-border" />
              <div className="h-2 w-1/2 rounded-full bg-border-light" />
              <div className="flex gap-1.5 pt-0.5">
                <span className="h-5 w-14 rounded-full bg-primary-light" />
                <span className="h-5 w-11 rounded-full bg-primary-light" />
              </div>
              <div className="flex gap-2 border-t border-border-light pt-3">
                <span className="h-8 flex-1 rounded-xl border-[1.5px] border-border" />
                <span className="h-8 w-14 rounded-xl bg-primary" />
              </div>
            </div>
          </div>

          <div className="absolute -left-7 top-9 flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface shadow-lg">
            <ShieldCheck size={17} className="text-primary" />
          </div>
          <div className="absolute -bottom-5 -right-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface shadow-lg">
            <MessageSquare size={18} className="text-primary" />
          </div>
        </div>

        {/* baris ikon kategori */}
        <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-2.5 xl:bottom-14">
          {CATEGORY_ICONS.map((c, i) => (
            <span
              key={i}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm"
              style={{ backgroundColor: c.color }}
            >
              {c.icon}
            </span>
          ))}
        </div>
      </aside>

      {/* kanan: form */}
      <main className="flex h-dvh flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3 px-6 py-5 sm:px-8 lg:px-12">
          {backTo ? (
            <Link
              to={backTo}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft size={15} />
              {backLabel}
            </Link>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="font-display text-sm font-extrabold text-white">
                H
              </span>
            </span>
            <span className="font-display text-[13px] font-extrabold text-foreground">
              HospitalLink
            </span>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-10 sm:px-8 lg:px-12">
          {/* my-auto (bukan justify-center pada parent) men-center saat muat, tapi
              berbeda dari justify-center di container overflow, jika tidak muat akan
              rata atas + bisa di-scroll penuh, bukan malah terpotong di bagian atas
              pada viewport pendek (mis. laptop dengan browser chrome yang terlihat). */}
          <div className="mx-auto my-auto w-full max-w-[380px]">
            <h1 className="font-display text-[25px] font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mb-6 mt-1.5 text-[13px] text-muted">{subtitle}</p>
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

export function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold text-foreground">{label}</span>
      <span className="flex items-center gap-2.5 rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 transition-all focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
        <span className="flex-shrink-0 text-subtle">{icon}</span>
        {children}
      </span>
    </label>
  )
}

/** Input kata sandi dengan toggle tampil/sembunyi, dipakai bersama Login & Daftar. */
export function PasswordField({
  value,
  onChange,
  label = "Kata Sandi",
  placeholder = "••••••••",
}: {
  value: string
  onChange: (v: string) => void
  label?: string
  placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <Field icon={<Lock size={15} />} label={label}>
      <input
        type={show ? "text" : "password"}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-subtle"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        onMouseDown={(e) => e.preventDefault()}
        aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        className="flex-shrink-0 text-subtle transition-colors hover:text-foreground"
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </Field>
  )
}

/** Pembatas "atau" + tombol "Lanjutkan dengan Google", dipakai bersama Login & Daftar. */
export function GoogleAuthButton({ label }: { label: string }) {
  const { signInWithGoogle } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const start = async () => {
    setError(null)
    setBusy(true)
    try {
      await signInWithGoogle()
      // Browser dialihkan ke Google; tidak ada proses lain di sini.
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="mt-5">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[11px] font-medium text-subtle">
          atau lanjutkan dengan
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {error && (
        <div className="mt-3">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-xl border-[1.5px] border-border bg-surface py-3 font-display text-sm font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-primary-light/40 disabled:opacity-60"
      >
        {busy ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <GoogleGlyph />
        )}
        {label}
      </button>
    </div>
  )
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 3-2.26 5.54-4.78 7.24l7.73 6c4.51-4.18 7.09-10.36 7.09-17.71z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}
