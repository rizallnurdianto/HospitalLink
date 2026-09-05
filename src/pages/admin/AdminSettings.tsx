import { useEffect, useState } from "react"
import { CheckCircle2, Save } from "lucide-react"
import { useSettings } from "../../hooks/useSettings"
import { updateSetting } from "../../api/settings"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../context/ToastContext"
import {
  Alert,
  Button,
  Card,
  CardTitle,
  Field,
  PageContainer,
  Spinner,
  TextArea,
  TextInput,
} from "../../components/ui"
import UnsavedChangesPrompt from "../../components/common/UnsavedChangesPrompt"
import type { SettingsMap } from "../../types/db"

export default function AdminSettings() {
  const { settings, loading, error, reload } = useSettings()
  const { session } = useAuth()
  const { showToast } = useToast()
  const [draft, setDraft] = useState<SettingsMap | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (settings) setDraft(structuredClone(settings))
  }, [settings])

  const isDirty =
    !!draft && !!settings && JSON.stringify(draft) !== JSON.stringify(settings)

  if (loading || !draft) return <Spinner />

  const save = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      await Promise.all([
        updateSetting(
          "support_service_hours",
          draft.support_service_hours,
          session!.user.id,
        ),
        updateSetting("support_email", draft.support_email, session!.user.id),
        updateSetting("announcement", draft.announcement, session!.user.id),
      ])
      showToast("Pengaturan disimpan", { icon: <CheckCircle2 size={16} /> })
      reload()
    } catch (e) {
      setSaveError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageContainer>
      <UnsavedChangesPrompt when={isDirty} />

      <div className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}
        {saveError && <Alert tone="error">{saveError}</Alert>}

        <Card className="flex flex-col gap-4 p-5">
          <CardTitle hint="Banner yang tampil di bagian atas Portal Pengguna.">
            Pengumuman Portal Pengguna
          </CardTitle>
          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={draft.announcement.enabled}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  announcement: {
                    ...draft.announcement,
                    enabled: e.target.checked,
                  },
                })
              }
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-sm font-semibold text-foreground">
              Tampilkan banner pengumuman
            </span>
          </label>
          <TextArea
            value={draft.announcement.text}
            rows={2}
            onChange={(e) =>
              setDraft({
                ...draft,
                announcement: { ...draft.announcement, text: e.target.value },
              })
            }
            placeholder="mis. Data 3 rumah sakit baru telah ditambahkan."
          />
        </Card>

        <Card className="flex flex-col gap-4 p-5">
          <CardTitle hint='Menentukan indikator "Admin online/offline" di halaman Bantuan pengguna (informatif).'>
            Jam Layanan Bantuan
          </CardTitle>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mulai (jam)">
              <TextInput
                type="number"
                min={0}
                max={23}
                value={draft.support_service_hours.start}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    support_service_hours: {
                      ...draft.support_service_hours,
                      start: Number(e.target.value),
                    },
                  })
                }
              />
            </Field>
            <Field label="Selesai (jam)">
              <TextInput
                type="number"
                min={0}
                max={24}
                value={draft.support_service_hours.end}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    support_service_hours: {
                      ...draft.support_service_hours,
                      end: Number(e.target.value),
                    },
                  })
                }
              />
            </Field>
          </div>
          <Field label="Email dukungan">
            <TextInput
              value={draft.support_email}
              onChange={(e) =>
                setDraft({ ...draft, support_email: e.target.value })
              }
            />
          </Field>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button onClick={save} loading={saving} icon={<Save size={14} />}>
            Simpan Pengaturan
          </Button>
        </div>
      </div>
    </PageContainer>
  )
}
