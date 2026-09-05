import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Edit3,
  Loader2,
  LogOut,
  Check,
  X,
  User,
  Bell,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  CalendarDays,
  AlertTriangle,
  Trash2,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import {
  updateMyProfile,
  updateMyPassword,
  deleteOwnAccount,
} from "../api/profiles"
import { formatDate } from "../lib/format"
import { PROVINCES } from "../lib/provinces"
import { Alert, Button, ConfirmDialog, Dropdown, Modal } from "../components/ui"
import UnsavedChangesPrompt from "../components/common/UnsavedChangesPrompt"
import { NOTIF_ITEMS, readPrefs, writePrefs } from "../lib/notifications"
import type { UserRole } from "../types/db"

type TabId = "profil" | "notifikasi" | "akun"

type Tab = {
  id: TabId
  label: string
  icon: React.ReactNode
}

const TABS: Tab[] = [
  { id: "profil", label: "Profil", icon: <User size={15} /> },
  { id: "notifikasi", label: "Notifikasi", icon: <Bell size={15} /> },
  { id: "akun", label: "Akun", icon: <ShieldCheck size={15} /> },
]

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-border"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      {children}
    </div>
  )
}

/* --------------------------------- Profil --------------------------------- */

function ProfilTab() {
  const { session, profile, refreshProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [location, setLocation] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name)
      setPhone(profile.phone)
      setLocation(profile.location)
    }
  }, [profile])

  if (!profile || !session) return null

  const dirty =
    fullName.trim() !== profile.full_name ||
    phone.trim() !== profile.phone ||
    location.trim() !== profile.location

  const reset = () => {
    setFullName(profile.full_name)
    setPhone(profile.phone)
    setLocation(profile.location)
    setEditing(false)
    setError(null)
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await updateMyProfile(profile.id, {
        full_name: fullName.trim(),
        phone: phone.trim(),
        location: location.trim(),
      })
      await refreshProfile()
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <UnsavedChangesPrompt when={editing && dirty} />

      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-bold text-foreground">
            Informasi Pribadi
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            Dipakai untuk fitur pencarian dan Bantuan.
          </p>
        </div>
        {editing ? (
          <div className="flex flex-shrink-0 gap-2">
            <button
              onClick={save}
              disabled={saving || !dirty}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Check size={13} />
              )}
              Simpan
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 rounded-xl border-[1.5px] border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-danger hover:text-danger"
            >
              <X size={13} />
              Batal
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border-[1.5px] border-border px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Edit3 size={13} />
            Edit
          </button>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-danger-light px-3 py-2 text-xs font-medium text-danger">
          {error}
        </p>
      )}
      {saved && (
        <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-success-light px-3 py-2 text-xs font-medium text-success">
          <CheckCircle2 size={13} />
          Perubahan disimpan.
        </p>
      )}

      <div className="mt-4 h-px bg-border-light" />

      <div className="mt-4 space-y-3">
        <Row icon={<User size={13} />} label="Nama Lengkap">
          {editing ? (
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              aria-label="Nama lengkap"
              className="w-full rounded-lg border-[1.5px] border-border bg-background px-3 py-1.5 text-[13px] font-semibold text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          ) : (
            <Value>{profile.full_name || "Belum diisi"}</Value>
          )}
        </Row>

        <Row icon={<Mail size={13} />} label="Email">
          <Value>{session.user.email ?? "-"}</Value>
        </Row>

        <Row icon={<Phone size={13} />} label="Nomor HP">
          {editing ? (
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              inputMode="numeric"
              placeholder="08xxxxxxxxxx"
              aria-label="Nomor HP"
              className="w-full rounded-lg border-[1.5px] border-border bg-background px-3 py-1.5 text-[13px] font-semibold text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          ) : (
            <Value>{profile.phone || "Belum diisi"}</Value>
          )}
        </Row>

        <Row icon={<MapPin size={13} />} label="Provinsi">
          {editing ? (
            <Dropdown
              value={location}
              onChange={setLocation}
              searchable
              block
              tone="field"
              placeholder="Pilih provinsi…"
              options={PROVINCES.map((p) => ({ value: p, label: p }))}
            />
          ) : (
            <Value>{profile.location || "Belum diisi"}</Value>
          )}
        </Row>
      </div>
    </Card>
  )
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 gap-1 rounded-xl bg-background px-3.5 py-3 sm:grid-cols-[140px_1fr] sm:items-center sm:gap-3">
      <div className="flex items-center gap-1.5">
        <span className="text-primary">{icon}</span>
        <span className="text-[11px] font-medium text-subtle">{label}</span>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function Value({ children }: { children: React.ReactNode }) {
  return (
    <p className="truncate text-[13px] font-semibold text-foreground">
      {children}
    </p>
  )
}

/* ------------------------------ Notifikasi ------------------------------- */

type NotifikasiTabProps = {
  userId: string
  role: UserRole
}

function NotifikasiTab({ userId, role }: NotifikasiTabProps) {
  const items = NOTIF_ITEMS[role]
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    readPrefs(userId, role),
  )

  useEffect(() => {
    setPrefs(readPrefs(userId, role))
  }, [userId, role])

  const toggle = (key: string) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      writePrefs(userId, next)
      return next
    })
  }

  return (
    <Card>
      <h3 className="font-display text-sm font-bold text-foreground">
        Preferensi Notifikasi
      </h3>
      <p className="mt-0.5 text-xs text-muted">
        Pilih pemberitahuan yang ingin kamu terima. Pengaturan ini tersimpan di
        perangkat ini.
      </p>

      <div className="mt-4 divide-y divide-border-light overflow-hidden rounded-xl border border-border">
        {items.map((item) => (
          <label
            key={item.key}
            className="flex cursor-pointer items-center justify-between gap-4 bg-background px-4 py-3.5"
          >
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-foreground">
                {item.label}
              </p>
              <p className="mt-0.5 text-xs text-muted">{item.description}</p>
            </div>
            <Toggle
              checked={prefs[item.key]}
              onChange={() => toggle(item.key)}
            />
          </label>
        ))}
      </div>
    </Card>
  )
}

/* --------------------------------- Akun --------------------------------- */

function AkunTab() {
  const { session, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const isAdmin = profile?.role === "admin"

  const [pw, setPw] = useState("")
  const [pw2, setPw2] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwDone, setPwDone] = useState(false)
  const [confirmOut, setConfirmOut] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const emailConfirmed = Boolean(session?.user.email_confirmed_at)

  const changePassword = async () => {
    setPwError(null)
    if (pw.length < 6) {
      setPwError("Kata sandi minimal 6 karakter.")
      return
    }
    if (pw !== pw2) {
      setPwError("Konfirmasi kata sandi tidak cocok.")
      return
    }
    setSavingPw(true)
    try {
      await updateMyPassword(pw)
      setPw("")
      setPw2("")
      setPwDone(true)
      setTimeout(() => setPwDone(false), 2500)
    } catch (e) {
      setPwError((e as Error).message)
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-display text-sm font-bold text-foreground">
          Detail Akun
        </h3>
        <div className="mt-4 space-y-3">
          <Row icon={<Mail size={13} />} label="Email">
            <div className="flex flex-wrap items-center gap-2">
              <Value>{session?.user.email ?? "-"}</Value>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  emailConfirmed
                    ? "bg-success-light text-success"
                    : "bg-warning-light text-warning"
                }`}
              >
                <CheckCircle2 size={10} />
                {emailConfirmed ? "Terverifikasi" : "Belum diverifikasi"}
              </span>
            </div>
          </Row>
          <Row icon={<ShieldCheck size={13} />} label="Peran">
            <Value>
              {profile?.role === "admin" ? "Administrator" : "Pengguna"}
            </Value>
          </Row>
          <Row icon={<CalendarDays size={13} />} label="Terdaftar">
            <Value>{formatDate(profile?.created_at)}</Value>
          </Row>
        </div>
      </Card>

      <Card>
        <h3 className="font-display text-sm font-bold text-foreground">
          Ganti Kata Sandi
        </h3>
        <p className="mt-0.5 text-xs text-muted">
          Minimal 6 karakter. Kamu akan tetap masuk di perangkat ini.
        </p>

        {pwError && (
          <p className="mt-4 rounded-lg bg-danger-light px-3 py-2 text-xs font-medium text-danger">
            {pwError}
          </p>
        )}
        {pwDone && (
          <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-success-light px-3 py-2 text-xs font-medium text-success">
            <CheckCircle2 size={13} />
            Kata sandi berhasil diperbarui.
          </p>
        )}

        <div className="mt-4 space-y-2.5">
          <div className="relative">
            <Lock
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
            />
            <input
              type={showPw ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Kata sandi baru"
              aria-label="Kata sandi baru"
              className="w-full rounded-xl border-[1.5px] border-border bg-background py-2.5 pl-9 pr-10 text-[13px] text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Sembunyikan" : "Tampilkan"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle transition-colors hover:text-foreground"
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <div className="relative">
            <Lock
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
            />
            <input
              type={showPw ? "text" : "password"}
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder="Ulangi kata sandi baru"
              aria-label="Ulangi kata sandi baru"
              className="w-full rounded-xl border-[1.5px] border-border bg-background py-2.5 pl-9 pr-3 text-[13px] text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <button
            onClick={changePassword}
            disabled={savingPw || !pw || !pw2}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {savingPw && <Loader2 size={14} className="animate-spin" />}
            Perbarui Kata Sandi
          </button>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-sm font-bold text-foreground">
              Sesi Masuk
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              Keluar dari akun di perangkat ini.
            </p>
          </div>
          <button
            onClick={() => setConfirmOut(true)}
            className="flex flex-shrink-0 items-center gap-2 rounded-xl border-[1.5px] border-border px-4 py-2.5 text-[13px] font-bold text-foreground transition-colors hover:border-danger hover:bg-danger-light hover:text-danger"
          >
            <LogOut size={15} />
            Keluar
          </button>
        </div>
      </Card>

      {!isAdmin && (
        <div className="rounded-2xl border-[1.5px] border-danger/25 bg-danger-light/50 p-5">
          <div className="flex items-center gap-1.5 text-danger">
            <AlertTriangle size={14} className="flex-shrink-0" />
            <span className="font-display text-[11px] font-bold uppercase tracking-wider">
              Zona Berbahaya
            </span>
          </div>
          <h3 className="mt-2.5 font-display text-sm font-bold text-foreground">
            Hapus Akun
          </h3>
          <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted">
            Menghapus akun bersifat permanen. Seluruh data kamu (rumah sakit
            tersimpan, riwayat percakapan Bantuan, dan profil) akan dihapus dan
            tidak bisa dikembalikan. Email kamu tetap bebas dipakai untuk
            mendaftar ulang di kemudian hari.
          </p>
          <button
            onClick={() => setShowDelete(true)}
            className="mt-4 flex items-center gap-1.5 rounded-xl bg-danger px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-danger/90"
          >
            <Trash2 size={14} />
            Hapus Akun Saya
          </button>
        </div>
      )}

      {confirmOut && (
        <ConfirmDialog
          title="Keluar dari akun?"
          message="Kamu perlu masuk lagi untuk mengakses rumah sakit tersimpan dan percakapan Bantuan."
          confirmLabel="Keluar"
          tone="danger"
          busy={signingOut}
          onCancel={() => setConfirmOut(false)}
          onConfirm={async () => {
            setSigningOut(true)
            await signOut()
            navigate("/login", { replace: true })
          }}
        />
      )}

      {showDelete && (
        <DeleteAccountDialog
          onCancel={() => setShowDelete(false)}
          onDeleted={() => navigate("/", { replace: true })}
        />
      )}
    </div>
  )
}

function DeleteAccountDialog({
  onCancel,
  onDeleted,
}: {
  onCancel: () => void
  onDeleted: () => void
}) {
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ready = text.trim().toUpperCase() === "HAPUS"

  const confirm = async () => {
    setError(null)
    setBusy(true)
    try {
      await deleteOwnAccount()
      onDeleted()
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <Modal size="sm" onClose={busy ? () => {} : onCancel}>
      <div className="flex flex-col items-center px-1 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-light text-danger">
          <AlertTriangle size={22} />
        </span>
        <p className="mt-4 font-display text-base font-bold text-foreground">
          Hapus akun permanen?
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          Tindakan ini tidak bisa dibatalkan. Semua rumah sakit tersimpan,
          riwayat Bantuan, dan profil kamu akan hilang.
        </p>
      </div>

      <label
        htmlFor="delete-confirm"
        className="mt-5 block text-xs font-semibold text-muted"
      >
        Ketik <span className="font-bold text-foreground">HAPUS</span> untuk
        konfirmasi
      </label>
      <input
        id="delete-confirm"
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="HAPUS"
        className="mt-1.5 w-full rounded-xl border-[1.5px] border-border bg-background px-3.5 py-2.5 text-center text-sm font-semibold tracking-wide text-foreground outline-none transition-all focus:border-danger focus:ring-4 focus:ring-danger/10"
      />

      {error && (
        <div className="mt-3">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          variant="secondary"
          className="order-2 sm:order-1"
          disabled={busy}
          onClick={onCancel}
        >
          Batal
        </Button>
        <Button
          variant="danger"
          className="order-1 sm:order-2"
          loading={busy}
          disabled={!ready}
          onClick={confirm}
        >
          Hapus Akun
        </Button>
      </div>
    </Modal>
  )
}

/* -------------------------------- Halaman --------------------------------- */

export default function ProfilePage() {
  const { session, profile } = useAuth()
  const [tab, setTab] = useState<TabId>("profil")

  const roleLabel = useMemo(
    () => (profile?.role === "admin" ? "Administrator" : "Pengguna Aktif"),
    [profile],
  )

  if (!profile || !session) return null

  return (
    <div className="mx-auto max-w-6xl space-y-7 p-4 sm:p-6 lg:p-8">
      {/* identitas */}
      <div className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:p-6">
        <span className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-2xl border-[3px] border-primary-light bg-primary-light font-display text-2xl font-extrabold text-primary">
          {(profile.full_name || "P").charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-bold text-foreground">
            {profile.full_name ||
              (profile.role === "admin" ? "Administrator" : "Pengguna")}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted">
            {session.user.email}
          </p>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success-light px-2.5 py-1 text-[11px] font-semibold text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            {roleLabel}
          </span>
        </div>
      </div>

      {/* tab */}
      <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
              tab === t.id
                ? "bg-primary text-white"
                : "text-muted hover:bg-background hover:text-foreground"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* panel */}
      {tab === "profil" && <ProfilTab />}
      {tab === "notifikasi" && (
        <NotifikasiTab userId={session.user.id} role={profile.role} />
      )}
      {tab === "akun" && <AkunTab />}

      {tab === "profil" && (
        <div className="flex items-start gap-3 rounded-2xl border border-primary-light bg-primary-light p-5">
          <ShieldCheck
            size={18}
            className="mt-0.5 flex-shrink-0 text-primary"
          />
          <div>
            <p className="font-display text-[13px] font-bold text-foreground">
              Data kamu aman
            </p>
            <p className="mt-0.5 text-xs text-muted">
              Informasi akun hanya dipakai untuk fitur pencarian dan Bantuan,
              tidak dibagikan ke pihak lain.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
