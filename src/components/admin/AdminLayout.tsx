import {
  Hospital,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react"
import AppLayout, { type PageMeta } from "../common/AppLayout"
import type { SidebarNavItem } from "../common/AppSidebar"

const NAV: SidebarNavItem[] = [
  {
    to: "/admin",
    label: "Dashboard",
    icon: <LayoutDashboard size={18} />,
    end: true,
  },
  {
    to: "/admin/hospitals",
    label: "Data Rumah Sakit",
    icon: <Hospital size={18} />,
  },
  { to: "/admin/users", label: "Pengguna", icon: <Users size={18} /> },
  { to: "/admin/inbox", label: "Bantuan", icon: <MessageSquare size={18} /> },
  { to: "/admin/settings", label: "Pengaturan", icon: <Settings size={18} /> },
]

function resolveMeta(pathname: string): PageMeta {
  if (pathname === "/admin")
    return {
      title: "Dashboard",
      subtitle: "Ringkasan kondisi data dan aktivitas terbaru.",
    }
  if (pathname === "/admin/hospitals")
    return {
      title: "Data Rumah Sakit",
      subtitle:
        "Sumber data tunggal untuk Portal Pengguna. Perubahan langsung tampil ke pengguna.",
    }
  if (pathname === "/admin/hospitals/new")
    return { title: "Tambah Rumah Sakit", subtitle: "Isi data rumah sakit baru." }
  if (/^\/admin\/hospitals\/[^/]+\/edit$/.test(pathname))
    return { title: "Edit Rumah Sakit", subtitle: "Perbarui data rumah sakit." }
  if (pathname.startsWith("/admin/users"))
    return { title: "Pengguna", subtitle: "Kelola akun pengguna dan admin." }
  if (pathname.startsWith("/admin/inbox"))
    return {
      title: "Bantuan",
      subtitle:
        "Inbox chat dari Portal Pengguna. Balasan Anda tampil langsung ke pengguna.",
    }
  if (pathname.startsWith("/admin/settings"))
    return {
      title: "Pengaturan",
      subtitle: "Konfigurasi yang memengaruhi Portal Pengguna.",
    }
  if (pathname.startsWith("/admin/profile"))
    return { title: "Profil Saya", subtitle: "Kelola akun administrator Anda." }
  return { title: "Portal Admin" }
}

export default function AdminLayout() {
  return (
    <AppLayout
      portalLabel="Portal Admin"
      navItems={NAV}
      footerTo="/admin/profile"
      footerCaption="Administrator"
      resolveMeta={resolveMeta}
    />
  )
}
