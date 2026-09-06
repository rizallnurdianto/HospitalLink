# HospitaLink

Dibangun dengan React, Vite, TypeScript, dan Tailwind CSS, dengan Supabase sebagai
backend (database, auth, storage, dan realtime).

---

## Daftar Isi

1. [Latar Belakang & Urgensi](#1-latar-belakang--urgensi)
2. [Penjelasan Aplikasi](#2-penjelasan-aplikasi)
3. [Fitur Utama](#3-fitur-utama)
4. [Teknologi yang Digunakan](#4-teknologi-yang-digunakan)
5. [Cara Instalasi](#5-cara-instalasi)
6. [Cara Penggunaan](#6-cara-penggunaan)
7. [Struktur Proyek](#struktur-proyek)
8. [Sumber Data](#sumber-data)

---

## 1. Latar Belakang & Urgensi

Bayangkan situasi keluarga sedang membutuhkan rumah sakit dengan layanan jantung yang paling dekat, malam hari, dan berada di kota yang belum begitu dikenal. Dalam kondisi seperti itu, hal yang biasanya dilakukan adalah membuka Google, lalu berpindah dari satu informasi ke informasi lainnya. Mulai dari Google Maps untuk mencari lokasi, situs resmi rumah sakit kalau memang tersedia dan masih rutin diperbarui, grup WhatsApp keluarga atau tetangga untuk meminta rekomendasi, sampai media sosial untuk memastikan apakah ulasan yang ditemukan masih relevan. Semua proses tersebut membutuhkan waktu, padahal dalam situasi darurat, waktu adalah sesuatu yang sangat berharga dan tidak selalu dimiliki.

Ini bukan sekadar masalah yang kami buat untuk kebutuhan proposal. Beberapa data berikut menunjukkan bahwa persoalan ini memang memiliki skala yang cukup besar:

* Indonesia memiliki ribuan rumah sakit yang tersebar dari Sabang sampai Merauke. Dalam proses validasi kebijakan Kelas Rawat Inap Standar (KRIS), Kementerian Kesehatan mencatat sekitar 3.057-3.228 rumah sakit di seluruh Indonesia yang menjadi acuan kebijakan tersebut sepanjang 2024-2025. Sayangnya, sebanyak itu informasi belum benar-benar terkumpul dalam satu tempat yang mudah dan dapat diandalkan oleh masyarakat. Sebagian besar data masih tersebar di situs masing-masing rumah sakit, forum, maupun ulasan yang belum tentu terverifikasi.

* Di sisi lain, informasi mengenai kesehatan justru menjadi salah satu topik yang paling banyak dicari masyarakat Indonesia secara online. Berdasarkan Survei Penetrasi & Perilaku Internet APJII 2023, konten seputar kesehatan bahkan berada di atas olahraga dan hiburan dalam hal pencarian. Artinya, kebutuhan masyarakat terhadap informasi kesehatan sebenarnya sudah sangat besar. Yang masih menjadi persoalan adalah bagaimana informasi tersebut bisa disajikan melalui saluran yang dapat dipercaya.

* Penetrasi internet nasional pada 2026 juga sudah mencapai 81,72%, atau sekitar 235 juta orang yang terhubung ke internet. Secara logika, jumlah pengguna sebesar ini seharusnya membuat akses terhadap informasi menjadi jauh lebih mudah. Namun pada kenyataannya, kondisi tersebut juga bisa menimbulkan masalah baru. Semakin banyak sumber informasi yang tersedia, semakin besar pula kemungkinan masyarakat menemukan informasi yang sudah tidak diperbarui atau bahkan tidak akurat.

* Kelas rumah sakit, yaitu A, B, C, dan D berdasarkan Permenkes No. 3 Tahun 2020, juga menentukan hal-hal yang cukup konkret, mulai dari jenis layanan spesialis, jumlah tempat tidur, hingga peralatan medis yang tersedia. Perbedaan antar kelas rumah sakit tersebut cukup signifikan. Karena itu, ketika pasien atau keluarga memiliki ekspektasi yang keliru terhadap kemampuan sebuah rumah sakit, masalahnya bisa menjadi cukup serius. Hal ini juga bukan sesuatu yang jarang terjadi. Catatan Ombudsman RI di berbagai daerah berulang kali menunjukkan adanya keluhan mengenai pelayanan informasi kepada pasien dan keluarganya.

Kalau semua hal tersebut ditarik ke satu kesimpulan, sebenarnya informasi mengenai rumah sakit di Indonesia bukan tidak ada. Justru sebaliknya, jumlahnya sangat banyak. Masalahnya, informasi tersebut masih tersebar di berbagai tempat, tidak selalu melalui proses verifikasi, dan bisa dengan mudah menjadi tidak relevan ketika terjadi perubahan pada kelas rumah sakit, layanan yang tersedia, maupun jadwal dokter.

Dari kebutuhan itulah HospitaLink lahir. HospitaLink bukan aplikasi rekam medis dan bukan pula sekadar agregator ulasan rumah sakit. HospitaLink dirancang sebagai direktori terpusat, di mana setiap data dikelola dan diverifikasi oleh admin. Ketika ada informasi yang belum terjawab di halaman detail rumah sakit, pengguna juga dapat langsung menanyakannya melalui fitur live chat. Dengan begitu, masyarakat tidak perlu lagi mengandalkan tebakan, mencari informasi dari forum yang belum tentu terpercaya, atau bertanya dari satu grup keluarga ke grup lainnya hanya untuk mendapatkan informasi dasar mengenai sebuah rumah sakit.

> Aplikasi ini murni untuk **pencarian informasi rumah sakit**, bukan aplikasi
> rekam medis atau layanan kesehatan pasien, karena itu pengguna umum disebut
> **"Pengguna"**, bukan "Pasien", dan tidak ada data kesehatan pribadi yang
> disimpan.

---

## 2. Penjelasan Aplikasi

Dari satu basis kode, HospitaLink menyajikan tiga bagian:

| Bagian | Untuk Siapa | Fungsi |
| --- | --- | --- |
| **Landing Page** | Publik | Memperkenalkan produk sebelum masuk/daftar |
| **Portal Pengguna** | Siapa saja yang mencari rumah sakit | Cari & saring, simpan favorit, lihat detail, chat dengan admin |
| **Portal Admin** | Pengelola aplikasi | Kelola direktori rumah sakit, akun pengguna, kotak masuk chat, dan pengaturan sumber kebenaran tunggal yang dibaca Portal Pengguna |

Prinsip di baliknya sederhana: satu sumber data yang dijaga admin, dibaca oleh
banyak pengguna, dan setiap celah informasi yang belum tercakup ditutup lewat
percakapan langsung — bukan dibiarkan jadi tebakan.

---

## 3. Fitur Utama

- **Direktori rumah sakit nasional** — mencakup provinsi, jenis kepemilikan
  (Swasta/Pemerintah), kategori (RSU, RSIA, RS Jantung, dll.), dan kelas rumah
  sakit (A/B/C/D sesuai Permenkes), lengkap dengan galeri foto.
- **Pencarian & filter** — cari berdasarkan nama, layanan, kategori, kelas,
  maupun provinsi.
- **Bookmark** — simpan rumah sakit favorit untuk diakses kembali dengan cepat.
- **Live chat dengan Admin** — satu ruang obrolan berkelanjutan per pengguna;
  admin dapat mengirim "kartu rumah sakit" langsung di dalam chat yang bisa
  diklik menuju halaman detail.
- **Autentikasi fleksibel** — daftar/masuk dengan email-password atau **Google
  Sign-In**, lupa/atur ulang kata sandi, dan onboarding satu kali untuk
  melengkapi profil (nama, nomor HP, provinsi).
- **Notifikasi real-time** — bel notifikasi untuk balasan admin, rumah sakit
  baru, dan pengumuman, tanpa perlu refresh halaman (Supabase Realtime).
- **Portal Admin lengkap** — CRUD direktori rumah sakit + upload galeri foto,
  kelola akun pengguna (aktif/nonaktif), kotak masuk chat terpusat, dan
  pengaturan aplikasi.
- **Keamanan berbasis Row Level Security (RLS)** — setiap pengguna hanya bisa
  melihat/mengubah datanya sendiri; hanya admin yang bisa mengelola direktori
  dan pengaturan. Hanya ada **satu** akun admin, dijamin oleh constraint
  database.
- **Hapus akun mandiri** — pengguna bisa menghapus akunnya sendiri beserta
  seluruh data terkait langsung dari halaman profil.
- **Desain konsisten & responsif** — satu design system (`src/components/ui`)
  dipakai bersama oleh landing page, Portal Pengguna, dan Portal Admin.

---

## 4. Teknologi yang Digunakan

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

## 5. Cara Instalasi

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
HTML dari `supabase/email-templates/` untuk masing - masing jenis email (konfirmasi
daftar, reset password, magic link).

---

## 6. Cara Penggunaan

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

#### Akun demo admin

Untuk keperluan review/penjurian, berikut akun admin yang sudah disiapkan lewat
`pnpm admin:create`. Masuk di `http://localhost:5173/login`, lalu akses Portal
Admin di `/admin`:

| Email | Password |
| --- | --- |
| `admin@hospitalink.test` | `Admin12345!` |

> Ini akun demo/testing, bukan akun produksi. Kalau project sudah dipakai secara
> nyata, ganti passwordnya lewat halaman profil atau buat ulang lewat
> `pnpm admin:create` dengan `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` yang baru,
> lalu hapus baris kredensial ini dari README sebelum dipublikasikan.

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

---

## Sumber Data

1: Kontan.co.id, *"Rumah Sakit Belum Siap Laksanakan Kebijakan KRIS, Persi Ungkap Kendalanya"*, 30 Mei 2025.

2: Kontan.co.id, *"Menkes: Implementasi Layanan Kelas Rawat Inap Standar (KRIS) Ditargetkan Juni 2025"*, 11 Februari 2025.

3: APJII, *Survei Penetrasi & Perilaku Internet Indonesia 2023*.

4: APJII, *Survei Penetrasi & Perilaku Internet Indonesia 2026* (dirilis Mei 2026), sebagaimana dilaporkan detikInet.

5: Peraturan Menteri Kesehatan Republik Indonesia Nomor 3 Tahun 2020 tentang Klasifikasi dan Perizinan Rumah Sakit.

6: Kumpulan laporan Ombudsman RI perwakilan daerah (2018–2025) terkait keluhan pelayanan informasi rumah sakit kepada pasien dan keluarga.

