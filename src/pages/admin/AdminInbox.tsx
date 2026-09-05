import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  Loader2,
  SendHorizontal,
  Hospital as HospitalIcon,
  X,
  Search,
  CheckCircle2,
  RotateCcw,
  Trash2,
} from "lucide-react"
import { useConversations } from "../../hooks/useConversations"
import { useMessages } from "../../hooks/useMessages"
import { useHospitals } from "../../hooks/useHospitals"
import { listProfiles } from "../../api/profiles"
import {
  setConversationStatus,
  clearConversationView,
  ADMIN_QUICK_REPLIES,
  CATEGORY_LABELS,
  OPEN_STATUSES,
  isAwaitingAdminReply,
} from "../../api/conversations"
import {
  chatDateLabel,
  chatDayKey,
  formatTime,
  relativeTime,
} from "../../lib/format"
import ChatHospitalCard from "../../components/common/ChatHospitalCard"
import {
  Alert,
  Avatar,
  ConfirmDialog,
  EmptyState,
  Menu,
  SearchInput,
  Spinner,
} from "../../components/ui"
import type {
  Conversation,
  ConversationStatus,
  Hospital,
  Message,
  Profile,
  UserRole,
} from "../../types/db"

function PatientAvatar({ name, size = 36 }: { name: string; size?: number }) {
  return <Avatar name={name} size={size} />
}

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex justify-center py-1">
      <span className="rounded-full bg-background px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-subtle shadow-sm ring-1 ring-border-light">
        {label}
      </span>
    </div>
  )
}

type MessageGroup = {
  role: UserRole
  items: Message[]
}

function groupMessages(messages: Message[]): MessageGroup[] {
  const groups: MessageGroup[] = []
  for (const m of messages) {
    const last = groups[groups.length - 1]
    if (last && last.role === m.sender_role) last.items.push(m)
    else groups.push({ role: m.sender_role, items: [m] })
  }
  return groups
}

export default function AdminInbox() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { conversations, loading, error, reload } = useConversations("all")
  const { hospitals } = useHospitals("active")
  const [query, setQuery] = useState("")
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [pendingDelete, setPendingDelete] = useState<Conversation | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    listProfiles()
      .then((rows) =>
        setProfiles(Object.fromEntries(rows.map((p) => [p.id, p]))),
      )
      .catch((e) => console.error(e))
  }, [])

  // sembunyikan thread yang sudah dibersihkan admin, sampai pengguna menulis lagi
  const notCleared = (c: Conversation) =>
    !c.admin_cleared_at ||
    new Date(c.last_message_at).getTime() >
      new Date(c.admin_cleared_at).getTime()

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return conversations.filter((c) => {
      if (!notCleared(c) && c.id !== id) return false
      if (!q) return true
      const name = profiles[c.patient_id]?.full_name ?? ""
      const topic = CATEGORY_LABELS[c.category] ?? c.subject ?? ""
      return `${name} ${topic} ${c.subject} ${c.last_message}`
        .toLowerCase()
        .includes(q)
    })
  }, [conversations, profiles, query, id])

  const active = conversations.find((c) => c.id === id) ?? null
  const patientName = active
    ? profiles[active.patient_id]?.full_name || "Pengguna"
    : "Pengguna"
  const {
    messages,
    send,
    sending,
    loading: msgLoading,
  } = useMessages(active?.id ?? null)

  // pesan yang masih terlihat admin (semua setelah "Bersihkan" terakhirnya)
  const visibleMessages = useMemo(() => {
    const at = active?.admin_cleared_at
    if (!at) return messages
    const cutoff = new Date(at).getTime()
    return messages.filter((m) => new Date(m.created_at).getTime() > cutoff)
  }, [messages, active])

  const [draft, setDraft] = useState("")
  const [attached, setAttached] = useState<Hospital | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerQuery, setPickerQuery] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [visibleMessages.length])

  useEffect(() => {
    setAttached(null)
    setShowPicker(false)
    setDraft("")
  }, [id])

  const pickerResults = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase()
    return hospitals
      .filter((h) => !q || `${h.name} ${h.location}`.toLowerCase().includes(q))
      .slice(0, 8)
  }, [hospitals, pickerQuery])

  const handleSend = async () => {
    const text = draft.trim()
    if (!text && !attached) return
    setDraft("")
    const hospitalId = attached?.id ?? null
    setAttached(null)
    try {
      await send(text, hospitalId)
    } catch {
      setDraft(text)
    }
  }

  const changeStatus = async (status: ConversationStatus) => {
    if (!active) return
    await setConversationStatus(active.id, status)
    reload()
  }

  const confirmClear = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      const wasActive = pendingDelete.id === id
      await clearConversationView(pendingDelete.id, "admin")
      setPendingDelete(null)
      if (wasActive) navigate("/admin/inbox")
      reload()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex h-full flex-col p-4 sm:p-6">
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        {/* Daftar percakapan */}
        <div
          className={`flex w-full flex-col border-r border-border bg-surface sm:w-[320px] ${
            active ? "hidden sm:flex" : "flex"
          }`}
        >
          <div className="border-b border-border-light p-2.5">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Cari nama pengguna atau topik…"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <Spinner />
            ) : error ? (
              <div className="p-4">
                <Alert tone="error">{error}</Alert>
              </div>
            ) : visible.length === 0 ? (
              <p className="p-6 text-center text-xs text-muted">
                {query.trim()
                  ? `Tidak ada hasil untuk "${query.trim()}".`
                  : "Tidak ada percakapan."}
              </p>
            ) : (
              visible.map((c) => {
                const patient = profiles[c.patient_id]
                const name = patient?.full_name || "Pengguna"
                const awaiting = isAwaitingAdminReply(c)
                const done = !OPEN_STATUSES.includes(c.status)
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/admin/inbox/${c.id}`)}
                    className={`flex w-full items-start gap-3 border-b border-border-light px-4 py-3 text-left transition-colors hover:bg-background ${
                      c.id === id
                        ? "bg-primary-light"
                        : done
                          ? "opacity-70"
                          : ""
                    }`}
                  >
                    <PatientAvatar name={name} size={38} />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1.5">
                          {awaiting ? (
                            <span
                              className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"
                              title="Menunggu balasan"
                            />
                          ) : done ? (
                            <CheckCircle2
                              size={12}
                              className="flex-shrink-0 text-success"
                            />
                          ) : null}
                          <span
                            className={`truncate font-display text-[13px] text-foreground ${
                              awaiting ? "font-bold" : "font-semibold"
                            }`}
                          >
                            {name}
                          </span>
                        </span>
                        <span className="flex-shrink-0 text-[10px] text-subtle">
                          {relativeTime(c.last_message_at)}
                        </span>
                      </div>
                      <span
                        className={`truncate text-[11px] ${
                          awaiting ? "text-foreground" : "text-muted"
                        }`}
                      >
                        {c.last_message_role === "admin" && "Anda: "}
                        {c.last_message ||
                          CATEGORY_LABELS[c.category] ||
                          c.subject ||
                          "Belum ada pesan"}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Thread percakapan */}
        <div
          className={`min-w-0 flex-1 flex-col bg-surface ${
            active ? "flex" : "hidden sm:flex"
          }`}
        >
          {!active ? (
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState
                title="Pilih percakapan"
                description="Klik salah satu percakapan di daftar untuk melihat dan membalas pesan."
              />
            </div>
          ) : (
            <>
              {/* header */}
              <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <button
                    onClick={() => navigate("/admin/inbox")}
                    className="text-[12px] font-semibold text-muted sm:hidden"
                  >
                    ←
                  </button>
                  <PatientAvatar name={patientName} size={38} />
                  <div className="min-w-0">
                    <p className="truncate font-display text-[13px] font-bold text-foreground">
                      {patientName}
                    </p>
                    <p className="flex items-center gap-1.5 truncate text-[11px] text-muted">
                      {CATEGORY_LABELS[active.category] ?? active.subject}
                      <span className="text-subtle">·</span>
                      <span className="text-subtle">
                        {relativeTime(active.last_message_at)}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  {OPEN_STATUSES.includes(active.status) ? (
                    <button
                      onClick={() => changeStatus("resolved")}
                      className="flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-success/90"
                    >
                      <CheckCircle2 size={13} />
                      Tandai selesai
                    </button>
                  ) : (
                    <button
                      onClick={() => changeStatus("open")}
                      className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] font-semibold text-foreground hover:bg-surface"
                    >
                      <RotateCcw size={13} />
                      Buka lagi
                    </button>
                  )}
                  <Menu
                    label="Opsi percakapan"
                    items={[
                      {
                        label: "Hapus riwayat",
                        icon: <Trash2 size={14} />,
                        danger: true,
                        onClick: () => setPendingDelete(active),
                      },
                    ]}
                  />
                </div>
              </div>

              <div
                className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-5"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at top right, rgba(26,84,195,0.05), transparent 55%)",
                }}
              >
                {msgLoading ? (
                  <Spinner />
                ) : visibleMessages.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
                    <p className="font-display text-[13px] font-bold text-foreground">
                      {active.admin_cleared_at
                        ? "Percakapan dibersihkan"
                        : "Belum ada pesan"}
                    </p>
                    <p className="max-w-[220px] text-[11px] text-muted">
                      {active.admin_cleared_at
                        ? "Riwayat lama disembunyikan. Pesan baru dari pengguna akan muncul di sini."
                        : "Mulai percakapan dengan mengirim balasan atau kartu rumah sakit di bawah."}
                    </p>
                  </div>
                ) : (
                  <>
                    {(() => {
                      const groups = groupMessages(visibleMessages)
                      let prevDay = ""
                      return groups.map((group, gi) => {
                        const firstAt = group.items[0].created_at
                        const day = chatDayKey(firstAt)
                        const showDay = day !== prevDay
                        prevDay = day
                        const mine = group.role === "admin"
                        const last = group.items[group.items.length - 1]
                        return (
                          <Fragment key={gi}>
                            {showDay && (
                              <DateDivider label={chatDateLabel(firstAt)} />
                            )}
                            <div
                              className={`flex items-end gap-2 ${
                                mine ? "justify-end" : "justify-start"
                              }`}
                            >
                              {!mine && (
                                <PatientAvatar name={patientName} size={28} />
                              )}
                              <div
                                className={`flex max-w-[80%] flex-col gap-1.5 ${
                                  mine ? "items-end" : "items-start"
                                }`}
                              >
                                {group.items.map((msg) => (
                                  <div
                                    key={msg.id}
                                    className={`flex flex-col gap-1.5 ${
                                      mine ? "items-end" : "items-start"
                                    }`}
                                  >
                                    {msg.body.trim() && (
                                      <div
                                        className={`msg-in rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                                          mine
                                            ? "rounded-br-md bg-primary text-white"
                                            : "rounded-bl-md border border-border bg-background text-foreground"
                                        }`}
                                      >
                                        {msg.body}
                                      </div>
                                    )}
                                    {msg.hospital && (
                                      <div className="msg-in">
                                        <ChatHospitalCard
                                          hospital={msg.hospital}
                                          interactive={false}
                                        />
                                      </div>
                                    )}
                                  </div>
                                ))}
                                <span className="px-1 text-[10px] text-subtle">
                                  {mine ? "" : `${patientName} · `}
                                  {formatTime(last.created_at)}
                                </span>
                              </div>
                            </div>
                          </Fragment>
                        )
                      })
                    })()}

                    {!OPEN_STATUSES.includes(active.status) && (
                      <div className="flex items-center gap-3 py-1">
                        <div className="h-px flex-1 bg-border-light" />
                        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-subtle">
                          <CheckCircle2 size={11} className="text-success" />
                          Percakapan selesai
                        </span>
                        <div className="h-px flex-1 bg-border-light" />
                      </div>
                    )}
                  </>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="relative flex-shrink-0 border-t border-border bg-surface px-3 py-3 sm:px-4">
                {showPicker && (
                  <div className="absolute bottom-full left-3 right-3 mb-2 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
                    <div className="flex items-center gap-2 border-b border-border-light px-3 py-2">
                      <Search size={13} className="flex-shrink-0 text-subtle" />
                      <input
                        autoFocus
                        value={pickerQuery}
                        onChange={(e) => setPickerQuery(e.target.value)}
                        placeholder="Cari rumah sakit untuk dikirim…"
                        className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-subtle"
                      />
                      <button
                        onClick={() => setShowPicker(false)}
                        aria-label="Tutup"
                      >
                        <X size={13} className="text-subtle" />
                      </button>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      {pickerResults.length === 0 ? (
                        <p className="px-3 py-4 text-center text-[11px] text-muted">
                          Tidak ada rumah sakit.
                        </p>
                      ) : (
                        pickerResults.map((h) => (
                          <button
                            key={h.id}
                            onClick={() => {
                              setAttached(h)
                              setShowPicker(false)
                              setPickerQuery("")
                            }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-background"
                          >
                            <span className="h-8 w-10 flex-shrink-0 overflow-hidden rounded-md bg-background">
                              {h.image_url && (
                                <img
                                  src={h.image_url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-display text-[12px] font-bold text-foreground">
                                {h.name}
                              </span>
                              <span className="block truncate text-[10px] text-muted">
                                {h.location}
                              </span>
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {attached && (
                  <div className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5">
                    <HospitalIcon
                      size={13}
                      className="flex-shrink-0 text-primary"
                    />
                    <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-foreground">
                      Kartu: {attached.name}
                    </span>
                    <button
                      onClick={() => setAttached(null)}
                      aria-label="Hapus lampiran"
                    >
                      <X size={13} className="text-subtle" />
                    </button>
                  </div>
                )}

                <div className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5">
                  {ADMIN_QUICK_REPLIES.map((qr) => (
                    <button
                      key={qr.label}
                      onClick={() => setDraft(qr.message)}
                      className="flex-shrink-0 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-semibold text-muted transition-colors hover:border-primary/40 hover:bg-primary-light hover:text-primary"
                    >
                      {qr.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 rounded-full border-[1.5px] border-border bg-background px-3 py-2 focus-within:border-primary">
                  <button
                    onClick={() => setShowPicker((v) => !v)}
                    aria-label="Kirim kartu rumah sakit"
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
                      showPicker
                        ? "bg-primary-light text-primary"
                        : "text-muted hover:bg-background"
                    }`}
                  >
                    <HospitalIcon size={15} />
                  </button>
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder={
                      attached
                        ? "Tambahkan catatan (opsional)…"
                        : "Tulis balasan untuk pengguna…"
                    }
                    className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-subtle"
                  />
                  <button
                    onClick={handleSend}
                    disabled={(!draft.trim() && !attached) || sending}
                    aria-label="Kirim balasan"
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
                      (draft.trim() || attached) && !sending
                        ? "bg-primary text-white hover:bg-primary-hover"
                        : "bg-border-light text-subtle"
                    }`}
                  >
                    {sending ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <SendHorizontal size={15} />
                    )}
                  </button>
                </div>
              </div>

              <style>{`
                @keyframes msgIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
                .msg-in { animation: msgIn 0.2s ease-out; }
                @media (prefers-reduced-motion: reduce) { .msg-in { animation: none; } }
              `}</style>
            </>
          )}
        </div>
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="Hapus riwayat percakapan?"
          message={`Percakapan dengan ${
            profiles[pendingDelete.patient_id]?.full_name || "pengguna ini"
          } disembunyikan dari inbox. Pengguna tetap menyimpan riwayatnya, dan percakapan muncul lagi begitu pengguna mengirim pesan baru.`}
          confirmLabel="Hapus"
          tone="danger"
          busy={deleting}
          onConfirm={confirmClear}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}
