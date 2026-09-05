import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useNavigate } from "react-router-dom"
import { Bookmark } from "lucide-react"
import { useAuth } from "./AuthContext"
import { useToast } from "./ToastContext"
import {
  addBookmark,
  listMyBookmarkIds,
  removeBookmark,
} from "../api/bookmarks"

type BookmarkValue = {
  bookmarkIds: string[]
  isBookmarked: (id: string) => boolean
  toggle: (hospitalId: string) => Promise<void>
  loading: boolean
}

const BookmarkContext = createContext<BookmarkValue | null>(null)

/**
 * Satu store bookmark bersama untuk seluruh portal pengguna; semua card,
 * badge sidebar, dan halaman Tersimpan membaca state yang sama, jadi toggle
 * di mana pun langsung ter-update di semua tempat (dan menampilkan toast konfirmasi).
 */
export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const userId = session?.user.id
  const [ids, setIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setIds([])
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    listMyBookmarkIds(userId)
      .then((rows) => active && setIds(rows))
      .catch((e) => console.error(e))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [userId])

  const toggle = useCallback(
    async (hospitalId: string) => {
      if (!userId) return
      const has = ids.includes(hospitalId)
      setIds((prev) =>
        has ? prev.filter((x) => x !== hospitalId) : [...prev, hospitalId],
      )
      try {
        if (has) await removeBookmark(userId, hospitalId)
        else await addBookmark(userId, hospitalId)
        showToast(has ? "Dihapus dari tersimpan" : "Rumah sakit disimpan", {
          icon: <Bookmark size={16} fill={has ? "none" : "currentColor"} />,
          action: has
            ? undefined
            : { label: "Lihat", onClick: () => navigate("/bookmark") },
        })
      } catch (e) {
        console.error(e)
        setIds((prev) =>
          has ? [...prev, hospitalId] : prev.filter((x) => x !== hospitalId),
        )
        showToast("Gagal menyimpan. Coba lagi.")
      }
    },
    [userId, ids, showToast, navigate],
  )

  const value = useMemo<BookmarkValue>(
    () => ({
      bookmarkIds: ids,
      isBookmarked: (id: string) => ids.includes(id),
      toggle,
      loading,
    }),
    [ids, toggle, loading],
  )

  return (
    <BookmarkContext.Provider value={value}>
      {children}
    </BookmarkContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBookmarks(): BookmarkValue {
  const ctx = useContext(BookmarkContext)
  if (!ctx)
    throw new Error("useBookmarks harus dipakai di dalam <BookmarkProvider>")
  return ctx
}
