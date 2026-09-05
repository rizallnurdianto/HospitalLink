import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Bookmark,
  Search,
  CheckCircle2,
  MapPin,
  ChevronRight,
} from "lucide-react"
import HospitalCard from "../components/common/HospitalCard"
import { useHospitals } from "../hooks/useHospitals"
import { useBookmarks } from "../hooks/useBookmarks"
import { useContact } from "../context/ContactContext"
import {
  Button,
  EmptyState,
  PageContainer,
  PageHeader,
  Spinner,
  StatCard,
} from "../components/ui"

export default function BookmarkPage() {
  const navigate = useNavigate()
  const { openContact } = useContact()
  const { hospitals, loading } = useHospitals("active")
  const { bookmarkIds, isBookmarked, toggle } = useBookmarks()

  const saved = useMemo(
    () =>
      hospitals
        .filter((h) => bookmarkIds.includes(h.id))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [hospitals, bookmarkIds],
  )

  const stats = useMemo(() => {
    const open24hCount = saved.filter((h) => h.is_open_24h).length
    const provinceCount = new Set(saved.map((h) => h.province).filter(Boolean))
      .size
    return [
      {
        icon: <Bookmark size={18} />,
        value: String(saved.length),
        label: "Rumah Sakit Tersimpan",
      },
      {
        icon: <CheckCircle2 size={18} />,
        value: String(open24hCount),
        label: "Buka 24 Jam",
      },
      {
        icon: <MapPin size={18} />,
        value: String(provinceCount),
        label: "Provinsi",
      },
    ]
  }, [saved])

  if (loading) {
    return (
      <PageContainer>
        <Spinner />
      </PageContainer>
    )
  }

  if (saved.length === 0) {
    return (
      <PageContainer>
        <EmptyState
          icon={<Bookmark size={26} />}
          title="Belum ada rumah sakit yang disimpan"
          description="Ketuk ikon bookmark pada kartu rumah sakit untuk menyimpannya di sini dan mengaksesnya kembali dengan cepat."
          action={
            <Button
              onClick={() => navigate("/search")}
              icon={<Search size={15} />}
            >
              Jelajahi Rumah Sakit
            </Button>
          }
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <StatCard
              key={s.label}
              icon={s.icon}
              value={s.value}
              label={s.label}
            />
          ))}
        </div>

        <div>
          <PageHeader
            className="mb-4"
            title="Rumah Sakit Tersimpan"
            subtitle="Akses cepat ke pilihanmu tanpa perlu mencari ulang."
            action={
              <Button
                onClick={() => navigate("/search")}
                variant="subtle"
                size="sm"
                iconRight={<ChevronRight size={13} />}
              >
                Jelajahi Lainnya
              </Button>
            }
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        </div>
      </div>
    </PageContainer>
  )
}
