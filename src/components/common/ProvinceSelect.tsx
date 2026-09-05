import { useMemo, useState } from "react"
import { Check, ChevronDown, MapPin, Search } from "lucide-react"
import { PROVINCES } from "../../lib/provinces"
import { useDismissable } from "../../hooks/useDismissable"

type Props = {
  value: string
  onChange: (v: string) => void
  label?: string
  required?: boolean
}

/** Pemilih provinsi dengan pencarian; lebih nyaman daripada <select> native 38 opsi. */
export default function ProvinceSelect({
  value,
  onChange,
  label = "Provinsi",
  required = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const ref = useDismissable<HTMLDivElement>(open, () => setOpen(false), {
    escape: true,
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? PROVINCES.filter((p) => p.toLowerCase().includes(q)) : PROVINCES
  }, [query])

  const pick = (p: string) => {
    onChange(p)
    setOpen(false)
    setQuery("")
  }

  return (
    <div ref={ref} className="relative flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold text-foreground">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex items-center gap-2.5 rounded-xl border-[1.5px] bg-background px-3.5 py-2.5 text-left transition-colors ${
          open ? "border-primary" : "border-border hover:border-primary/50"
        }`}
      >
        <MapPin size={15} className="flex-shrink-0 text-subtle" />
        <span
          className={`flex-1 truncate text-[13px] font-semibold ${
            value ? "text-foreground" : "text-subtle"
          }`}
        >
          {value || "Pilih provinsi…"}
        </span>
        <ChevronDown
          size={15}
          className={`flex-shrink-0 text-subtle transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <div className="flex items-center gap-2 border-b border-border-light px-3 py-2">
            <Search size={14} className="flex-shrink-0 text-subtle" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari provinsi…"
              className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-subtle"
            />
          </div>
          <ul role="listbox" className="max-h-56 overflow-y-auto p-1.5">
            {filtered.length === 0 ? (
              <li className="px-3 py-2.5 text-center text-[13px] text-subtle">
                Provinsi tidak ditemukan
              </li>
            ) : (
              filtered.map((p) => {
                const on = p === value
                return (
                  <li key={p}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={on}
                      onClick={() => pick(p)}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
                        on
                          ? "bg-primary-light font-semibold text-primary"
                          : "font-medium text-foreground hover:bg-border-light"
                      }`}
                    >
                      {p}
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
