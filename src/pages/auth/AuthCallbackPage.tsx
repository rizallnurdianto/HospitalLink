import { useEffect, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { postAuthPath } from "../../lib/authFlow"
import FullscreenLoader from "../../components/common/FullscreenLoader"
import { Alert, Button } from "../../components/ui"
import { AuthShell } from "./LoginPage"

/**
 * Titik pendaratan redirect OAuth Google (`redirectTo` di signInWithGoogle).
 * supabase-js membaca session dari URL saat load; AuthContext lalu
 * mengambilnya. Di sini kita cukup menunggu itu selesai lalu mengarahkan
 * pengguna ke tempat yang tepat.
 */
export default function AuthCallbackPage() {
  const { session, profile, loading } = useAuth()
  const navigate = useNavigate()
  const [timedOut, setTimedOut] = useState(false)

  // Provider OAuth mengembalikan error (pengguna batal, salah konfigurasi, …).
  const params = new URLSearchParams(
    window.location.search + window.location.hash.replace(/^#/, "&"),
  )
  const oauthError = params.get("error_description") ?? params.get("error")

  useEffect(() => {
    if (oauthError) return
    const t = setTimeout(() => setTimedOut(true), 12000)
    return () => clearTimeout(t)
  }, [oauthError])

  useEffect(() => {
    if (!loading && session && profile) {
      navigate(postAuthPath(profile), { replace: true })
    }
  }, [loading, session, profile, navigate])

  if (oauthError) {
    return (
      <AuthShell
        title="Gagal masuk dengan Google"
        subtitle="Silakan coba lagi atau gunakan email dan kata sandi."
        backTo={null}
      >
        <Alert tone="error">
          {decodeURIComponent(oauthError.replace(/\+/g, " "))}
        </Alert>
        <Button
          onClick={() => navigate("/login", { replace: true })}
          block
          size="lg"
          className="mt-4"
        >
          Kembali ke halaman masuk
        </Button>
      </AuthShell>
    )
  }

  // Auth sudah selesai diproses tapi belum ada session; anggap gagal masuk.
  if ((!loading && !session) || timedOut) {
    return <Navigate to="/login" replace />
  }

  return <FullscreenLoader />
}
