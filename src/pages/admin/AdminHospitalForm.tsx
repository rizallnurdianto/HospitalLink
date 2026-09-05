import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  CheckCircle2,
  ImageOff,
  ImagePlus,
  Info,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react"
import {
  createHospital,
  getHospitalById,
  slugExists,
  updateHospital,
  uploadHospitalImages,
} from "../../api/hospitals"
import { slugify } from "../../lib/format"
import {
  HOSPITAL_CATEGORIES,
  DEFAULT_HOSPITAL_CATEGORY,
} from "../../lib/hospitalCategories"
import {
  HOSPITAL_CLASSES,
  HOSPITAL_CLASS_INFO,
} from "../../lib/hospitalClasses"
import TagInput from "../../components/admin/TagInput"
import { Alert, Button, Card, Dropdown, Spinner } from "../../components/ui"
import UnsavedChangesPrompt from "../../components/common/UnsavedChangesPrompt"
import ProvinceSelect from "../../components/common/ProvinceSelect"
import { useToast } from "../../context/ToastContext"
import type {
  HospitalInput,
  HospitalType,
  OperationalHour,
  Specialist,
} from "../../types/db"

const EMPTY: HospitalInput = {
  slug: "",
  name: "",
  short_name: "",
  location: "",
  province: "",
  address: "",
  phone: "",
  type: "Rumah Sakit Swasta",
  category: DEFAULT_HOSPITAL_CATEGORY,
  hospital_class: "",
  description: "",
  image_url: "",
  images: [],
  is_open_24h: false,
  closing_time: "",
  beds: 0,
  established: null,
  services: [],
  facilities: [],
  specialists: [],
  operational_hours: [],
  is_active: true,
}

export default function AdminHospitalForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [form, setForm] = useState<HospitalInput>(EMPTY)
  // Snapshot state terakhir yang tersimpan; dipakai untuk deteksi perubahan belum disimpan.
  const [saved, setSaved] = useState<HospitalInput>(EMPTY)
  const [justSaved, setJustSaved] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getHospitalById(id)
      .then((h) => {
        if (!h) {
          setError("Rumah sakit tidak ditemukan.")
          return
        }
        const loaded: HospitalInput = {
          slug: h.slug,
          name: h.name,
          short_name: h.short_name,
          location: h.location,
          province: h.province ?? "",
          address: h.address,
          phone: h.phone,
          type: h.type,
          category: h.category ?? DEFAULT_HOSPITAL_CATEGORY,
          hospital_class: h.hospital_class ?? "",
          description: h.description,
          image_url: h.image_url,
          images:
            h.images?.length > 0 ? h.images : h.image_url ? [h.image_url] : [],
          is_open_24h: h.is_open_24h,
          closing_time: h.closing_time ?? "",
          beds: h.beds,
          established: h.established,
          services: h.services,
          facilities: h.facilities,
          specialists: h.specialists,
          operational_hours: h.operational_hours,
          is_active: h.is_active,
        }
        setForm(loaded)
        setSaved(loaded)
        setSlugTouched(true)
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [id])

  const effectiveSlug = useMemo(
    () => (slugTouched ? form.slug : slugify(form.name)),
    [slugTouched, form.slug, form.name],
  )

  const isDirty = useMemo(
    () =>
      !loading && !justSaved && JSON.stringify(form) !== JSON.stringify(saved),
    [loading, justSaved, form, saved],
  )

  // Tinggalkan halaman hanya setelah simpan berhasil menonaktifkan guard.
  useEffect(() => {
    if (justSaved) navigate("/admin/hospitals")
  }, [justSaved, navigate])

  const set = <K extends keyof HospitalInput,>(
    key: K,
    value: HospitalInput[K],
  ) => setForm((f) => ({ ...f, [key]: value }))

  const setImages = (next: string[]) =>
    setForm((f) => ({ ...f, images: next, image_url: next[0] ?? "" }))

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ""
    if (files.length === 0) return
    setUploading(true)
    setError(null)
    try {
      const urls = await uploadHospitalImages(files)
      setImages([...form.images, ...urls])
    } catch (err) {
      setError(`Gagal mengunggah gambar: ${(err as Error).message}`)
    } finally {
      setUploading(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.name.trim()) return setError("Nama rumah sakit wajib diisi.")
    if (!form.province) return setError("Provinsi wajib dipilih.")
    const slug = (effectiveSlug || slugify(form.name)).trim()
    if (!slug) return setError("Slug tidak valid.")

    setSaving(true)
    try {
      if (await slugExists(slug, id)) {
        setError(`Slug "${slug}" sudah dipakai rumah sakit lain.`)
        setSaving(false)
        return
      }

      const payload: HospitalInput = {
        ...form,
        slug,
        closing_time: form.is_open_24h ? null : form.closing_time || null,
        beds: Number(form.beds) || 0,
        established: form.established ? Number(form.established) : null,
      }

      // activity_log ditulis otomatis oleh trigger DB on_hospital_change.
      if (isEdit && id) {
        await updateHospital(id, payload)
      } else {
        await createHospital(payload)
      }
      showToast(
        isEdit
          ? `Perubahan "${payload.name}" disimpan`
          : `"${payload.name}" ditambahkan`,
        { icon: <CheckCircle2 size={16} /> },
      )
      // Nonaktifkan guard perubahan-belum-disimpan sebelum berpindah halaman.
      setSaved(payload)
      setJustSaved(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="mx-auto max-w-6xl">
      <UnsavedChangesPrompt when={isDirty} />

      {/* header sticky: link kembali + info tetap terlihat saat scroll */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/90 px-4 pb-3 pt-4 backdrop-blur-sm sm:px-6 lg:px-8">
        <Link
          to="/admin/hospitals"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted transition-colors hover:text-primary"
        >
          <ArrowLeft size={15} />
          Data Rumah Sakit
        </Link>
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-primary-light bg-primary-light px-3 py-2">
          <Info size={13} className="mt-0.5 flex-shrink-0 text-primary" />
          <p className="text-[11px] leading-relaxed text-primary">
            Perubahan langsung tampil di Portal Pengguna. Jadwal dokter dan jam
            operasional bersifat informatif, bukan data real-time.
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        {error && (
          <div className="mb-4">
            <Alert tone="error">{error}</Alert>
          </div>
        )}

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Card className="flex flex-col gap-4 p-5">
            <SectionTitle hint="Nama, tipe, dan alamat URL rumah sakit.">
              Identitas
            </SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Nama Rumah Sakit"
                value={form.name}
                onChange={(v) => set("name", v)}
                required
              />
              <TextField
                label="Nama Singkat"
                value={form.short_name}
                onChange={(v) => set("short_name", v)}
              />
              <SelectField
                label="Tipe"
                required
                value={form.type}
                onChange={(v) => set("type", v as HospitalType)}
                options={[
                  {
                    value: "Rumah Sakit Swasta",
                    label: "Rumah Sakit Swasta",
                  },
                  {
                    value: "Rumah Sakit Pemerintah",
                    label: "Rumah Sakit Pemerintah",
                  },
                ]}
              />
              <SelectField
                label="Kategori"
                required
                value={form.category}
                onChange={(v) => set("category", v)}
                hint="Jenis rumah sakit, terpisah dari tipe kepemilikan."
                searchable
                options={HOSPITAL_CATEGORIES.map((c) => ({
                  value: c,
                  label: c,
                }))}
              />
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <FieldLabel label="Slug URL" />
                <input
                  value={effectiveSlug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    set("slug", e.target.value)
                  }}
                  className={FIELD_CLS}
                />
                <span className="text-[10px] text-subtle">
                  /hospital/{effectiveSlug || "…"}
                </span>
              </label>
            </div>
            <TextArea
              label="Deskripsi"
              value={form.description}
              onChange={(v) => set("description", v)}
            />
            <div className="flex flex-col gap-2">
              <FieldLabel label="Gambar Rumah Sakit" />
              <div className="flex flex-wrap items-center gap-3">
                <label
                  className={`flex items-center gap-2 rounded-xl border-[1.5px] border-dashed border-border bg-background px-3.5 py-2.5 text-[13px] font-semibold text-muted transition-colors ${
                    uploading
                      ? "cursor-wait opacity-60"
                      : "cursor-pointer hover:border-primary hover:text-primary"
                  }`}
                >
                  {uploading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ImagePlus size={14} />
                  )}
                  {uploading
                    ? "Mengunggah…"
                    : form.images.length > 0
                      ? "Tambah gambar"
                      : "Unggah gambar"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/avif"
                    multiple
                    className="hidden"
                    disabled={uploading}
                    onChange={handleImageUpload}
                  />
                </label>
                {form.images.length > 0 && (
                  <span className="text-[11px] font-semibold text-muted">
                    {form.images.length} gambar
                  </span>
                )}
              </div>

              {form.images.length > 0 && (
                <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {form.images.map((url, i) => (
                    <ImageThumb
                      key={url}
                      url={url}
                      cover={i === 0}
                      onRemove={() =>
                        setImages(form.images.filter((_, j) => j !== i))
                      }
                      onMakeCover={() =>
                        setImages([
                          url,
                          ...form.images.filter((_, j) => j !== i),
                        ])
                      }
                    />
                  ))}
                </div>
              )}

              <span className="text-[10px] text-subtle">
                Bisa pilih beberapa file sekaligus. Format JPG, PNG, WebP, atau
                AVIF, maksimal 5 MB per file. Gambar pertama dipakai sebagai
                sampul.
              </span>
            </div>
          </Card>

          {/* tanpa overflow-hidden di sini: popup ProvinceSelect harus bisa keluar dari card */}
          <Card className="flex flex-col gap-4 p-5">
            <SectionTitle hint="Ditampilkan di halaman detail rumah sakit.">
              Kontak &amp; Lokasi
            </SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <ProvinceSelect
                required
                value={form.province}
                onChange={(v) => set("province", v)}
              />
              <TextField
                label="Kota / Kabupaten"
                value={form.location}
                onChange={(v) => set("location", v)}
                placeholder="mis. Semarang"
              />
              <div className="sm:col-span-2">
                <TextField
                  label="Nomor WhatsApp"
                  value={form.phone}
                  onChange={(v) => set("phone", v)}
                  placeholder="mis. 0812-3456-7890"
                  hint='Dipakai untuk tombol "Chat via WhatsApp" di Portal Pengguna. Boleh format 08… atau +62….'
                />
              </div>
            </div>
            <TextField
              label="Alamat Lengkap"
              value={form.address}
              onChange={(v) => set("address", v)}
            />
          </Card>

          <Card className="flex flex-col gap-4 p-5">
            <SectionTitle hint="Jam layanan, kelas, dan tahun berdiri.">
              Operasional &amp; Kelas
            </SectionTitle>
            <label className="flex items-center gap-2.5 rounded-xl border border-border-light bg-background px-3.5 py-2.5">
              <input
                type="checkbox"
                checked={form.is_open_24h}
                onChange={(e) => set("is_open_24h", e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <span className="text-sm font-semibold text-foreground">
                Buka 24 jam
              </span>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              {!form.is_open_24h && (
                <TextField
                  label="Jam Tutup"
                  value={form.closing_time ?? ""}
                  onChange={(v) => set("closing_time", v)}
                  placeholder="22:00"
                />
              )}
              <div className={form.is_open_24h ? "sm:col-span-2" : ""}>
                <NumberField
                  label="Tahun Berdiri"
                  value={form.established}
                  onChange={(v) => set("established", v)}
                />
              </div>
            </div>
            <SelectField
              label="Kelas Rumah Sakit"
              value={form.hospital_class}
              onChange={(v) => set("hospital_class", v)}
              hint={`Berdasarkan fasilitas, kapasitas tempat tidur, ketersediaan dokter spesialis, dan kemampuan pelayanan medis.${
                form.hospital_class
                  ? ` ${HOSPITAL_CLASS_INFO[form.hospital_class as keyof typeof HOSPITAL_CLASS_INFO]}`
                  : ""
              }`}
              options={[
                { value: "", label: "Belum ditentukan" },
                ...HOSPITAL_CLASSES.map((c) => ({
                  value: c,
                  label: `Kelas ${c}`,
                })),
              ]}
            />
          </Card>

          <Card className="flex flex-col gap-4 p-5">
            <SectionTitle hint="Tekan Enter untuk menambah setiap item.">
              Layanan &amp; Fasilitas
            </SectionTitle>
            <div className="flex flex-col gap-1.5">
              <FieldLabel label="Layanan" />
              <TagInput
                value={form.services}
                onChange={(v) => set("services", v)}
                placeholder="mis. IGD 24 Jam"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel label="Fasilitas" />
              <TagInput
                value={form.facilities}
                onChange={(v) => set("facilities", v)}
                placeholder="mis. ICU"
              />
            </div>
          </Card>

          <Card className="flex flex-col gap-4 p-5">
            <SectionTitle hint="Informatif, bukan jadwal real-time.">
              Dokter &amp; Spesialis
            </SectionTitle>
            <Repeater<Specialist>
              rows={form.specialists}
              onChange={(v) => set("specialists", v)}
              empty={{ name: "", specialty: "", schedule: "" }}
              addLabel="Tambah Dokter"
              render={(row, update) => (
                <div className="grid flex-1 gap-2.5 sm:grid-cols-2">
                  <MiniField
                    label="Nama dokter"
                    placeholder="dr. Nama, Sp.XX"
                    value={row.name}
                    onChange={(v) => update({ name: v })}
                  />
                  <MiniField
                    label="Spesialisasi"
                    placeholder="mis. Kardiologi"
                    value={row.specialty}
                    onChange={(v) => update({ specialty: v })}
                  />
                  <div className="sm:col-span-2">
                    <MiniField
                      label="Jadwal praktik"
                      placeholder="mis. Senin – Jumat, 09:00–14:00"
                      value={row.schedule}
                      onChange={(v) => update({ schedule: v })}
                    />
                  </div>
                </div>
              )}
            />
          </Card>

          <Card className="flex flex-col gap-4 p-5">
            <SectionTitle hint="Informatif, bukan data real-time.">
              Jam Operasional
            </SectionTitle>
            <Repeater<OperationalHour>
              rows={form.operational_hours}
              onChange={(v) => set("operational_hours", v)}
              empty={{ day: "", hours: "" }}
              addLabel="Tambah Baris"
              render={(row, update) => (
                <div className="grid flex-1 gap-2.5 sm:grid-cols-2">
                  <MiniField
                    label="Hari"
                    placeholder="mis. Senin – Jumat"
                    value={row.day}
                    onChange={(v) => update({ day: v })}
                  />
                  <MiniField
                    label="Jam"
                    placeholder="mis. 07:00 – 22:00 / Buka 24 Jam"
                    value={row.hours}
                    onChange={(v) => update({ hours: v })}
                  />
                </div>
              )}
            />
          </Card>

          {/* action bar sticky: selalu terjangkau */}
          <div className="sticky bottom-0 z-20 -mx-4 -mb-4 flex items-center justify-end gap-2 border-t border-border bg-background/90 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:-mb-6 sm:px-6 lg:-mx-8 lg:-mb-8 lg:px-8">
            <Button variant="secondary" to="/admin/hospitals">
              Batal
            </Button>
            <Button type="submit" loading={saving} disabled={uploading}>
              {isEdit ? "Simpan Perubahan" : "Simpan Rumah Sakit"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SectionTitle({
  children,
  hint,
}: {
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="-mx-5 -mt-5 border-b border-border-light px-5 pb-3 pt-4">
      <p className="font-display text-[13px] font-bold text-foreground">
        {children}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-muted">{hint}</p>}
    </div>
  )
}

const FIELD_CLS =
  "rounded-xl border-[1.5px] border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <span className="text-[11px] font-semibold text-muted">
      {label}
      {required && <span className="text-danger"> *</span>}
    </span>
  )
}

function SelectField({
  label,
  value,
  onChange,
  required,
  hint,
  searchable,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  hint?: string
  searchable?: boolean
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel label={label} required={required} />
      <Dropdown
        value={value}
        onChange={onChange}
        options={options}
        block
        tone="field"
        searchable={searchable}
      />
      {hint && <span className="text-[10px] text-subtle">{hint}</span>}
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  hint?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <FieldLabel label={label} required={required} />
      <input
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={FIELD_CLS}
      />
      {hint && <span className="text-[10px] text-subtle">{hint}</span>}
    </label>
  )
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <FieldLabel label={label} />
      <textarea
        value={value}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        className={`${FIELD_CLS} resize-y`}
      />
    </label>
  )
}

function NumberField({
  label,
  value,
  onChange,
  step,
}: {
  label: string
  value: number | null
  onChange: (v: number | null) => void
  step?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <FieldLabel label={label} />
      <input
        type="number"
        step={step}
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : Number(e.target.value))
        }
        className={FIELD_CLS}
      />
    </label>
  )
}

function MiniInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] outline-none transition-colors focus:border-primary"
    />
  )
}

function MiniField({
  label,
  ...rest
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold text-muted">{label}</span>
      <MiniInput {...rest} />
    </label>
  )
}

function ImageThumb({
  url,
  cover,
  onRemove,
  onMakeCover,
}: {
  url: string
  cover: boolean
  onRemove: () => void
  onMakeCover: () => void
}) {
  const [broken, setBroken] = useState(false)
  return (
    <div className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-background">
      {broken ? (
        <div className="flex h-full flex-col items-center justify-center gap-1 text-subtle">
          <ImageOff size={16} />
          <span className="text-[9px] font-semibold">Gagal dimuat</span>
        </div>
      ) : (
        <a href={url} target="_blank" rel="noreferrer" title="Lihat file">
          <img
            src={url}
            alt=""
            onError={() => setBroken(true)}
            className="h-full w-full object-cover"
          />
        </a>
      )}

      {cover && (
        <span className="absolute left-1.5 top-1.5 rounded-md bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white">
          Sampul
        </span>
      )}

      <button
        type="button"
        onClick={onRemove}
        aria-label="Hapus gambar"
        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-foreground/60 text-white transition-colors hover:bg-danger"
      >
        <Trash2 size={12} />
      </button>

      {!cover && (
        <button
          type="button"
          onClick={onMakeCover}
          className="absolute inset-x-0 bottom-0 bg-foreground/65 py-1 text-[9px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          Jadikan sampul
        </button>
      )}
    </div>
  )
}

function Repeater<T>({
  rows,
  onChange,
  empty,
  addLabel,
  render,
}: {
  rows: T[]
  onChange: (next: T[]) => void
  empty: T
  addLabel: string
  render: (row: T, update: (patch: Partial<T>) => void) => React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {rows.length === 0 && (
        <p className="rounded-xl border border-dashed border-border-light bg-background px-3 py-3 text-center text-[12px] text-subtle">
          Belum ada data. Klik "{addLabel}" untuk menambahkan.
        </p>
      )}
      {rows.map((row, i) => (
        <div
          key={i}
          className="flex items-start gap-2.5 rounded-xl border border-border-light bg-background p-2.5"
        >
          <span className="mt-1.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-light font-display text-[11px] font-bold text-primary">
            {i + 1}
          </span>
          {render(row, (patch) =>
            onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r))),
          )}
          <button
            type="button"
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            aria-label={`Hapus baris ${i + 1}`}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-danger-light hover:text-danger"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...rows, { ...empty }])}
        className="flex items-center gap-1.5 self-start rounded-lg border border-dashed border-border px-3 py-2 text-[12px] font-semibold text-muted transition-colors hover:border-primary hover:text-primary"
      >
        <Plus size={13} />
        {addLabel}
      </button>
    </div>
  )
}
