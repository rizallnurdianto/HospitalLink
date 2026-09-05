# HospitaLink

**Direktori rumah sakit terpusat — cari, saring, dan tanya langsung ke admin.**

Dibangun dengan React, Vite, TypeScript, dan Tailwind CSS, dengan Supabase sebagai
backend (database, auth, storage, dan realtime).

---

## Daftar Isi

1. [Penjelasan Aplikasi](#1-penjelasan-aplikasi)
2. [Fitur Utama](#2-fitur-utama)
3. [Teknologi yang Digunakan](#3-teknologi-yang-digunakan)
4. [Cara Instalasi](#4-cara-instalasi)
5. [Cara Penggunaan](#5-cara-penggunaan)
6. [Struktur Proyek](#struktur-proyek)

---

## 1. Penjelasan Aplikasi

Mencari informasi rumah sakit yang lengkap dan terpercaya — layanan yang tersedia,
jadwal dokter, kelas rumah sakit, hingga cara menghubungi — sering kali tersebar di
banyak sumber dan tidak selalu akurat. **HospitaLink** dibuat untuk menjawab masalah
ini dengan menyediakan **satu direktori rumah sakit terpusat** yang datanya dikelola
dan diverifikasi oleh admin, sehingga pengguna cukup mencari, menyaring, dan melihat
detail rumah sakit dari satu tempat — termasuk bertanya langsung ke admin lewat live
chat bila informasi yang dicari belum tersedia.

> Aplikasi ini murni untuk **pencarian informasi rumah sakit**, bukan aplikasi rekam
> medis atau layanan kesehatan pasien — karena itu pengguna umum disebut **"Pengguna"**,
> bukan "Pasien", dan tidak ada data kesehatan pribadi yang disimpan.

Dari satu basis kode, HospitaLink menyajikan tiga bagian:

| Bagian | Untuk Siapa | Fungsi |
| --- | --- | --- |
| **Landing Page** | Publik | Memperkenalkan produk sebelum masuk/daftar |
| **Portal Pengguna** | Siapa saja yang mencari rumah sakit | Cari & saring, simpan favorit, lihat detail, chat dengan admin |
| **Portal Admin** | Pengelola aplikasi | Kelola direktori rumah sakit, akun pengguna, kotak masuk chat, dan pengaturan — sumber kebenaran tunggal yang dibaca Portal Pengguna |

---

## 2. Fitur Utama

- **Direktori rumah sakit nasional** — mencakup provinsi, jenis kepemilikan
  (Swasta/Pemerintah), kategori (RSU, RSIA, RS Jantung, dll.), dan kelas rumah sakit
  (A/B/C/D sesuai Permenkes), lengkap dengan galeri foto.
- **Pencarian & filter** — cari berdasarkan nama, layanan, kategori, kelas, maupun
  provinsi.
- **Bookmark** — simpan rumah sakit favorit untuk diakses kembali dengan cepat.
- **Live chat dengan Admin** — satu ruang obrolan berkelanjutan per pengguna; admin
  dapat mengirim "kartu rumah sakit" langsung di dalam chat yang bisa diklik menuju
  halaman detail.
- **Autentikasi fleksibel** — daftar/masuk dengan email-password atau **Google
  Sign-In**, lupa/atur ulang kata sandi, dan onboarding satu kali untuk melengkapi
  profil (nama, nomor HP, provinsi).
- **Notifikasi real-time** — bel notifikasi untuk balasan admin, rumah sakit baru,
  dan pengumuman, tanpa perlu refresh halaman (Supabase Realtime).
- **Portal Admin lengkap** — CRUD direktori rumah sakit + upload galeri foto, kelola
  akun pengguna (aktif/nonaktif), kotak masuk chat terpusat, dan pengaturan aplikasi.
- **Keamanan berbasis Row Level Security (RLS)** — setiap pengguna hanya bisa
  melihat/mengubah datanya sendiri; hanya admin yang bisa mengelola direktori dan
  pengaturan. Hanya ada **satu** akun admin, dijamin oleh constraint database.
- **Hapus akun mandiri** — pengguna bisa menghapus akunnya sendiri beserta seluruh
  data terkait langsung dari halaman profil.
- **Desain konsisten & responsif** — satu design system (`src/components/ui`)
  dipakai bersama oleh landing page, Portal Pengguna, dan Portal Admin.

---

## 3. Teknologi yang Digunakan

### Frontend

| Teknologi | Kegunaan |
| --- | --- |
| [React 19](https://react.dev/) + React DOM | Library UI utama |
| [Vite](https://vite.dev/) | Build tool & dev server (HMR cepat) |
| [TypeScript](https://www.typescriptlang.org/) | Type safety di seluruh basis kode |
| [React Router 7](https://reactrouter.com/) | Routing sisi klien (`AppRouter`, `ProtectedRoute`, `AdminRoute`) |
| [Tailwind CSS v4](https://tailwindcss.com/) | Styling berbasis utility class + token desain kustom di `src/index.css` |
| [Framer Motion](https://www.framer.com/motion/) | Animasi scroll-reveal & transisi di landing page |
| [lucide-react](https://lucide.dev/) | Ikon |

### Backend & Infrastruktur — [Supabase](https://supabase.com/)

| Layanan Supabase | Kegunaan |
| --- | --- |
| **Postgres Database** | Skema, RLS policy, dan trigger — didefinisikan sebagai migrasi SQL di `supabase/migrations/` |
| **Supabase Auth** | Email/password + OAuth Google, dengan template email ter-branding (`supabase/email-templates/`) |
| **Supabase Storage** | Bucket `hospital-images` untuk foto rumah sakit |
| **Supabase Realtime** | Update langsung untuk rumah sakit, percakapan, dan pesan chat |
| `@supabase/supabase-js` | Client library resmi untuk mengakses semuanya di atas |

### Tooling & Dev Dependencies

| Tool | Kegunaan |
| --- | --- |
| `pg` + `dotenv` | Dipakai script Node.js di `scripts/` (migrasi, seeding, verifikasi) untuk konek langsung ke Postgres, terpisah dari client browser |
| `playwright-core` | Otomasi browser untuk test end-to-end/UI (`pnpm test:ui`, `pnpm test:landing`) |
| `oxfmt` | Code formatter |
| `pnpm` | Package manager |

---

## 4. Cara Instalasi

**Prasyarat:** Node.js 22, pnpm, dan sebuah [project Supabase](https://supabase.com/).

### 1) Install dependencies

```bash
pnpm install
```

### 2) Siapkan environment variables

Salin `.env.example` menjadi `.env.local`, lalu isi dengan kredensial project Supabase
Anda:

```bash
cp .env.example .env.local
```

| Variabel | Keterangan |
| --- | --- |
| `VITE_SUPABASE_URL` | URL project Supabase (aman diekspos ke browser) |
| `VITE_SUPABASE_ANON_KEY` | Anon/public key Supabase (aman diekspos ke browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key — **hanya** dipakai script di `scripts/`, jangan pernah diimpor ke `src/` |
| `SUPABASE_DB_URL` | Connection string Postgres (Session pooler) dari Supabase → Settings → Database |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Kredensial akun admin satu-satunya yang akan dibuat |

### 3) Setup database (sekali di awal)

```bash
pnpm db:push      # menerapkan seluruh migrasi SQL (skema, RLS, trigger)
pnpm db:seed      # mengisi direktori rumah sakit + pengaturan default (tanpa akun)
pnpm admin:create # membuat satu-satunya akun admin dari SEED_ADMIN_EMAIL/PASSWORD
```

### 4) (Opsional) Aktifkan Google Sign-In

Di Supabase Dashboard → **Authentication → Providers → Google**, aktifkan dan isi
Client ID/Secret dari Google Cloud Console. Tambahkan juga
`http://localhost:5173/**` di **Authentication → URL Configuration** untuk
pengembangan lokal.

### 5) (Opsional) Terapkan template email ter-branding

Buka **Authentication → Email Templates** di Supabase Dashboard, lalu tempel isi file
HTML dari `supabase/email-templates/` untuk masing-masing jenis email (konfirmasi
daftar, reset password, magic link).

---

## 5. Cara Penggunaan

### Menjalankan mode pengembangan (Hot Module Replacement)

```bash
pnpm dev
```

Aplikasi berjalan di `http://localhost:5173`.

### Build untuk produksi

```bash
pnpm build
```

Menjalankan pengecekan tipe (`tsc --noEmit`) lalu build Vite; hasilnya ada di folder
`dist/`.

### Preview hasil build produksi secara lokal

```bash
pnpm preview
```

### Perintah lain yang tersedia

```bash
pnpm typecheck     # cek tipe TypeScript saja, tanpa build
pnpm format        # format kode dengan oxfmt
pnpm db:verify     # verifikasi skema/RLS/trigger sesuai migrasi
pnpm demo:purge    # hapus akun demo lama (peninggalan versi awal)
pnpm db:seed:test  # buat akun tetap TEST_* untuk kebutuhan automated testing
pnpm db:e2e        # jalankan test end-to-end backend
pnpm test:ui       # jalankan test UI otomatis (Portal Pengguna & Admin)
pnpm test:landing  # jalankan test khusus landing page
```

> **Perhatian:** `pnpm db:e2e`, `pnpm test:ui`, dan `pnpm test:landing` menjalankan
> `pnpm db:seed:test` terlebih dahulu, yang akan **menurunkan (demote) admin lain**
> menjadi Pengguna biasa. Arahkan perintah-perintah ini hanya ke project Supabase yang
> memang digunakan khusus untuk testing, bukan project produksi.

### Mencoba aplikasi

Setelah `pnpm dev` berjalan, buka `http://localhost:5173`:

- Masuk sebagai **admin** (akun dari `pnpm admin:create`) untuk mengelola direktori
  rumah sakit, pengguna, dan kotak masuk chat di `/admin`.
- Daftar akun baru lewat `/register` (atau "Daftar dengan Google") untuk mencoba
  Portal Pengguna — cari rumah sakit, simpan bookmark, dan chat dengan admin.

---

## Struktur Proyek

```
HospitaLink/
├── src/
│   ├── pages/            # Halaman: landing, auth, Portal Pengguna, Portal Admin
│   ├── components/
│   │   ├── ui/           # Design system bersama (Card, Button, Modal, dll.)
│   │   ├── common/       # Komponen bersama kedua portal (AppLayout, TopBar, dll.)
│   │   └── admin/        # Komponen khusus Portal Admin
│   ├── api/              # Satu modul per domain untuk query Supabase
│   ├── hooks/            # Custom hooks (useHospitals, useConversations, dll.)
│   ├── context/          # Auth, Toast, Bookmark, Contact context
│   ├── routes/           # AppRouter, ProtectedRoute, AdminRoute
│   ├── lib/              # Helper (format, authFlow, provinces, dll.)
│   └── types/            # Tipe domain/database bersama
├── supabase/
│   ├── migrations/       # Migrasi SQL: skema, RLS policy, trigger
│   └── email-templates/  # Template HTML email Supabase Auth
├── scripts/              # Script Node.js: migrasi, seeding, admin, testing
└── public/                # Aset statis
```
