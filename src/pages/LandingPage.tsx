import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { AnimatePresence, motion, MotionConfig } from "framer-motion"
import {
  Search,
  Building2,
  CalendarClock,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
  Stethoscope,
  RefreshCw,
  ChevronDown,
} from "lucide-react"
import SiteFooter from "../components/common/SiteFooter"
import { Button } from "../components/ui"
import heroIllustration from "../assets/landing/hero-illustration.jpg"

/* ------------------------------- primitif ------------------------------- */

/** Memunculkan section dengan fade-up saat pertama kali masuk viewport. */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1], delay: delay / 1000 }}
    >
      {children}
    </motion.div>
  )
}

/** Gradien biru lembut + bola dekoratif yang dipakai di dashboard aplikasi. */
function GradientBand({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: "linear-gradient(135deg, #EEF3FD 0%, #D1E0FB 100%)",
      }}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary opacity-20" />
      <div className="pointer-events-none absolute -bottom-14 right-32 h-32 w-32 rounded-full bg-primary opacity-10" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-44 w-44 rounded-full bg-primary opacity-10" />
      <div className="relative">{children}</div>
    </div>
  )
}

function SectionHeading({
  eyebrow,
  title,
  description,
  center = false,
}: {
  eyebrow: string
  title: React.ReactNode
  description?: string
  center?: boolean
}) {
  return (
    <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.14em] text-primary">
        {eyebrow}
      </p>
      <h2 className="font-display text-[26px] font-bold leading-tight tracking-tight text-foreground sm:text-[32px]">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          {description}
        </p>
      )}
    </div>
  )
}

/* ---------------------------------- data ---------------------------------- */

const NAV_LINKS = [
  { href: "#beranda", label: "Beranda" },
  { href: "#keunggulan", label: "Keunggulan" },
  { href: "#cara-kerja", label: "Cara Kerja" },
  { href: "#pertanyaan-umum", label: "Pertanyaan Umum" },
]

const FAQS = [
  {
    q: "Apa itu HospitalLink?",
    a: "HospitalLink adalah platform informasi rumah sakit. Kami mengumpulkan data rumah sakit (layanan, fasilitas, kelas, jadwal dokter, dan jam operasional) dalam satu tempat yang mudah dicari, sehingga Anda tidak perlu berpindah-pindah situs.",
  },
  {
    q: "Apakah HospitalLink gratis?",
    a: "Ya. Membuat akun dan mencari informasi rumah sakit sepenuhnya gratis untuk semua pengguna.",
  },
  {
    q: "Apakah saya bisa mendaftar berobat atau booking lewat HospitalLink?",
    a: "Belum. HospitalLink bersifat informasi. Untuk membuat janji atau mendaftar, hubungi langsung rumah sakit yang bersangkutan lewat nomor yang tertera di halaman detailnya.",
  },
  {
    q: "Dari mana data rumah sakitnya berasal?",
    a: "Seluruh data dikelola dan diverifikasi oleh tim Admin HospitalLink. Setiap perubahan langsung tampil di halaman pencarian, dan waktu terakhir diperbarui selalu terlihat.",
  },
  {
    q: "Apakah jadwal dokter bersifat real-time?",
    a: "Tidak. Jadwal dokter dan jam operasional bersifat informatif dan dapat berubah. Selalu konfirmasi ke rumah sakit terkait sebelum berkunjung.",
  },
  {
    q: "Bagaimana cara mulai menggunakannya?",
    a: 'Klik "Mulai Sekarang", buat akun gratis lewat email atau Google, lengkapi profil singkat, lalu langsung cari rumah sakit sesuai kebutuhan Anda.',
  },
]

/* ----------------------------------- nav ---------------------------------- */

function TopNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all ${
        scrolled
          ? "border-b border-border bg-surface/90 backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <a href="#beranda" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <span className="font-display text-base font-extrabold leading-none text-white">
              H
            </span>
          </span>
          <span className="font-display text-[15px] font-extrabold tracking-tight text-foreground">
            HospitalLink
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] font-semibold text-muted transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button to="/login" variant="ghost" size="md">
            Masuk
          </Button>
          <Button to="/register" size="md">
            Mulai Sekarang
          </Button>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted md:hidden"
        >
          {open ? <X size={17} /> : <Menu size={17} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-border bg-surface md:hidden"
          >
            <div className="flex flex-col px-5 py-3">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-2.5 text-sm font-semibold text-muted"
                >
                  {l.label}
                </a>
              ))}
              <div className="mt-2 flex gap-2">
                <Button to="/login" variant="secondary" size="md" block>
                  Masuk
                </Button>
                <Button to="/register" size="md" block>
                  Mulai Sekarang
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

/* --------------------------- visual hero: orang mencari rumah sakit --------------------------- */

function HeroVisual() {
  return (
    <img
      src={heroIllustration}
      alt="Ilustrasi seseorang duduk santai mencari informasi rumah sakit lewat HospitalLink di ponselnya"
      className="w-full rounded-2xl border border-border shadow-xl shadow-primary/10"
      width={856}
      height={710}
    />
  )
}

/* ----------------------------------- faq ---------------------------------- */

function FaqItem({ q, a }: typeof FAQS[number]) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-surface">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-display text-[14px] font-bold text-foreground">
          {q}
        </span>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 text-subtle transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-[13px] leading-relaxed text-muted">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ---------------------------------- halaman ---------------------------------- */

export default function LandingPage() {
  // Navigasi client-side (mis. link footer dari halaman lain) mengubah hash
  // URL, tapi — beda dari klik anchor sungguhan — browser tidak otomatis
  // scroll ke sana karena tidak ada reload sama sekali.
  const location = useLocation()
  useEffect(() => {
    if (!location.hash) return
    const el = document.querySelector(location.hash)
    el?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [location.hash])

  const features = [
    {
      icon: <Search size={20} />,
      title: "Pencarian Rumah Sakit",
      body: "Cari dan saring rumah sakit berdasarkan provinsi, jenis, kelas, tipe, dan ketersediaan 24 jam.",
    },
    {
      icon: <Building2 size={20} />,
      title: "Informasi Fasilitas & Kelas",
      body: "Lihat fasilitas medis, kelas rumah sakit (A–D), dan jam operasional yang dikelola admin HospitalLink.",
    },
    {
      icon: <CalendarClock size={20} />,
      title: "Jadwal Dokter & Spesialis",
      body: "Informasi jadwal praktik dokter dan spesialis sebagai referensi awal sebelum menghubungi rumah sakit.",
    },
    {
      icon: <MessageSquare size={20} />,
      title: "Bantuan dari Admin",
      body: "Chat langsung dengan Admin HospitalLink untuk menanyakan informasi atau meminta rekomendasi.",
    },
  ]

  const steps = [
    {
      n: "01",
      title: "Daftar atau masuk",
      body: "Buat akun gratis dalam beberapa detik lewat email atau akun Google.",
    },
    {
      n: "02",
      title: "Lengkapi profil",
      body: "Isi nama, nomor HP, dan provinsi sekali saja agar hasil pencarian lebih sesuai.",
    },
    {
      n: "03",
      title: "Cari & saring sesuai kebutuhan",
      body: "Gunakan filter lokasi, layanan, tipe, dan jam buka untuk mempersempit pilihan.",
    },
    {
      n: "04",
      title: "Lihat detail atau tanya Admin",
      body: "Buka profil lengkap rumah sakit, simpan untuk nanti, atau tanyakan langsung ke Admin HospitalLink.",
    },
  ]

  return (
    <MotionConfig reducedMotion="user">
    <div id="beranda" className="min-h-dvh bg-background text-foreground">
      <TopNav />

      {/* ---------------------------------- hero --------------------------------- */}
      <GradientBand>
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-16 sm:px-8 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[1.02fr_0.98fr] lg:py-24">
          <Reveal>
            <h1 className="font-display text-[34px] font-bold leading-[1.12] tracking-tight text-foreground sm:text-[44px]">
              Temukan rumah sakit yang{" "}
              <span className="text-primary">sesuai dengan kebutuhan Anda</span>
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-muted">
              Cari rumah sakit di sekitar Anda berdasarkan layanan, fasilitas,
              dan jenis rumah sakit. Dapatkan informasi yang jelas dan
              terkelola dalam satu tempat bersama HospitalLink.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button to="/register" size="lg">
                Daftar Gratis
                <ArrowRight size={17} />
              </Button>
              <Button to="/login" variant="secondary" size="lg">
                Sudah punya akun? Masuk
              </Button>
            </div>
            <div className="mt-8 flex flex-col gap-3 border-t border-border-light pt-6">
              {[
                { icon: <ShieldCheck size={14} />, label: "Dikelola & diverifikasi admin" },
                { icon: <RefreshCw size={14} />, label: "Buka 24 Jam & IGD diperbarui berkala" },
                { icon: <CheckCircle2 size={14} />, label: "Gratis digunakan" },
              ].map((t) => (
                <div key={t.label} className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                    {t.icon}
                  </span>
                  <span className="text-[12.5px] font-medium text-foreground/80">
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <HeroVisual />
          </Reveal>
        </div>
      </GradientBand>

      {/* --------------------------------- fitur ---------------------------- */}
      <section id="keunggulan" className="scroll-mt-20 bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
          <Reveal>
            <SectionHeading
              eyebrow="Keunggulan"
              title="Semua yang Anda butuhkan untuk memilih dengan yakin"
              center
            />
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {features.map((f, i) => (
              <Reveal
                key={f.title}
                delay={i * 80}
                className="group flex gap-4 rounded-2xl border border-border bg-surface p-6 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  {f.icon}
                </div>
                <div>
                  <p className="font-display text-[15px] font-bold text-foreground">
                    {f.title}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                    {f.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-6">
            <p className="flex items-center justify-center gap-1.5 text-center text-[12px] text-subtle">
              <Stethoscope size={12} />
              Jadwal dokter dan jam operasional bersifat informatif dan dapat
              berubah. Selalu konfirmasi ke rumah sakit terkait.
            </p>
          </Reveal>
        </div>
      </section>

      {/* -------------------------------- cara kerja ------------------------- */}
      <section id="cara-kerja" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
          <Reveal>
            <SectionHeading
              eyebrow="Cara Kerja"
              title="Mulai dalam empat langkah sederhana"
              center
            />
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 90} className="relative">
                <div className="h-full rounded-2xl border border-border bg-surface p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light font-display text-sm font-extrabold text-primary">
                    {s.n}
                  </span>
                  <p className="mt-4 font-display text-[16px] font-bold text-foreground">
                    {s.title}
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted">
                    {s.body}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <ArrowRight
                    size={18}
                    className="absolute -right-3 top-1/2 hidden -translate-y-1/2 translate-x-1/2 text-subtle lg:block"
                  />
                )}
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-10 text-center">
            <Button to="/register" size="lg">
              Mulai Sekarang
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ----------------------------------- faq ------------------------------- */}
      <section id="pertanyaan-umum" className="scroll-mt-20 bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
          <Reveal>
            <SectionHeading
              eyebrow="Pertanyaan Umum"
              title="Pertanyaan yang sering diajukan"
              center
            />
          </Reveal>
          <Reveal className="mx-auto mt-10 max-w-3xl">
            <div className="divide-y divide-border-light overflow-hidden rounded-2xl border border-border">
              {FAQS.map((f) => (
                <FaqItem key={f.q} q={f.q} a={f.a} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* --------------------------------- cta akhir --------------------------- */}
      <section>
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
          <Reveal>
            <GradientBand className="rounded-2xl border border-border px-6 py-14 text-center sm:px-12">
              <h2 className="mx-auto max-w-xl font-display text-[26px] font-bold leading-tight tracking-tight text-foreground sm:text-[32px]">
                Siap menemukan rumah sakit yang tepat?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-muted">
                Buat akun gratis dan mulai mencari informasi rumah sakit
                sesuai kebutuhan Anda hari ini.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button to="/register" size="lg">
                  Daftar Gratis
                  <ArrowRight size={17} />
                </Button>
                <Button to="/login" variant="secondary" size="lg">
                  Masuk
                </Button>
              </div>
            </GradientBand>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
    </MotionConfig>
  )
}
