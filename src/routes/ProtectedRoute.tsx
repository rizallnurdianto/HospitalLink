import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { isProfileComplete } from "../lib/authFlow"
import FullscreenLoader from "../components/common/FullscreenLoader"

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode
}) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullscreenLoader />
  if (!session)
    return <Navigate to="/login" state={{ from: location }} replace />
  // Pengguna baru harus menyelesaikan Setup Profile dulu sebelum masuk portal.
  if (profile && !isProfileComplete(profile))
    return <Navigate to="/setup-profile" replace />
  return <>{children}</>
}
