/**
 * Design system HospitalLink; satu-satunya sumber UI bersama.
 *
 * Setiap portal (admin, pengguna, auth, landing) dibangun dari primitif ini agar
 * produk terasa sebagai satu sistem. Aturan:
 *   - radius: card = rounded-2xl, control = rounded-xl, chip = rounded-lg, pill = rounded-full
 *   - fokus input: border-primary + ring-4 ring-primary/10 (focus-within)
 *   - warna hanya dari theme token (primary / success / danger / warning / muted / subtle)
 *
 * Lebih baik pakai ulang komponen di sini daripada membuat varian sendiri di halaman.
 */
import {
  forwardRef,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react"
import { Link } from "react-router-dom"
import { useDismissable } from "../../hooks/useDismissable"
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Info,
  Loader2,
  MoreVertical,
  Search,
  X,
} from "lucide-react"
import type { ConversationStatus } from "../../types/db"
import { dataFreshness } from "../../lib/format"

/* ------------------------------------------------------------------ layout -- */

/** Wrapper isi halaman standar; lebar maks & padding sama di setiap rute. */
export function PageContainer({
  children,
  className = "",
  size = "default",
}: {
  children: ReactNode
  className?: string
  /** `narrow` (max-w-3xl) untuk form / bacaan; `default` (max-w-6xl) selain itu. */
  size?: "default" | "narrow"
}) {
  const max = size === "narrow" ? "max-w-3xl" : "max-w-6xl"
  return (
    <div
      className={`mx-auto w-full ${max} px-4 py-5 sm:px-6 sm:py-6 lg:px-8 ${className}`}
    >
      {children}
    </div>
  )
}

/** Header seksi dalam konten; judul + subjudul opsional + aksi opsional di kanan. */
export function PageHeader({
  title,
  subtitle,
  action,
  className = "",
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 ${className}`}
    >
      <div className="min-w-0">
        <h2 className="font-display text-[17px] font-bold leading-tight tracking-tight text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-xs leading-relaxed text-muted">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex flex-shrink-0 gap-2">{action}</div>}
    </div>
  )
}

export function Divider({ className = "" }: { className?: string }) {
  return <div className={`h-px bg-border-light ${className}`} />
}

/* ----------------------------------------------------------------- permukaan -- */

export function Card({
  children,
  className = "",
  as: As = "div",
  ...rest
}: {
  children: ReactNode
  className?: string
  as?: "div" | "section" | "article"
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <As
      className={`rounded-2xl border border-border bg-surface ${className}`}
      {...rest}
    >
      {children}
    </As>
  )
}

/** Judul ringan di dalam card berpadding (tanpa garis pembatas). */
export function CardTitle({
  children,
  hint,
  action,
}: {
  children: ReactNode
  hint?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-display text-[13px] font-bold text-foreground">
          {children}
        </p>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

/** Baris header rata atas pada Card tanpa padding; judul + hint, jumlah, aksi. */
export function SectionHeader({
  title,
  hint,
  icon,
  count,
  action,
  className = "",
}: {
  title: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  count?: number
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex items-start justify-between gap-3 border-b border-border-light px-5 py-3.5 ${className}`}
    >
      <div className="flex min-w-0 items-center gap-2">
        {icon && <span className="flex-shrink-0 text-primary">{icon}</span>}
        <div className="min-w-0">
          <p className="font-display text-[13px] font-bold text-foreground">
            {title}
            {typeof count === "number" && count > 0 && (
              <span className="ml-1.5 rounded-full bg-primary-light px-1.5 py-0.5 text-[11px] font-bold text-primary">
                {count}
              </span>
            )}
          </p>
          {hint && <p className="mt-0.5 text-[11px] text-muted">{hint}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

/** Motif "chip ikon persegi" yang berulang di berbagai tempat. */
export function IconTile({
  children,
  size = "md",
  tone = "primary",
  className = "",
}: {
  children: ReactNode
  size?: "sm" | "md" | "lg"
  tone?: "primary" | "success" | "danger" | "warning" | "muted"
  className?: string
}) {
  const dims =
    size === "sm" ? "h-8 w-8" : size === "lg" ? "h-11 w-11" : "h-9 w-9"
  const tones = {
    primary: "bg-primary-light text-primary",
    success: "bg-success-light text-success",
    danger: "bg-danger-light text-danger",
    warning: "bg-warning-light text-warning",
    muted: "bg-background text-muted",
  }
  return (
    <span
      className={`flex flex-shrink-0 items-center justify-center rounded-xl ${dims} ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

export function Avatar({
  name,
  size = 36,
  tone = "primary",
}: {
  name: string
  size?: number
  tone?: "primary" | "muted"
}) {
  const text =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  return (
    <span
      className={`flex flex-shrink-0 items-center justify-center rounded-full font-display font-bold ${
        tone === "primary"
          ? "bg-primary-light text-primary"
          : "bg-background text-muted"
      }`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {text}
    </span>
  )
}

/**
 * Tile statistik ringkasan; chip ikon, nilai besar, label, hint opsional.
 * Menjadi card interaktif (efek hover + panah) saat `to` diisi.
 */
export function StatCard({
  icon,
  value,
  label,
  hint,
  to,
  onClick,
  tone = "primary",
}: {
  icon: ReactNode
  value: ReactNode
  label: ReactNode
  hint?: ReactNode
  to?: string
  onClick?: () => void
  tone?: "primary" | "success" | "danger" | "warning"
}) {
  const interactive = !!to || !!onClick
  const body = (
    <div className="flex items-center gap-3.5">
      <IconTile tone={tone} size="lg">
        {icon}
      </IconTile>
      <div className="min-w-0 flex-1">
        <p className="font-display text-xl font-extrabold leading-none tracking-tight text-foreground tabular-nums">
          {value}
        </p>
        <p className="mt-1 truncate text-[12px] font-medium text-muted">
          {label}
        </p>
        {hint && (
          <p className="mt-0.5 truncate text-[11px] text-subtle">{hint}</p>
        )}
      </div>
      {interactive && (
        <ArrowRight
          size={15}
          className="flex-shrink-0 text-subtle transition-transform group-hover:translate-x-0.5"
        />
      )}
    </div>
  )
  const cls =
    "block w-full rounded-2xl border border-border bg-surface px-4 py-3.5 text-left"
  const hover =
    "transition-all hover:border-primary/30 hover:shadow-sm"
  if (to)
    return (
      <Link to={to} className={`group ${cls} ${hover}`}>
        {body}
      </Link>
    )
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={`group ${cls} ${hover}`}>
        {body}
      </button>
    )
  return <div className={cls}>{body}</div>
}

/* ------------------------------------------------------------------ tombol -- */

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "subtle"

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-display font-bold transition-colors disabled:pointer-events-none disabled:opacity-60"
const BTN_SIZE = {
  sm: "px-3 py-2 text-[12px]",
  md: "px-4 py-2.5 text-[13px]",
  lg: "px-5 py-3 text-sm",
} as const
const BTN_VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-dark",
  secondary:
    "border border-border bg-surface text-foreground hover:border-primary hover:text-primary",
  ghost: "text-muted hover:bg-border-light hover:text-foreground",
  danger: "bg-danger text-white hover:bg-danger/90",
  subtle: "bg-primary-light text-primary hover:bg-primary-light-hover",
}

type ButtonProps = {
  variant?: ButtonVariant
  size?: keyof typeof BTN_SIZE
  loading?: boolean
  /** Ikon sebelum label. */
  icon?: ReactNode
  /** Ikon sesudah label (mis. chevron "lihat semua"). */
  iconRight?: ReactNode
  block?: boolean
  children?: ReactNode
  className?: string
}

/** Tombol utama produk. Merender <Link> jika ada `to`, <a> jika ada `href`, selain itu <button>. */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconRight,
  block = false,
  className = "",
  children,
  to,
  href,
  disabled,
  ...rest
}: ButtonProps &
  Partial<ButtonHTMLAttributes<HTMLButtonElement>> & {
    to?: string
    href?: string
  }) {
  const cls = `${BTN_BASE} ${BTN_SIZE[size]} ${BTN_VARIANT[variant]} ${
    block ? "w-full" : ""
  } ${className}`
  const inner = (
    <>
      {loading ? (
        <Loader2 size={size === "sm" ? 13 : 15} className="animate-spin" />
      ) : (
        icon
      )}
      {children}
      {!loading && iconRight}
    </>
  )
  if (to)
    return (
      <Link to={to} className={cls} {...(rest as Record<string, unknown>)}>
        {inner}
      </Link>
    )
  if (href)
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={cls}
        {...(rest as Record<string, unknown>)}
      >
        {inner}
      </a>
    )
  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {inner}
    </button>
  )
}

/** Tombol persegi berisi ikon saja (toolbar / tutup / aksi baris). */
export function IconButton({
  label,
  children,
  variant = "ghost",
  className = "",
  ...rest
}: {
  label: string
  children: ReactNode
  variant?: "ghost" | "danger" | "secondary"
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const tones = {
    ghost: "text-subtle hover:bg-border-light hover:text-foreground",
    danger: "text-subtle hover:bg-danger-light hover:text-danger",
    secondary:
      "border border-border text-muted hover:border-primary hover:text-primary",
  }
  return (
    <button
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${tones[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------- input -- */

const CONTROL =
  "w-full rounded-xl border-[1.5px] border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-subtle focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-60"

export function FieldLabel({
  label,
  required,
  htmlFor,
}: {
  label: ReactNode
  required?: boolean
  htmlFor?: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-[11px] font-semibold text-muted"
    >
      {label}
      {required && <span className="text-danger"> *</span>}
    </label>
  )
}

/** Wrapper label + kontrol + hint/error. Bungkus input apa pun; isi `error` untuk menandainya. */
export function Field({
  label,
  required,
  hint,
  error,
  children,
  className = "",
}: {
  label?: ReactNode
  required?: boolean
  hint?: ReactNode
  error?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <FieldLabel label={label} required={required} />}
      {children}
      {error ? (
        <span className="text-[11px] font-medium text-danger">{error}</span>
      ) : (
        hint && <span className="text-[10px] text-subtle">{hint}</span>
      )}
    </div>
  )
}

export const TextInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function TextInput({ className = "", invalid, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={`${CONTROL} ${invalid ? "border-danger focus:border-danger focus:ring-danger/10" : ""} ${className}`}
      {...rest}
    />
  )
})

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function TextArea({ className = "", rows = 3, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`${CONTROL} resize-y ${className}`}
      {...rest}
    />
  )
})

/** Select native dengan chevron khas produk + ring fokus yang konsisten. */
export function Select({
  className = "",
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={`${CONTROL} cursor-pointer appearance-none pr-10 ${className}`}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
      />
    </div>
  )
}

/** Input password dengan toggle tampilkan/sembunyikan. */
export function PasswordInput({
  className = "",
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        className={`${CONTROL} pr-10 ${className}`}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        onMouseDown={(e) => e.preventDefault()}
        aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-subtle transition-colors hover:text-foreground"
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

/* ----------------------------------------------------------------- toolbar -- */

/**
 * Shell bersama untuk kontrol toolbar list/tabel (search, select filter,
 * segmented control). Border, radius, surface, dan efek fokus sama di semua
 * portal agar filter bar terasa sama untuk admin maupun pengguna.
 */
const TOOLBAR_SHELL =
  "rounded-xl border-[1.5px] border-border bg-surface transition-colors focus-within:border-primary"

/** Kotak pencarian untuk toolbar — ikon, input, dan tombol clear saat terisi. */
export function SearchInput({
  value,
  onChange,
  placeholder = "Cari…",
  className = "",
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <label
      className={`flex items-center gap-2.5 px-3.5 py-2.5 ${TOOLBAR_SHELL} ${className}`}
    >
      <Search size={15} className="flex-shrink-0 text-primary" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-subtle"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Bersihkan pencarian"
          className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-border text-muted transition-colors hover:bg-subtle hover:text-white"
        >
          <X size={11} />
        </button>
      )}
    </label>
  )
}

export type DropdownOption = { value: string; label: string; hint?: string }

/**
 * Dropdown single-select bergaya: tombol pemicu + daftar popover dengan
 * styling hover / terpilih / centang khas produk, menggantikan kotak
 * <select> native polos. Lebar otomatis; set `searchable` untuk daftar opsi panjang.
 */
export function Dropdown({
  value,
  onChange,
  options,
  placeholder = "Pilih…",
  icon,
  searchable = false,
  align = "left",
  block = false,
  inline = false,
  tone = "surface",
  className = "",
}: {
  value: string
  onChange: (v: string) => void
  options: readonly DropdownOption[]
  placeholder?: string
  icon?: ReactNode
  searchable?: boolean
  align?: "left" | "right"
  /** Lebar penuh (untuk field form), bukan menyesuaikan konten (toolbar). */
  block?: boolean
  /** Buka daftar dalam flow normal (mendorong konten) alih-alih sebagai overlay —
   *  pakai di dalam panel scrollable di mana popover absolute akan terpotong. */
  inline?: boolean
  /** `surface` di atas latar berwarna/toolbar, `field` (bg-background) di dalam form card. */
  tone?: "surface" | "field"
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const ref = useDismissable<HTMLDivElement>(open, () => setOpen(false), {
    escape: true,
  })

  const selected = options.find((o) => o.value === value)
  const q = query.trim().toLowerCase()
  const list = q
    ? options.filter((o) => o.label.toLowerCase().includes(q))
    : options

  const pick = (v: string) => {
    onChange(v)
    setOpen(false)
    setQuery("")
  }

  return (
    <div
      ref={ref}
      className={`relative ${block ? "flex w-full" : "inline-flex"} ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center gap-2 rounded-xl border-[1.5px] py-2.5 pl-3.5 pr-3 text-left text-[13px] font-semibold transition-colors ${
          tone === "field" ? "bg-background" : "bg-surface"
        } ${open ? "border-primary" : "border-border hover:border-primary/50"}`}
      >
        {icon && <span className="flex-shrink-0 text-subtle">{icon}</span>}
        <span
          className={`min-w-0 flex-1 truncate ${
            selected ? "text-foreground" : "text-subtle"
          }`}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={15}
          className={`flex-shrink-0 text-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className={
            inline
              ? "pop-in mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
              : `pop-in absolute top-[calc(100%+6px)] z-30 min-w-full max-w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-surface shadow-lg ${
                  align === "right" ? "right-0" : "left-0"
                }`
          }
        >
          {searchable && (
            <div className="flex items-center gap-2 border-b border-border-light px-3 py-2">
              <Search size={14} className="flex-shrink-0 text-subtle" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari…"
                className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-subtle"
              />
            </div>
          )}
          <ul
            role="listbox"
            className={`overflow-y-auto p-1.5 ${inline ? "max-h-48" : "max-h-64"}`}
          >
            {list.length === 0 ? (
              <li className="px-3 py-2.5 text-center text-[13px] text-subtle">
                Tidak ditemukan
              </li>
            ) : (
              list.map((o) => {
                const on = o.value === value
                return (
                  <li key={o.value || "__all"}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={on}
                      onClick={() => pick(o.value)}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
                        on
                          ? "bg-primary-light font-semibold text-primary"
                          : "font-medium text-foreground hover:bg-border-light"
                      }`}
                    >
                      <span className="min-w-0 truncate">{o.label}</span>
                      {o.hint && (
                        <span className="flex-shrink-0 text-[11px] text-subtle">
                          {o.hint}
                        </span>
                      )}
                      {on && (
                        <Check
                          size={14}
                          strokeWidth={3}
                          className="flex-shrink-0 text-primary"
                        />
                      )}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

/** Toggle segmented (mis. Semua / Aktif / Nonaktif). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className = "",
}: {
  value: T
  onChange: (v: T) => void
  options: readonly { value: T; label: string }[]
  className?: string
}) {
  return (
    <div
      className={`flex overflow-hidden rounded-xl border-[1.5px] border-border bg-surface ${className}`}
    >
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3.5 py-2.5 text-[12px] font-semibold transition-colors ${
            i > 0 ? "border-l border-border" : ""
          } ${
            value === o.value
              ? "bg-primary text-white"
              : "text-muted hover:bg-border-light hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export type MenuItem = {
  label: string
  icon?: ReactNode
  onClick: () => void
  danger?: boolean
}

/** Menu kebab (⋮) — tombol pemicu + daftar aksi kecil. Sama di semua portal. */
export function Menu({
  items,
  label = "Opsi",
  align = "right",
}: {
  items: MenuItem[]
  label?: string
  align?: "left" | "right"
}) {
  const [open, setOpen] = useState(false)
  const ref = useDismissable<HTMLDivElement>(open, () => setOpen(false), {
    escape: true,
  })

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex h-8 w-8 items-center justify-center rounded-lg border-[1.5px] transition-colors ${
          open
            ? "border-primary bg-primary-light text-primary"
            : "border-border bg-surface text-muted hover:border-primary/50 hover:text-foreground"
        }`}
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <div
          role="menu"
          className={`pop-in absolute top-[calc(100%+6px)] z-30 min-w-[184px] origin-top overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                it.onClick()
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-semibold transition-colors ${
                it.danger
                  ? "text-danger hover:bg-danger-light"
                  : "text-foreground hover:bg-border-light"
              }`}
            >
              {it.icon && <span className="flex-shrink-0">{it.icon}</span>}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ alert -- */

type AlertTone = "info" | "success" | "warning" | "error"

const ALERT_META: Record<
  AlertTone,
  { cls: string; icon: ReactNode }
> = {
  info: {
    cls: "border-primary-light bg-primary-light text-primary",
    icon: <Info size={16} />,
  },
  success: {
    cls: "border-success-light bg-success-light text-success",
    icon: <CheckCircle2 size={16} />,
  },
  warning: {
    cls: "border-warning-light bg-warning-light text-warning",
    icon: <AlertTriangle size={16} />,
  },
  error: {
    cls: "border-danger-light bg-danger-light text-danger",
    icon: <AlertTriangle size={16} />,
  },
}

export function Alert({
  tone = "info",
  title,
  children,
  className = "",
}: {
  tone?: AlertTone
  title?: ReactNode
  children?: ReactNode
  className?: string
}) {
  const meta = ALERT_META[tone]
  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${meta.cls} ${className}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <span className="mt-0.5 flex-shrink-0">{meta.icon}</span>
      <div className="min-w-0 leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? "mt-0.5 opacity-90" : ""}>{children}</div>}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ badge  -- */

export function Badge({
  children,
  tone = "primary",
  dot = false,
}: {
  children: ReactNode
  tone?: "primary" | "success" | "danger" | "warning" | "muted"
  dot?: boolean
}) {
  const tones = {
    primary: "bg-primary-light text-primary",
    success: "bg-success-light text-success",
    danger: "bg-danger-light text-danger",
    warning: "bg-warning-light text-warning",
    muted: "bg-border-light text-muted",
  }
  const dotc = {
    primary: "bg-primary",
    success: "bg-success",
    danger: "bg-danger",
    warning: "bg-warning",
    muted: "bg-subtle",
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotc[tone]}`} />}
      {children}
    </span>
  )
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge tone={active ? "success" : "danger"} dot>
      {active ? "Aktif" : "Nonaktif"}
    </Badge>
  )
}

const FRESHNESS_META = {
  fresh: { label: "Terkini", tone: "success" },
  aging: { label: "Perlu ditinjau", tone: "warning" },
  stale: { label: "Kedaluwarsa", tone: "danger" },
} as const

export function FreshnessBadge({ updatedAt }: { updatedAt: string }) {
  const meta = FRESHNESS_META[dataFreshness(updatedAt)]
  return <Badge tone={meta.tone}>{meta.label}</Badge>
}

const STATUS_META: Record<
  ConversationStatus,
  { label: string; tone: "primary" | "success" | "warning" | "muted" }
> = {
  open: { label: "Terbuka", tone: "primary" },
  pending: { label: "Diproses", tone: "warning" },
  resolved: { label: "Selesai", tone: "success" },
  closed: { label: "Ditutup", tone: "muted" },
}

export function ConversationStatusBadge({
  status,
}: {
  status: ConversationStatus
}) {
  const meta = STATUS_META[status]
  return <Badge tone={meta.tone}>{meta.label}</Badge>
}

/* --------------------------------------------------------- memuat / kosong -- */

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
      <Loader2 size={18} className="animate-spin text-primary" />
      {label ?? "Memuat…"}
    </div>
  )
}

/** Loader setinggi penuh dan terpusat untuk satu rute utuh. */
export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner label={label} />
    </div>
  )
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-border-light ${className}`}
    />
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
      {icon && (
        <IconTile size="lg" className="mb-4 h-14 w-14">
          {icon}
        </IconTile>
      )}
      <p className="font-display text-sm font-bold text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-xs text-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------- modal -- */

export function Modal({
  open = true,
  onClose,
  children,
  size = "sm",
  className = "",
}: {
  open?: boolean
  onClose: () => void
  children: ReactNode
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null
  const max = size === "lg" ? "max-w-lg" : size === "md" ? "max-w-md" : "max-w-sm"
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${max} rounded-2xl bg-surface p-5 shadow-pop ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  tone = "primary",
  icon,
  onConfirm,
  onCancel,
  busy,
}: {
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: "primary" | "danger"
  /** Menimpa ikon default sesuai tone. */
  icon?: ReactNode
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
}) {
  return (
    <Modal size="sm" onClose={busy ? () => {} : onCancel}>
      <div className="flex flex-col items-center px-1 text-center">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-full ${
            tone === "danger"
              ? "bg-danger-light text-danger"
              : "bg-primary-light text-primary"
          }`}
        >
          {icon ?? <AlertTriangle size={22} />}
        </span>
        <p className="mt-4 font-display text-base font-bold text-foreground">
          {title}
        </p>
        <div className="mt-1.5 text-[13px] leading-relaxed text-muted">
          {message}
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={busy}
          className="order-2 sm:order-1"
        >
          {cancelLabel}
        </Button>
        <Button
          variant={tone === "danger" ? "danger" : "primary"}
          loading={busy}
          onClick={onConfirm}
          className="order-1 sm:order-2"
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

/* Ikon yang di-re-export karena sering dipakai bareng kit ini. */
export { Check, CheckCircle2, X }
