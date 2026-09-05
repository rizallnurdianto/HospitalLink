import { Loader2 } from "lucide-react"

export default function FullscreenLoader({
  label = "Memuat…",
}: {
  label?: string
}) {
  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center gap-3 bg-background">
      <Loader2 size={26} className="animate-spin text-primary" />
      <p className="text-sm text-muted">{label}</p>
    </div>
  )
}
