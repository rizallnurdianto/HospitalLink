import { Bookmark, LayoutDashboard, Megaphone, MessageSquare, Search } from "lucide-react"
import AppLayout, { type PageMeta } from "./AppLayout"
import type { SidebarNavItem } from "./AppSidebar"
import { ContactProvider } from "../../context/ContactContext"
import { useBookmarks } from "../../hooks/useBookmarks"
import { useSettings } from "../../hooks/useSettings"

const NAV: SidebarNavItem[] = [
  {
    to: "/beranda",
    label: "Dashboard",
    icon: <LayoutDashboard size={18} />,
    end: true,
  },
  { to: "/search", label: "Cari Rumah Sakit", icon: <Search size={18} /> },
  { to: "/bookmark", label: "Tersimpan", icon: <Bookmark size={18} /> },
  { to: "/help", label: "Bantuan", icon: <MessageSquare size={18} /> },
]

const META: Record<string, PageMeta> = {
  "/beranda": {
    title: "Dashboard",
    subtitle: "Temukan rumah sakit yang tepat untuk kebutuhanmu.",
  },
  "/search": {
    title: "Cari Rumah Sakit",
    subtitle:
      "Temukan fasilitas kesehatan terbaik sesuai kebutuhan medis Anda.",
  },
  "/bookmark": {
    title: "Tersimpan",
    subtitle: "Rumah sakit yang kamu simpan untuk referensi.",
  },
  "/profile": {
    title: "Profil",
    subtitle: "Kelola informasi akun dan preferensimu.",
  },
  "/help": {
    title: "Bantuan",
    subtitle: "Chat langsung dengan Admin HospitalLink.",
  },
}

function resolveMeta(pathname: string): PageMeta {
  if (pathname.startsWith("/hospital/"))
    return {
      title: "Detail Rumah Sakit",
      subtitle: "Informasi lengkap untuk membantu keputusanmu.",
    }
  return META[pathname] ?? { title: "HospitalLink" }
}

export default function PatientLayout() {
  const { bookmarkIds } = useBookmarks()
  const { settings } = useSettings()
  const announcement = settings?.announcement

  const navItems = NAV.map((item) =>
    item.to === "/bookmark" ? { ...item, badge: bookmarkIds.length } : item,
  )

  const banner =
    announcement?.enabled && announcement.text ? (
      <div className="flex items-start gap-2 border-b border-primary-light bg-primary-light px-4 py-2.5 sm:px-8">
        <Megaphone size={14} className="mt-0.5 flex-shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-primary">
          {announcement.text}
        </p>
      </div>
    ) : null

  return (
    <ContactProvider>
      <AppLayout
        portalLabel="Portal Pengguna"
        navItems={navItems}
        footerTo="/profile"
        footerCaption="Lihat Profil"
        resolveMeta={resolveMeta}
        banner={banner}
      />
    </ContactProvider>
  )
}
