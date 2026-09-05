import { useState } from "react"
import { X } from "lucide-react"

type Props = {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}

export default function TagInput({ value, onChange, placeholder }: Props) {
  const [draft, setDraft] = useState("")

  const add = () => {
    const v = draft.trim()
    if (v && !value.includes(v)) onChange([...value, v])
    setDraft("")
  }

  return (
    <div className="rounded-xl border-[1.5px] border-border bg-background px-2.5 py-2 focus-within:border-primary">
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-primary-light px-2.5 py-1 text-[12px] font-semibold text-primary"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault()
              add()
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1))
            }
          }}
          onBlur={add}
          placeholder={value.length ? "" : placeholder}
          className="min-w-[120px] flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-subtle"
        />
      </div>
    </div>
  )
}
