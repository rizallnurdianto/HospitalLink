import { useMemo, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search,
  Baby,
  Heart,
  Brain,
  BrainCircuit,
  Bone,
  Smile,
  Eye,
  Ear,
  Wind,
  Scissors,
  Ribbon,
  ChevronRight,
  Hospital,
  Clock,
  Bookmark,
  MessageCircle,
  MapPin,
} from "lucide-react"
import HospitalCard from "../components/common/HospitalCard"
import RelativeTime from "../components/common/RelativeTime"
import { categoryShort } from "../lib/hospitalCategories"
import { useHospitals } from "../hooks/useHospitals"
import { useBookmarks } from "../hooks/useBookmarks"
import { useConversations } from "../hooks/useConversations"
import { useContact } from "../context/ContactContext"
import { useAuth } from "../context/AuthContext"
import {
  Button,
  EmptyState,
  PageContainer,
  PageHeader,
  Spinner,
  StatCard,
} from "../components/ui"

type HospitalKind = {
  icon: ReactNode
  category: string
}

const hospitalKinds: HospitalKind[] = [
  { icon: <Hospital size={20} />, category: "Rumah Sakit Umum (RSU)" },
  { icon: <Baby size={20} />, category: "Rumah Sakit Ibu dan Anak (RSIA)" },
  { icon: <Heart size={20} />, category: "Rumah Sakit Jantung" },
  { icon: <Eye size={20} />, category: "Rumah Sakit Mata" },
  { icon: <Ribbon size={20} />, category: "Rumah Sakit Kanker" },
  { icon: <Smile size={20} />, category: "Rumah Sakit Gigi dan Mulut (RSGM)" },
  { icon: <Brain size={20} />, category: "Rumah Sakit Jiwa (RSJ)" },
  { icon: <Bone size={20} />, category: "Rumah Sakit Ortopedi" },
  { icon: <Ear size={20} />, category: "Rumah Sakit THT-KL" },
  { icon: <BrainCircuit size={20} />, category: "Rumah Sakit Syaraf" },
  { icon: <Scissors size={20} />, category: "Rumah Sakit Bedah" },
  { icon: <Wind size={20} />, category: "Rumah Sakit Pernapasan/Paru" },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { openContact } = useContact()
  const { profile } = useAuth()
  const { hospitals, loading } = useHospitals("active")
  const { bookmarkIds, isBookmarked, toggle } = useBookmarks()
  const { conversations, loading: convLoading } = useConversations("mine")

  const province = profile?.location ?? ""

  const nearby = useMemo(
    () => (province ? hospitals.filter((h) => h.province === province) : []),
    [hospitals, province],
  )

  const stats = useMemo(() => {
    const open24 = hospitals.filter((h) => h.is_open_24h).length
    return [
      province
        ? {
            icon: <MapPin size={18} />,
            value: String(nearby.length),
            label: `RS di ${province}`,
            onClick: () =>
              navigate(`/search?provinsi=${encodeURIComponent(province)}`),
          }
        : {
            icon: <Hospital size={18} />,
            value: String(hospitals.length),
            label: "Rumah Sakit Terdaftar",
            onClick: () => navigate("/search"),
          },
      {
        icon: <Clock size={18} />,
        value: String(open24),
        label: "Buka 24 Jam",
        onClick: () => navigate("/search?q=IGD 24 Jam"),
      },
      {
        icon: <Bookmark size={18} />,
        value: String(bookmarkIds.length),
        label: "Tersimpan",
        onClick: () => navigate("/bookmark"),
      },
    ]
  }, [hospitals, nearby.length, province, bookmarkIds, navigate])

  const saved = useMemo(
    () => hospitals.filter((h) => bookmarkIds.includes(h.id)).slice(0, 3),
    [hospitals, bookmarkIds],
  )

  const recentConversations = useMemo(
    () => conversations.slice(0, 3),
    [conversations],
  )

  const firstName = (profile?.full_name || "").split(" ")[0] || "Pengguna"

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
      <div
        className="relative flex items-center justify-between gap-6 overflow-hidden rounded-2xl p-6 sm:p-8"
        style={{
          background: "linear-gradient(135deg, #EEF3FD 0%, #D1E0FB 100%)",
        }}
      >
        <div className="relative z-10 flex-1">
          <h2 className="mb-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">
            Selamat datang, {firstName}
          </h2>
          <p className="mb-6 max-w-md text-sm leading-relaxed text-foreground/70">
            Lihat rumah sakit di sekitarmu, atau cari berdasarkan layanan,
            fasilitas, dan jenis untuk mendapatkan perawatan terbaik.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate("/search")}>
              Cari Rumah Sakit
            </Button>
            <Button onClick={() => navigate("/help")} variant="secondary">
              Bantuan
            </Button>
          </div>
        </div>

        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary opacity-20" />
        <div className="absolute -bottom-8 right-24 h-24 w-24 rounded-full bg-primary opacity-10" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <StatCard
            key={s.label}
            icon={s.icon}
            value={s.value}
            label={s.label}
            onClick={s.onClick}
          />
        ))}
      </div>

      {province && (
        <div>
          <PageHeader
            className="mb-4"
            title="Rumah Sakit di Sekitar Anda"
            subtitle={
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={12} className="flex-shrink-0 text-primary" />
                Rumah sakit di provinsi{" "}
                <span className="font-semibold text-foreground">
                  {province}
                </span>
              </span>
            }
            action={
              nearby.length > 0 && (
                <Button
                  onClick={() =>
                    navigate(
                      `/search?provinsi=${encodeURIComponent(province)}`,
                    )
                  }
                  variant="subtle"
                  size="sm"
                  iconRight={<ChevronRight size={12} />}
                >
                  Lihat Semua
                </Button>
              )
            }
          />

          {loading ? (
            <Spinner />
          ) : nearby.length === 0 ? (
            <button
              onClick={() => navigate("/search")}
              className="flex w-full items-center gap-4 rounded-2xl border border-dashed border-border bg-surface px-5 py-6 text-left transition-colors hover:border-primary/30 hover:bg-primary-light"
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                <MapPin size={20} />
              </div>
              <div className="flex-1">
                <p className="font-display text-sm font-bold text-foreground">
                  Belum ada rumah sakit terdaftar di {province}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  HospitalLink sedang memperluas jangkauan. Cari di provinsi lain
                  dulu.
                </p>
              </div>
              <ChevronRight size={16} className="flex-shrink-0 text-subtle" />
            </button>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {nearby.slice(0, 3).map((h) => (
                <HospitalCard
                  key={h.id}
                  hospital={h}
                  onDetail={(slug) => navigate(`/hospital/${slug}`)}
                  onContact={openContact}
                  bookmarked={isBookmarked(h.id)}
                  onToggleBookmark={toggle}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <PageHeader
          className="mb-4"
          title="Cari Berdasarkan Jenis Rumah Sakit"
          subtitle="Pilih jenis rumah sakit yang kamu cari."
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {hospitalKinds.map((k) => (
            <button
              key={k.category}
              onClick={() =>
                navigate(`/search?jenis=${encodeURIComponent(k.category)}`)
              }
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 text-left transition-colors hover:border-primary/30 hover:bg-primary-light"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                {k.icon}
              </div>
              <span className="text-xs font-semibold leading-snug text-foreground">
                {categoryShort(k.category)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <PageHeader
          className="mb-4"
          title="Rumah Sakit Tersimpan"
          subtitle="Akses cepat ke pilihan yang kamu simpan."
          action={
            <Button
              onClick={() => navigate("/bookmark")}
              variant="subtle"
              size="sm"
              iconRight={<ChevronRight size={12} />}
            >
              Lihat Semua
            </Button>
          }
        />

        {loading ? (
          <Spinner />
        ) : saved.length === 0 ? (
          <EmptyState
            icon={<Bookmark size={24} />}
            title="Belum ada rumah sakit yang disimpan"
            description="Simpan rumah sakit favoritmu agar bisa diakses cepat dari sini."
            action={
              <Button
                onClick={() => navigate("/search")}
                icon={<Search size={15} />}
              >
                Jelajahi Rumah Sakit
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((h) => (
              <HospitalCard
                key={h.id}
                hospital={h}
                onDetail={(slug) => navigate(`/hospital/${slug}`)}
                onContact={openContact}
                bookmarked={isBookmarked(h.id)}
                onToggleBookmark={toggle}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <PageHeader
          className="mb-4"
          title="Riwayat Bantuan"
          subtitle="Percakapanmu dengan tim Admin HospitalLink."
          action={
            <Button
              onClick={() => navigate("/help")}
              variant="subtle"
              size="sm"
              iconRight={<ChevronRight size={12} />}
            >
              Buka Chat
            </Button>
          }
        />

        {convLoading ? (
          <Spinner />
        ) : recentConversations.length === 0 ? (
          <button
            onClick={() => navigate("/help")}
            className="flex w-full items-center gap-4 rounded-2xl border border-dashed border-border bg-surface px-5 py-6 text-left transition-colors hover:border-primary/30 hover:bg-primary-light"
          >
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
              <MessageCircle size={20} />
            </div>
            <div className="flex-1">
              <p className="font-display text-sm font-bold text-foreground">
                Belum ada percakapan bantuan
              </p>
              <p className="mt-0.5 text-xs text-muted">
                Butuh bantuan memilih rumah sakit? Chat langsung dengan Admin.
              </p>
            </div>
            <ChevronRight size={16} className="flex-shrink-0 text-subtle" />
          </button>
        ) : (
          <div className="divide-y divide-border-light overflow-hidden rounded-2xl border border-border bg-surface">
            {recentConversations.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate("/help")}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-primary-light"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <MessageCircle size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold text-foreground">
                    {c.subject || "Bantuan"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {c.last_message || "Belum ada pesan"}
                  </p>
                </div>
                <RelativeTime
                  value={c.last_message_at}
                  className="flex-shrink-0 text-xs text-subtle"
                />
              </button>
            ))}
          </div>
        )}
      </div>
      </div>
    </PageContainer>
  )
}
