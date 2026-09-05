import { useEffect } from "react"
import { Link } from "react-router-dom"
import SiteFooter from "../components/common/SiteFooter"
import { Button } from "../components/ui"

export type LegalDoc = "terms" | "privacy"

type Section = {
  heading: string
  paragraphs: string[]
}

type Doc = {
  title: string
  updated: string
  intro: string
  sections: Section[]
}

const DOCS: Record<LegalDoc, Doc> = {
  terms: {
    title: "Syarat & Ketentuan",
    updated: "1 September 2026",
    intro:
      "Dengan membuat akun atau menggunakan HospitalLink, Anda menyetujui syarat dan ketentuan berikut. Bacalah dengan saksama.",
    sections: [
      {
        heading: "Tentang layanan",
        paragraphs: [
          "HospitalLink adalah platform informasi direktori rumah sakit di Indonesia. Kami menyajikan data seperti layanan, fasilitas, kelas, jadwal dokter, dan jam operasional dalam satu tempat yang mudah dicari.",
          "Layanan ini bersifat informatif dan bukan pengganti nasihat, diagnosis, atau penanganan medis profesional. Untuk keadaan darurat, hubungi langsung layanan gawat darurat atau rumah sakit terdekat.",
        ],
      },
      {
        heading: "Keakuratan data",
        paragraphs: [
          "Seluruh data rumah sakit dikelola dan diverifikasi oleh tim Admin HospitalLink. Meski kami berupaya menjaga data tetap akurat, informasi dapat berubah sewaktu-waktu.",
          "Selalu konfirmasi langsung ke rumah sakit terkait sebelum berkunjung, terutama untuk jadwal dokter, ketersediaan layanan, dan jam operasional.",
        ],
      },
      {
        heading: "Akun Anda",
        paragraphs: [
          "Anda bertanggung jawab memberikan data yang benar saat mendaftar, menjaga kerahasiaan kata sandi, dan atas seluruh aktivitas yang terjadi pada akun Anda.",
          "Registrasi terbuka untuk siapa saja sebagai Pengguna. Akun yang terbukti disalahgunakan dapat dinonaktifkan tanpa pemberitahuan.",
        ],
      },
      {
        heading: "Perubahan layanan",
        paragraphs: [
          "HospitalLink dapat menambah, mengubah, atau menghentikan fitur kapan saja. Perubahan pada syarat ini akan ditampilkan di halaman ini dengan tanggal pembaruan yang diperbarui.",
        ],
      },
    ],
  },
  privacy: {
    title: "Kebijakan Privasi",
    updated: "1 September 2026",
    intro:
      "Kebijakan ini menjelaskan data apa yang kami kumpulkan, untuk apa digunakan, dan bagaimana Anda mengendalikannya.",
    sections: [
      {
        heading: "Data yang kami kumpulkan",
        paragraphs: [
          "Data akun yang Anda berikan: nama lengkap, alamat email, nomor HP, dan provinsi.",
          "Aktivitas dalam aplikasi: rumah sakit yang Anda simpan (bookmark) dan percakapan pada menu Bantuan.",
          "Jika Anda masuk dengan Google, kami menerima nama dan email dari akun Google Anda melalui proses masuk yang aman.",
        ],
      },
      {
        heading: "Bagaimana data digunakan",
        paragraphs: [
          "Menjalankan fitur inti: pencarian dan penyaringan rumah sakit, menyimpan favorit, serta layanan Bantuan.",
          "Menghubungkan Anda dengan tim Admin ketika Anda mengajukan pertanyaan atau meminta rekomendasi.",
          "Kami tidak menjual data Anda ke pihak ketiga dan tidak menggunakannya untuk iklan.",
        ],
      },
      {
        heading: "Siapa yang dapat mengakses",
        paragraphs: [
          "Data akun Anda hanya dapat diakses oleh Anda sendiri dan tim Admin HospitalLink sesuai kebutuhan operasional (misalnya menindaklanjuti percakapan Bantuan).",
          "Data disimpan pada infrastruktur Supabase dengan aturan akses baris (Row Level Security) yang membatasi setiap pengguna hanya pada datanya sendiri.",
        ],
      },
      {
        heading: "Kendali Anda",
        paragraphs: [
          "Anda dapat memperbarui nama, nomor HP, dan provinsi kapan saja lewat halaman Profil.",
          "Untuk menghapus akun beserta seluruh datanya, hubungi tim Admin lewat menu Bantuan.",
        ],
      },
    ],
  },
}

export default function LegalPage({ doc }: { doc: LegalDoc }) {
  const { title, updated, intro, sections } = DOCS[doc]

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [doc])

  const other: LegalDoc = doc === "terms" ? "privacy" : "terms"

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <span className="font-display text-base font-extrabold leading-none text-white">
                H
              </span>
            </span>
            <span className="font-display text-[15px] font-extrabold tracking-tight text-foreground">
              HospitalLink
            </span>
          </Link>
          <Link
            to="/"
            className="text-[13px] font-semibold text-muted transition-colors hover:text-foreground"
          >
            Beranda
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-primary">
          Dokumen Hukum
        </p>
        <h1 className="mt-3 font-display text-[28px] font-extrabold tracking-tight text-foreground sm:text-[34px]">
          {title}
        </h1>
        <p className="mt-2 text-[13px] text-subtle">
          Terakhir diperbarui: {updated}
        </p>
        <p className="mt-6 text-[15px] leading-relaxed text-muted">{intro}</p>

        <div className="mt-10 space-y-9">
          {sections.map((s, i) => (
            <section key={s.heading}>
              <h2 className="font-display text-[16px] font-bold text-foreground">
                {i + 1}. {s.heading}
              </h2>
              <div className="mt-2.5 space-y-3 text-[14px] leading-relaxed text-muted">
                {s.paragraphs.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 rounded-2xl border border-border bg-background p-5 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            Lihat juga{" "}
            <Link
              to={`/${
                other === "terms" ? "syarat-ketentuan" : "kebijakan-privasi"
              }`}
              className="font-semibold text-primary underline-offset-2 hover:underline"
            >
              {DOCS[other].title}
            </Link>
            .
          </span>
          <Button to="/register" size="md" className="w-fit">
            Kembali mendaftar
          </Button>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
