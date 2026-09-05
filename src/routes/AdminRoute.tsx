import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { postAuthPath } from "../lib/authFlow"
import FullscreenLoader from "../components/common/FullscreenLoader"

export default function AdminRoute({
  children,
}: {
  children: React.ReactNode
}) {
  const { session, profile, loading } = useAuth()

  if (loading) return <FullscreenLoader />
  if (!session) return <Navigate to="/login" replace />
  if (profile?.role !== "admin")
    return <Navigate to={postAuthPath(profile)} replace />
  return <>{children}</>
}
