import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Outlet,
  Route,
  RouterProvider,
} from "react-router-dom"
import { AuthProvider, useAuth } from "../context/AuthContext"
import { ToastProvider } from "../context/ToastContext"
import { BookmarkProvider } from "../context/BookmarkContext"
import { postAuthPath } from "../lib/authFlow"
import ProtectedRoute from "./ProtectedRoute"
import AdminRoute from "./AdminRoute"

import LandingPage from "../pages/LandingPage"
import PatientLayout from "../components/common/PatientLayout"
import LoginPage from "../pages/auth/LoginPage"
import RegisterPage from "../pages/auth/RegisterPage"
import SetupProfilePage from "../pages/auth/SetupProfilePage"
import AuthCallbackPage from "../pages/auth/AuthCallbackPage"
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage"
import ResetPasswordPage from "../pages/auth/ResetPasswordPage"
import LegalPage from "../pages/LegalPage"
import Dashboard from "../pages/Dashboard"
import SearchPage from "../pages/SearchPage"
import HospitalDetail from "../pages/HospitalDetail"
import BookmarkPage from "../pages/BookmarkPage"
import ProfilePage from "../pages/ProfilePage"
import HelpPage from "../pages/HelpPage"

import AdminLayout from "../components/admin/AdminLayout"
import AdminDashboard from "../pages/admin/AdminDashboard"
import AdminHospitals from "../pages/admin/AdminHospitals"
import AdminHospitalForm from "../pages/admin/AdminHospitalForm"
import AdminUsers from "../pages/admin/AdminUsers"
import AdminInbox from "../pages/admin/AdminInbox"
import AdminSettings from "../pages/admin/AdminSettings"

/** Landing publik di "/"; pengguna yang sudah login diarahkan ke portalnya. */
function HomeRoute() {
  const { session, profile, loading } = useAuth()
  if (!loading && session) {
    return <Navigate to={postAuthPath(profile)} replace />
  }
  return <LandingPage />
}

/**
 * Provider untuk seluruh app. Diletakkan di dalam pohon router agar context
 * yang butuh router hooks (mis. BookmarkProvider → useNavigate) berfungsi,
 * dan agar useBlocker (guard perubahan belum tersimpan) tersedia di semua route.
 */
function RootLayout() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BookmarkProvider>
          <Outlet />
        </BookmarkProvider>
      </ToastProvider>
    </AuthProvider>
  )
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<RootLayout />}>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/setup-profile" element={<SetupProfilePage />} />
      <Route path="/lupa-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/syarat-ketentuan" element={<LegalPage doc="terms" />} />
      <Route path="/kebijakan-privasi" element={<LegalPage doc="privacy" />} />

      <Route
        element={
          <ProtectedRoute>
            <PatientLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/beranda" element={<Dashboard />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/hospital/:slug" element={<HospitalDetail />} />
        <Route path="/bookmark" element={<BookmarkPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/help" element={<HelpPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="hospitals" element={<AdminHospitals />} />
        <Route path="hospitals/new" element={<AdminHospitalForm />} />
        <Route path="hospitals/:id/edit" element={<AdminHospitalForm />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="inbox" element={<AdminInbox />} />
        <Route path="inbox/:id" element={<AdminInbox />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>,
  ),
)

export default function AppRouter() {
  return <RouterProvider router={router} />
}
