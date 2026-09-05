import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import {
  SendHorizontal,
  Search,
  Building2,
  MapPin,
  MessageCircle,
  Info,
  Loader2,
  Trash2,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useSettings } from "../hooks/useSettings"
import { useMessages } from "../hooks/useMessages"
import { useConversations } from "../hooks/useConversations"
import {
  getOrCreateSupportConversation,
  setConversationStatus,
  clearConversationView,
} from "../api/conversations"
import { isWithinServiceHours } from "../api/settings"
import { chatDateLabel, chatDayKey, formatTime } from "../lib/format"
import ChatHospitalCard from "../components/common/ChatHospitalCard"
import {
  ConfirmDialog,
  ConversationStatusBadge,
  Menu,
} from "../components/ui"
import type { Conversation, Message, UserRole } from "../types/db"

type QuickAction = {
  id: string
  icon: React.ReactNode
  label: string
  message: string
}

const quickActions: QuickAction[] = [
  {
    id: "cari-rs",
    icon: <Search size={16} />,
    label: "Cari rumah sakit",
    message: "Saya ingin mencari rumah sakit.",
  },
  {
    id: "info-rs",
    icon: <Building2 size={16} />,
    label: "Tanya informasi",
    message: "Saya ingin menanyakan informasi tentang sebuah rumah sakit.",
  },
  {
    id: "rekomendasi",
    icon: <MapPin size={16} />,
    label: "Minta rekomendasi",
    message: "Bisakah Admin merekomendasikan rumah sakit untuk saya?",
  },
  {
    id: "lainnya",
    icon: <MessageCircle size={16} />,
    label: "Pertanyaan lainnya",
    message: "Saya punya pertanyaan lain untuk Admin.",
  },
]

const GREETING =
  "Halo! 👋 Saya Admin HospitalLink. Ada yang bisa saya bantu? Pilih salah satu topik di bawah, atau langsung tulis pesanmu."
const REPROMPT =
  "Admin sudah menandai percakapan ini selesai. Apakah masih ada yang ingin kamu tanyakan?"
const REPROMPT_MORE =
  "Tentu, silakan pilih topik di bawah atau langsung tulis pertanyaanmu."
const CLOSING =
  "Baik, terima kasih sudah menghubungi HospitalLink. Kalau nanti butuh bantuan lagi, pilih salah satu topik di bawah atau langsung tulis pesan; percakapan akan otomatis terbuka kembali. 🙏"

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

function AdminAvatar({ size = 28 }: { size?: number }) {
  return (
    <span
      className="flex flex-shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      A
    </span>
  )
}

function QuickActionGrid({
  onPick,
  disabled,
}: {
  onPick: (message: string) => void
  disabled: boolean
}) {
  return (
    <div className="ml-9 grid gap-2 sm:grid-cols-2">
      {quickActions.map((qa) => (
        <button
          key={qa.id}
          disabled={disabled}
          onClick={() => onPick(qa.message)}
          className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-left text-[12px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary-light disabled:opacity-50"
        >
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
            {qa.icon}
          </span>
          {qa.label}
        </button>
      ))}
    </div>
  )
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

function AdminBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-end gap-2">
      <AdminAvatar />
      <div className="max-w-[80%]">
        <div className="rounded-2xl rounded-bl-md border border-border bg-background px-3.5 py-2.5 text-[13px] leading-relaxed text-foreground shadow-sm">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function HelpPage() {
  const { session } = useAuth()
  const { settings } = useSettings()
  const { conversations: myConversations } = useConversations("mine")
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [opening, setOpening] = useState(true)
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    send,
    sending,
    loading: msgLoading,
  } = useMessages(conversation?.id ?? null)

  const hours = settings?.support_service_hours
  const isAdminOnline = hours ? isWithinServiceHours(hours) : false

  // status live; berubah begitu admin menyelesaikan/membuka lagi thread-nya
  const live = useMemo(
    () => myConversations.find((c) => c.id === conversation?.id),
    [myConversations, conversation],
  )
  const status = live?.status ?? conversation?.status ?? "open"
  const clearedAt = live?.cleared_at ?? conversation?.cleared_at ?? null

  // pesan yang masih terlihat pengguna (semua setelah "Bersihkan" terakhirnya)
  const visibleMessages = useMemo(() => {
    if (!clearedAt) return messages
    const cutoff = new Date(clearedAt).getTime()
    return messages.filter((m) => new Date(m.created_at).getTime() > cutoff)
  }, [messages, clearedAt])

  const ready = !opening && !msgLoading
  const isFresh = ready && visibleMessages.length === 0
  const isWrappedUp =
    ready &&
    visibleMessages.length > 0 &&
    (status === "resolved" || status === "closed")

  // konfirmasi penutupan: tanya → pengguna lanjut atau tutup percakapan
  const [wrapChoice, setWrapChoice] = useState<"ask" | "more" | "done">("ask")
  const [closing, setClosing] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleClear = async () => {
    if (!conversation) return
    setDeleting(true)
    try {
      const at = await clearConversationView(conversation.id, "patient")
      setConversation((c) => (c ? { ...c, cleared_at: at } : c))
      setWrapChoice("ask")
      setInput("")
      setPendingDelete(false)
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    if (status === "open") setWrapChoice("ask")
  }, [status])

  const confirmDone = async () => {
    setWrapChoice("done")
    if (!conversation || status === "closed") return
    setClosing(true)
    try {
      await setConversationStatus(conversation.id, "closed")
    } catch {
      /* tidak kritis; pesan baru akan membuka lagi thread-nya */
    } finally {
      setClosing(false)
    }
  }

  useEffect(() => {
    if (!session) return
    let active = true
    setOpening(true)
    getOrCreateSupportConversation(session.user.id)
      .then((c) => active && setConversation(c))
      .catch((e) => active && alert((e as Error).message))
      .finally(() => active && setOpening(false))
    return () => {
      active = false
    }
  }, [session])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [visibleMessages.length, opening, isWrappedUp, wrapChoice])

  const sendText = async (text: string) => {
    if (!text.trim() || sending) return
    try {
      await send(text)
    } catch {
      /* sudah ditangani di hook */
    }
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
    setInput("")
    try {
      await send(text)
    } catch {
      setInput(text)
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col p-4 sm:p-6 lg:p-8">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        {/* header */}
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="relative flex-shrink-0">
            <AdminAvatar size={38} />
            <span
              className={`absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full border-2 border-surface ${
                isAdminOnline ? "bg-success" : "bg-subtle"
              }`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold text-foreground">
              Admin HospitalLink
            </p>
            <p className="flex items-center gap-1.5 text-[11px] text-muted">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isAdminOnline ? "bg-success" : "bg-subtle"
                }`}
              />
              {isAdminOnline
                ? "Online, biasanya membalas dalam beberapa menit"
                : "Sedang offline"}
            </p>
          </div>
          {status !== "open" && visibleMessages.length > 0 && (
            <ConversationStatusBadge status={status} />
          )}
          {visibleMessages.length > 0 && (
            <Menu
              label="Opsi percakapan"
              items={[
                {
                  label: "Hapus riwayat",
                  icon: <Trash2 size={14} />,
                  danger: true,
                  onClick: () => setPendingDelete(true),
                },
              ]}
            />
          )}
        </div>

        {!isAdminOnline && (
          <div className="flex flex-shrink-0 items-start gap-2 border-b border-warning-light bg-warning-light px-4 py-2.5 sm:px-5">
            <Info size={13} className="mt-0.5 flex-shrink-0 text-warning" />
            <p className="text-[11px] leading-relaxed text-warning">
              Admin sedang di luar jam layanan
              {hours
                ? ` (${hours.start.toString().padStart(2, "0")}.00–${hours.end
                    .toString()
                    .padStart(2, "0")}.00)`
                : ""}
              . Pesanmu tetap tersimpan dan akan dibalas begitu admin kembali
              online.
            </p>
          </div>
        )}

        {/* pesan */}
        <div
          className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-5"
          style={{
            backgroundImage:
              "radial-gradient(circle at top right, rgba(26,84,195,0.05), transparent 55%)",
          }}
        >
          {opening ? (
            <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted">
              <Loader2 size={16} className="animate-spin text-primary" />
              Memuat percakapan...
            </div>
          ) : (
            <>
              {/* sapaan pembuka + aksi cepat (hanya untuk state awal) */}
              {isFresh && (
                <>
                  <AdminBubble>{GREETING}</AdminBubble>
                  <QuickActionGrid onPick={sendText} disabled={sending} />
                </>
              )}

              {(() => {
                const groups = groupMessages(visibleMessages)
                let prevDay = ""
                return groups.map((group, gi) => {
                  const firstAt = group.items[0].created_at
                  const day = chatDayKey(firstAt)
                  const showDay = day !== prevDay
                  prevDay = day
                  const mine = group.role === "patient"
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
                        {!mine && <AdminAvatar />}
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
                                  <ChatHospitalCard hospital={msg.hospital} />
                                </div>
                              )}
                            </div>
                          ))}
                          <span className="px-1 text-[10px] text-subtle">
                            {mine ? "" : "Admin · "}
                            {formatTime(
                              group.items[group.items.length - 1].created_at,
                            )}
                          </span>
                        </div>
                      </div>
                    </Fragment>
                  )
                })
              })()}

              {/* prompt ulang penutupan: konfirmasi selesai, atau lanjut dengan aksi cepat */}
              {isWrappedUp && (
                <div className="flex flex-col gap-4">
                  <div className="msg-in">
                    <AdminBubble>
                      {wrapChoice === "done"
                        ? CLOSING
                        : wrapChoice === "more"
                          ? REPROMPT_MORE
                          : REPROMPT}
                    </AdminBubble>
                  </div>

                  {wrapChoice === "ask" && (
                    <div className="msg-in ml-9 flex flex-wrap gap-2">
                      <button
                        onClick={() => setWrapChoice("more")}
                        className="rounded-xl bg-primary px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-primary-hover"
                      >
                        Masih ada pertanyaan
                      </button>
                      <button
                        onClick={confirmDone}
                        disabled={closing}
                        className="rounded-xl border border-border bg-surface px-3.5 py-2 text-[12px] font-semibold text-foreground transition-colors hover:bg-primary-light disabled:opacity-50"
                      >
                        Tidak, terima kasih
                      </button>
                    </div>
                  )}

                  {wrapChoice !== "ask" && (
                    <QuickActionGrid onPick={sendText} disabled={sending} />
                  )}
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* input */}
        <div className="flex-shrink-0 border-t border-border px-3 py-3 sm:px-4">
          <div className="flex items-center gap-2 rounded-full border-[1.5px] border-border bg-background px-4 py-2 transition-colors focus-within:border-primary">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Tulis pesanmu ke Admin HospitalLink…"
              disabled={!conversation}
              className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-subtle"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending || !conversation}
              aria-label="Kirim pesan"
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
                input.trim() && conversation && !sending
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
          <p className="mt-2 text-center text-[10px] text-subtle">
            Chat langsung dengan Admin HospitalLink · Bukan chatbot
          </p>
        </div>
      </div>

      <style>{`
        @keyframes msgIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .msg-in { animation: msgIn 0.2s ease-out; }
        @media (prefers-reduced-motion: reduce) { .msg-in { animation: none; } }
      `}</style>

      {pendingDelete && (
        <ConfirmDialog
          title="Hapus riwayat percakapan?"
          message="Riwayat percakapan sebelumnya disembunyikan dari tampilanmu dan kamu memulai percakapan baru. Admin tetap menyimpan catatan percakapan ini."
          confirmLabel="Hapus"
          tone="danger"
          busy={deleting}
          onConfirm={handleClear}
          onCancel={() => setPendingDelete(false)}
        />
      )}
    </div>
  )
}
