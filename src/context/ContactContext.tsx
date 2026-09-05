import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"
import ContactHospitalModal from "../components/common/ContactHospitalModal"
import type { Hospital } from "../types/db"

type ContactValue = { openContact: (hospital: Hospital) => void }

const ContactContext = createContext<ContactValue | null>(null)

export function ContactProvider({ children }: { children: React.ReactNode }) {
  const [hospital, setHospital] = useState<Hospital | null>(null)
  const openContact = useCallback((h: Hospital) => setHospital(h), [])
  const value = useMemo(() => ({ openContact }), [openContact])

  return (
    <ContactContext.Provider value={value}>
      {children}
      {hospital && (
        <ContactHospitalModal
          hospital={hospital}
          onClose={() => setHospital(null)}
        />
      )}
    </ContactContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useContact(): ContactValue {
  const ctx = useContext(ContactContext)
  if (!ctx)
    throw new Error("useContact harus dipakai di dalam <ContactProvider>")
  return ctx
}
