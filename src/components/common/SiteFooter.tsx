import { Link } from "react-router-dom"
import { ShieldCheck } from "lucide-react"

type FooterLink = {
  to: string
  label: string
}

type FooterColumn = {
  title: string
  links: FooterLink[]
}

const COLUMNS: FooterColumn[] = [
  {
    title: "Jelajahi",
    links: [
      { to: "/search", label: "Cari Rumah Sakit" },
      { to: "/#keunggulan", label: "Layanan & Fasilitas" },
      { to: "/#cara-kerja", label: "Cara Kerja" },
    ],
  },
  {
    title: "Bantuan",
    links: [
      { to: "/help", label: "Pusat Bantuan" },
      { to: "/help", label: "Hubungi Admin" },
      { to: "/#pertanyaan-umum", label: "Pertanyaan Umum" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/syarat-ketentuan", label: "Syarat & Ketentuan" },
      { to: "/kebijakan-privasi", label: "Kebijakan Privasi" },
    ],
  },
]

/** Footer bersama untuk halaman publik (landing + legal). */
export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                <span className="font-display text-base font-extrabold text-white">
                  H
                </span>
              </span>
              <span className="font-display text-sm font-extrabold text-foreground">
                HospitalLink
              </span>
            </Link>
            <p className="mt-3.5 max-w-xs text-[12.5px] leading-relaxed text-muted">
              Platform yang membantu Anda menemukan dan melihat informasi rumah
              sakit dalam satu tempat.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="font-display text-[11px] font-bold uppercase tracking-wider text-subtle">
                {col.title}
              </p>
              <ul className="mt-3.5 flex flex-col gap-2.5 text-[13px] text-muted">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="transition-colors hover:text-primary"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border-light pt-6 sm:flex-row">
          <p className="text-[12px] text-subtle">
            © {new Date().getFullYear()} HospitalLink. Semua hak dilindungi.
          </p>
          <p className="flex items-center gap-1.5 text-[12px] text-subtle">
            <ShieldCheck size={12} className="flex-shrink-0 text-primary/70" />
            Informasi rumah sakit dikelola oleh tim Admin HospitalLink.
          </p>
        </div>
      </div>
    </footer>
  )
}
