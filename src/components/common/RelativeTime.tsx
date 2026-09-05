import { useEffect, useState } from "react"
import { formatDateTime, relativeTime } from "../../lib/format"

type Props = {
  value: string | null | undefined
  className?: string
  prefix?: string
}

/** Label "diperbarui 3 menit lalu" yang auto-refresh. */
export default function RelativeTime({ value, className, prefix }: Props) {
  const [, tick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className={className} title={formatDateTime(value)}>
      {prefix}
      {relativeTime(value)}
    </span>
  )
}
