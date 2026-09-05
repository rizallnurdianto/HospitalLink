import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  Bookmark,
  Building2,
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  Stethoscope,
  ListChecks,
  CircleCheck,
  Ambulance,
  Award,
  Info,
  Globe,
  Navigation,
  Images,
  Landmark,
  X,
  Maximize2,
} from "lucide-react"
import { useHospital, useHospitals } from "../hooks/useHospitals"
import { useBookmarks } from "../hooks/useBookmarks"
import { useContact } from "../context/ContactContext"
import { formatDate } from "../lib/format"
import { whatsAppHref } from "../lib/whatsapp"
import { classLabel } from "../lib/hospitalClasses"
import { Spinner } from "../components/ui"

type Tab = "layanan" | "dokter" | "fasilitas" | "jam"

type InfoRow = {
  label: string
  value: React.ReactNode
}

/** Inisial dari nama dokter, mengabaikan gelar seperti "dr." / "Prof.". */
function doctorInitials(name: string) {
  const words = name
    .replace(/\b(dr|drg|prof|sp)\.?\b/gi, "")
    .split(/[\s,.]+/)
    .filter(Boolean)
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase() || "DR"
}

function galleryImages(base: string) {
  const url = base.split("?")[0]
  return [
    `${url}?w=480&h=320&fit=crop&crop=center&auto=format`,
    `${url}?w=200&h=140&fit=crop&crop=top&auto=format`,
    `${url}?w=200&h=140&fit=crop&crop=bottom&auto=format`,
    `${url}?w=200&h=140&fit=crop&crop=entropy&auto=format`,
  ]
}

function galleryImagesLarge(base: string) {
  const url = base.split("?")[0]
  return [
    `${url}?w=1400&h=900&fit=crop&crop=center&auto=format`,
    `${url}?w=1400&h=900&fit=crop&crop=top&auto=format`,
    `${url}?w=1400&h=900&fit=crop&crop=bottom&auto=format`,
    `${url}?w=1400&h=900&fit=crop&crop=entropy&auto=format`,
  ]
}

function PhotoGalleryModal({
  photos,
  thumbnails,
  hospitalName,
  initialIndex,
  onClose,
}: {
  photos: string[]
  thumbnails: string[]
  hospitalName: string
  initialIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(initialIndex)
  const goPrev = () => setIndex((i) => (i - 1 + photos.length) % photos.length)
  const goNext = () => setIndex((i) => (i + 1) % photos.length)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col p-3 sm:p-6"
      style={{ backgroundColor: "rgba(14, 23, 38, 0.92)" }}
      onClick={onClose}
    >
      <div className="flex flex-shrink-0 items-center justify-between text-white">
        <p className="truncate font-display text-sm font-semibold">
          {hospitalName}
        </p>
        <div className="flex flex-shrink-0 items-center gap-3">
          <span className="text-xs text-white/70">
            {index + 1} / {photos.length}
          </span>
          <button
            onClick={onClose}
            aria-label="Tutup galeri foto"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={goPrev}
          aria-label="Foto sebelumnya"
          className="absolute left-0 z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-2"
        >
          <ChevronLeft size={20} />
        </button>
        <img
          src={photos[index]}
          alt={`${hospitalName}, foto ${index + 1}`}
          className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
        />
        <button
          onClick={goNext}
          aria-label="Foto berikutnya"
          className="absolute right-0 z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-2"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div
        className="scrollbar-hide flex flex-shrink-0 items-center justify-center gap-2 overflow-x-auto pb-1"
        onClick={(e) => e.stopPropagation()}
      >
        {thumbnails.map((src, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
              index === i
                ? "border-white"
                : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}

export default function HospitalDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { openContact } = useContact()
  const { hospital, loading } = useHospital(slug)
  const { isBookmarked, toggle } = useBookmarks()
  const { hospitals: others } = useHospitals("active")

  const [activeTab, setActiveTab] = useState<Tab>("layanan")
  const [activePhoto, setActivePhoto] = useState(0)
  const [galleryOpen, setGalleryOpen] = useState(false)

  // reset foto yang dipilih saat berpindah ke rumah sakit lain
  useEffect(() => {
    setActivePhoto(0)
    setGalleryOpen(false)
  }, [slug])

  if (loading) return <Spinner label="Memuat rumah sakit…" />

  if (!hospital) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <Building2 size={28} className="text-subtle" />
        <p className="font-display text-base font-bold text-foreground">
          Rumah sakit tidak tersedia
        </p>
        <p className="max-w-xs text-sm text-muted">
          Data ini mungkin sudah dinonaktifkan oleh admin atau tautannya tidak
          valid.
        </p>
        <button
          onClick={() => navigate("/search")}
          className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
        >
          Kembali ke Pencarian
        </button>
      </div>
    )
  }

  const bookmarked = isBookmarked(hospital.id)
  const fallbackImg =
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=340&fit=crop&auto=format"
  const baseImage = hospital.image_url || fallbackImg
  const uploaded = (hospital.images ?? []).filter(Boolean)
  const photos = uploaded.length > 0 ? uploaded : galleryImages(baseImage)
  const photosLarge =
    uploaded.length > 0 ? uploaded : galleryImagesLarge(baseImage)
  const isSwasta = hospital.type !== "Rumah Sakit Pemerintah"
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.address)}`

  const tabs: {
    id: Tab
    label: string
    icon: React.ReactNode
  }[] = [
    { id: "layanan", label: "Layanan", icon: <ListChecks size={13} /> },
    { id: "dokter", label: "Dokter & Spesialis", icon: <Stethoscope size={13} /> },
    { id: "fasilitas", label: "Fasilitas", icon: <Building2 size={13} /> },
    { id: "jam", label: "Jam Operasional", icon: <Clock size={13} /> },
  ]

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="sticky top-0 z-20 flex h-[52px] items-center justify-between border-b border-border-light bg-background/90 px-4 backdrop-blur-md sm:px-7">
        <button
          onClick={() => navigate("/search")}
          className="flex items-center gap-1.5 py-1.5 text-[13px] font-semibold text-muted transition-colors hover:text-primary"
        >
          <ArrowLeft size={15} />
          Cari Rumah Sakit
        </button>
        <div className="hidden items-center gap-1.5 sm:flex">
          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-success" />
          <span className="text-[11px] text-subtle">
            Diperbarui {formatDate(hospital.updated_at)}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-[980px] px-4 py-6 sm:px-7 sm:pb-14">
        <div className="mb-5 grid grid-cols-1 overflow-hidden rounded-3xl border border-border bg-surface shadow-sm md:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col justify-between p-6 sm:p-8">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md px-2.5 py-1 text-[11px] font-bold tracking-wide ${
                    isSwasta
                      ? "bg-primary-light text-primary"
                      : "bg-success-light text-success"
                  }`}
                >
                  {isSwasta ? "RS Swasta" : "RS Pemerintah"}
                </span>
                {hospital.category && (
                  <span className="rounded-md bg-background px-2.5 py-1 text-[11px] font-bold tracking-wide text-muted">
                    {hospital.category}
                  </span>
                )}
                {hospital.is_open_24h ? (
                  <span className="flex items-center gap-1 rounded-md bg-success-light px-2.5 py-1 text-[11px] font-bold text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    Buka 24 Jam
                  </span>
                ) : (
                  <span className="rounded-md bg-warning-light px-2.5 py-1 text-[11px] font-bold text-warning">
                    Tutup {hospital.closing_time}
                  </span>
                )}
              </div>

              <h1 className="mb-1.5 font-display text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-[26px]">
                {hospital.name}
              </h1>

              {(hospital.location || hospital.province) && (
                <p className="mb-3 text-[13px] font-semibold text-primary">
                  {[hospital.location, hospital.province]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}

              <div className="mb-5 flex items-start gap-1.5 text-muted">
                <MapPin
                  size={13}
                  className="mt-0.5 flex-shrink-0 text-primary"
                />
                <span className="text-[13px] leading-relaxed">
                  {hospital.address}
                </span>
              </div>

              <div className="mb-5 flex flex-wrap gap-1.5">
                {hospital.services.slice(0, 5).map((s) => (
                  <span
                    key={s}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted"
                  >
                    <CircleCheck size={12} className="text-primary" />
                    {s}
                  </span>
                ))}
                {hospital.services.length > 5 && (
                  <span className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-subtle">
                    +{hospital.services.length - 5} lainnya
                  </span>
                )}
              </div>

              <div className="mb-7 flex flex-wrap gap-2.5">
                {[
                  {
                    icon: <Award size={13} />,
                    text: classLabel(hospital.hospital_class),
                  },
                  ...(hospital.established
                    ? [
                        {
                          icon: <CalendarDays size={13} />,
                          text: `Berdiri ${hospital.established}`,
                        },
                      ]
                    : []),
                ].map((f) => (
                  <div
                    key={f.text}
                    className="flex items-center gap-1.5 rounded-lg border border-border-light bg-background px-2.5 py-1.5 text-xs text-muted"
                  >
                    <span className="text-primary">{f.icon}</span>
                    {f.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => openContact(hospital)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 font-display text-sm font-bold tracking-wide text-white transition-colors hover:bg-primary-hover"
              >
                <Phone size={16} />
                Hubungi Rumah Sakit
              </button>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-border py-2.5 font-display text-[13px] font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Navigation size={14} />
                  Lihat Lokasi
                </a>
                <button
                  onClick={() => toggle(hospital.id)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border-[1.5px] py-2.5 font-display text-[13px] font-semibold transition-colors ${
                    bookmarked
                      ? "border-primary bg-primary-light text-primary"
                      : "border-border text-foreground"
                  }`}
                >
                  <Bookmark
                    size={14}
                    fill={bookmarked ? "currentColor" : "none"}
                  />
                  {bookmarked ? "Tersimpan" : "Simpan"}
                </button>
              </div>
            </div>
          </div>

          <div className="relative flex flex-col gap-1 p-2.5 pt-0 md:pt-2.5 md:pl-0">
            <button
              onClick={() => setGalleryOpen(true)}
              className="group relative min-h-[220px] flex-1 overflow-hidden rounded-2xl"
            >
              <img
                src={photos[Math.min(activePhoto, photos.length - 1)]}
                alt={hospital.name}
                className="h-full w-full object-cover transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/30">
                <span className="flex items-center gap-1.5 rounded-full bg-white/0 px-3 py-1.5 text-[11px] font-bold text-white opacity-0 backdrop-blur-sm transition-all group-hover:bg-white/20 group-hover:opacity-100">
                  <Maximize2 size={12} />
                  Lihat Semua Foto
                </span>
              </div>
            </button>

            {photos.length > 1 && (
              <div className="grid grid-cols-4 gap-1">
                {photos.slice(1, 4).map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i + 1)}
                    className={`h-[68px] overflow-hidden rounded-xl border-2 ${
                      activePhoto === i + 1
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={src}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
                <button
                  onClick={() => setGalleryOpen(true)}
                  className="flex h-[68px] flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-border bg-background text-muted transition-colors hover:border-primary hover:text-primary"
                >
                  <Images size={14} />
                  <span className="text-[10px] font-bold">Semua</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {galleryOpen && (
          <PhotoGalleryModal
            photos={photosLarge}
            thumbnails={photos}
            hospitalName={hospital.name}
            initialIndex={Math.min(activePhoto, photosLarge.length - 1)}
            onClose={() => setGalleryOpen(false)}
          />
        )}

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_300px]">
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h3 className="mb-2.5 font-display text-sm font-bold text-foreground">
                Tentang Rumah Sakit
              </h3>
              <p className="text-[13px] leading-relaxed text-muted">
                {hospital.description}
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="flex overflow-x-auto border-b border-border px-1.5">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap border-b-[2.5px] px-2 py-3.5 font-display text-xs font-bold ${
                        isActive
                          ? "border-primary text-primary"
                          : "border-transparent text-muted"
                      }`}
                    >
                      <span className={isActive ? "opacity-100" : "opacity-55"}>
                        {tab.icon}
                      </span>
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              <div className="p-5">
                {activeTab === "layanan" && (
                  <div className="flex flex-col gap-3.5">
                    <p className="text-xs text-muted">
                      Layanan kesehatan yang tersedia di{" "}
                      {hospital.short_name || hospital.name}.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {hospital.services.map((s) => (
                        <span
                          key={s}
                          className="flex items-center gap-1.5 rounded-lg border border-primary-light bg-primary-light px-3.5 py-2 text-xs font-semibold text-primary"
                        >
                          <CircleCheck size={13} />
                          {s}
                        </span>
                      ))}
                    </div>
                    {hospital.is_open_24h && (
                      <div className="flex items-center gap-3 rounded-2xl border border-success-light bg-success-light px-4 py-3.5">
                        <Ambulance
                          size={18}
                          className="flex-shrink-0 text-success"
                        />
                        <div>
                          <p className="mb-0.5 font-display text-[13px] font-bold text-foreground">
                            IGD Tersedia 24 Jam
                          </p>
                          <p className="text-xs text-success">
                            Layanan darurat siap melayani setiap saat tanpa
                            perlu jadwal.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "dokter" && (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-start gap-2.5 rounded-xl border border-warning-light bg-warning-light px-3.5 py-3">
                      <Info
                        size={14}
                        className="mt-0.5 flex-shrink-0 text-warning"
                      />
                      <p className="text-xs leading-relaxed text-warning">
                        Jadwal dokter bersifat informatif dan dapat berubah.
                        Hubungi rumah sakit untuk konfirmasi ketersediaan
                        terkini.
                      </p>
                    </div>

                    {hospital.specialists.map((doc) => (
                      <div
                        key={doc.name}
                        className="flex items-center gap-3.5 rounded-2xl border border-border bg-background p-4"
                      >
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-light font-display text-sm font-bold text-primary">
                          {doctorInitials(doc.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-[13px] font-bold text-foreground">
                            {doc.name}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                            <Clock size={11} className="flex-shrink-0" />
                            {doc.schedule}
                          </p>
                        </div>
                      </div>
                    ))}

                    <div className="mt-1 flex items-center gap-3.5 rounded-2xl border border-primary-light bg-primary-light px-4 py-3.5">
                      <Phone size={18} className="flex-shrink-0 text-primary" />
                      <div className="flex-1">
                        <p className="mb-0.5 font-display text-[13px] font-bold text-foreground">
                          Tanyakan jadwal dokter terbaru
                        </p>
                        <p className="text-xs text-muted">
                          Konfirmasi ketersediaan spesialis langsung ke rumah
                          sakit.
                        </p>
                      </div>
                      <button
                        onClick={() => openContact(hospital)}
                        className="flex-shrink-0 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white"
                      >
                        Hubungi
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "fasilitas" && (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-muted">
                      Fasilitas dan peralatan medis yang dimiliki{" "}
                      {hospital.short_name || hospital.name}.
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {hospital.facilities.map((f) => (
                        <div
                          key={f}
                          className="flex items-center gap-2.5 rounded-xl border border-border bg-background px-3.5 py-3"
                        >
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary-light">
                            <CheckCircle2 size={13} className="text-primary" />
                          </div>
                          <span className="text-xs font-semibold text-foreground">
                            {f}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "jam" && (
                  <div className="flex flex-col gap-2">
                    {hospital.operational_hours.map((oh, i) => {
                      const is24h = oh.hours.includes("24")
                      return (
                        <div
                          key={i}
                          className={`flex items-center justify-between rounded-2xl border px-[18px] py-3.5 ${
                            is24h
                              ? "border-success-light bg-success-light"
                              : "border-border bg-background"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                is24h ? "bg-success" : "bg-subtle"
                              }`}
                            />
                            <span
                              className={`text-[13px] font-semibold ${
                                is24h ? "text-success" : "text-foreground"
                              }`}
                            >
                              {oh.day}
                            </span>
                          </div>
                          <span
                            className={`text-[13px] font-bold ${
                              is24h ? "text-success" : "text-foreground"
                            }`}
                          >
                            {oh.hours}
                          </span>
                        </div>
                      )
                    })}
                    <div className="mt-1 flex items-start gap-2.5 rounded-xl border border-warning-light bg-warning-light px-3.5 py-3">
                      <Info
                        size={14}
                        className="mt-0.5 flex-shrink-0 text-warning"
                      />
                      <p className="text-xs leading-relaxed text-warning">
                        Jam operasional dapat berubah pada hari libur nasional.
                        Hubungi rumah sakit untuk informasi terkini.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <div className="overflow-hidden rounded-2xl border border-border bg-surface">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="relative flex h-[110px] items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, #EEF3FD 0%, #E0E7FF 100%)",
                }}
              >
                <div
                  className="absolute inset-0 opacity-70"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(26,84,195,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(26,84,195,0.07) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />
                <div className="relative z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-primary shadow-[0_0_0_8px_rgba(26,84,195,0.14)]">
                  <MapPin size={16} className="text-white" />
                </div>
                <span className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[10px] font-bold text-white">
                  <Navigation size={9} />
                  Buka di Maps
                </span>
              </a>

              <div className="flex flex-col gap-3 p-4">
                <div className="flex gap-2.5">
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-light">
                    <MapPin size={13} className="text-primary" />
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-subtle">
                      Alamat
                    </p>
                    <p className="text-xs leading-relaxed text-foreground">
                      {hospital.address}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-border-light" />

                <a
                  href={whatsAppHref(hospital.phone)}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-2.5"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-success-light">
                    <Phone size={13} className="text-success" />
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-subtle">
                      WhatsApp
                    </p>
                    <p className="font-display text-[13px] font-bold text-foreground group-hover:text-primary">
                      {hospital.phone}
                    </p>
                  </div>
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-surface p-[18px]">
              <p className="mb-0.5 font-display text-[13px] font-bold text-foreground">
                Informasi Umum
              </p>
              {([
                ...(hospital.category
                  ? [{ label: "Kategori", value: hospital.category }]
                  : []),
                {
                  label: "Kelas Rumah Sakit",
                  value: hospital.hospital_class
                    ? `Kelas ${hospital.hospital_class}`
                    : "Belum tercantum",
                },
                {
                  label: "Tipe Rumah Sakit",
                  value: (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        isSwasta
                          ? "bg-primary-light text-primary"
                          : "bg-success-light text-success"
                      }`}
                    >
                      {isSwasta ? (
                        <Building2 size={11} />
                      ) : (
                        <Landmark size={11} />
                      )}
                      {isSwasta ? "Swasta" : "Pemerintah"}
                    </span>
                  ),
                },
                ...(hospital.established
                  ? [
                      {
                        label: "Tahun Berdiri",
                        value: String(hospital.established),
                      },
                    ]
                  : []),
                {
                  label: "Spesialis",
                  value: `${hospital.specialists.length} dokter`,
                },
              ] satisfies InfoRow[]).map((item) => (
                <div
                  key={item.label}
                  className="flex min-h-[38px] items-center justify-between gap-3 rounded-lg bg-background px-3 py-2"
                >
                  <span className="text-xs text-muted">{item.label}</span>
                  {typeof item.value === "string" ? (
                    <span className="font-display text-xs font-bold text-foreground">
                      {item.value}
                    </span>
                  ) : (
                    item.value
                  )}
                </div>
              ))}
              <div className="mt-1 flex items-center gap-1.5 border-t border-border-light pt-2.5">
                <Globe size={11} className="text-subtle" />
                <span className="text-[11px] text-subtle">
                  Data diperbarui {formatDate(hospital.updated_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-7">
          <div className="mb-3.5 flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-foreground">
              Rumah Sakit Lainnya
            </h3>
            <button
              onClick={() => navigate("/search")}
              className="flex items-center gap-1 text-xs font-semibold text-primary"
            >
              Lihat Semua <ChevronRight size={13} />
            </button>
          </div>
          <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-1">
            {others
              .filter((h) => h.slug !== slug)
              .slice(0, 5)
              .map((h) => (
                <button
                  key={h.id}
                  onClick={() => navigate(`/hospital/${h.slug}`)}
                  className="w-44 flex-shrink-0 overflow-hidden rounded-2xl border border-border bg-surface text-left transition-colors hover:border-primary hover:shadow-md"
                >
                  <div className="h-[88px] overflow-hidden">
                    {h.image_url && (
                      <img
                        src={h.image_url}
                        alt={h.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="mb-1 truncate font-display text-xs font-bold text-foreground">
                      {h.short_name || h.name}
                    </p>
                    <p className="flex items-center gap-1 text-[11px] text-muted">
                      <MapPin size={10} />
                      {h.location}
                    </p>
                  </div>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
