import { useEffect, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { Phone, User } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { updateMyProfile } from "../../api/profiles"
import { isProfileComplete } from "../../lib/authFlow"
import ProvinceSelect from "../../components/common/ProvinceSelect"
import FullscreenLoader from "../../components/common/FullscreenLoader"
import { Alert, Button } from "../../components/ui"
import { AuthShell, Field } from "./LoginPage"

/** Membuang "+62", 0 di depan, spasi, dan strip, menyisakan digit lokal saja. */
function toLocalPhone(raw: string): string {
  return raw
    .replace(/^\+?62/, "")
    .replace(/\D/g, "")
    .replace(/^0/, "")
}

export default function SetupProfilePage() {
  const { session, profile, loading, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [location, setLocation] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName((v) => v || profile.full_name)
      setPhone((v) => v || toLocalPhone(profile.phone))
      setLocation((v) => v || profile.location)
    }
  }, [profile])

  if (loading) return <FullscreenLoader />
  if (!session) return <Navigate to="/login" replace />
  if (profile) {
    if (profile.role === "admin") return <Navigate to="/admin" replace />
    if (isProfileComplete(profile)) return <Navigate to="/beranda" replace />
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const localPhone = phone.replace(/\D/g, "")
    if (!fullName.trim() || !localPhone || !location.trim()) {
      setError("Lengkapi semua data untuk melanjutkan.")
      return
    }
    if (localPhone.length < 8) {
      setError("Nomor HP tidak valid.")
      return
    }
    setBusy(true)
    try {
      await updateMyProfile(session.user.id, {
        full_name: fullName.trim(),
        phone: `+62 ${localPhone}`,
        location: location.trim(),
      })
      await refreshProfile()
      navigate("/beranda", { replace: true })
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Lengkapi profil Anda"
      subtitle="Cukup sekali. Data ini dipakai untuk pencarian dan Bantuan."
      backTo={null}
    >
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <Field icon={<User size={15} />} label="Nama Lengkap">
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nama Anda"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-subtle"
          />
        </Field>

        <Field icon={<Phone size={15} />} label="Nomor HP">
          <span className="flex-shrink-0 border-r border-border pr-2.5 text-sm font-semibold text-muted">
            +62
          </span>
          <input
            type="tel"
            inputMode="numeric"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            placeholder="81234567890"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-subtle"
          />
        </Field>

        <ProvinceSelect value={location} onChange={setLocation} />

        {error && <Alert tone="error">{error}</Alert>}

        <Button type="submit" block size="lg" loading={busy} className="mt-1">
          Simpan &amp; Lanjut
        </Button>
      </form>
    </AuthShell>
  )
}
