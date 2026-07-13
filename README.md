# Hybrid Library (Baca & Pinjam Komik)

"Hybrid Library" adalah sebuah platform modern berbasis web untuk menelusuri, membaca, dan melakukan pemesanan (booking) komik secara online. Aplikasi ini mengambil data secara langsung dari MangaDex dan Jikan, serta memiliki sistem *fallback* untuk memastikan ketersediaan layanan meskipun ada gangguan sumber data.

## Fitur Utama

- **Katalog & Pencarian**: Jelajahi komik terbaru atau cari komik spesifik.
- **Baca Komik Online (Reader)**: Baca chapter langsung di dalam platform dengan antarmuka yang ramah pengguna.
- **Sistem Fallback**: Apabila sumber utama (MangaDex) mengalami kendala jaringan atau diblokir, sistem akan menangani error secara elegan (khusus untuk server luar negeri seperti Vercel, pemblokiran umumnya tidak terjadi sehingga data *live* bisa ditampilkan).
- **Manajemen Akun & Autentikasi**: Registrasi dan login pengguna dengan JWT.
- **Sistem Booking/Peminjaman**: Pengguna dapat meminjam/mem-booking komik, dengan validasi maksimal satu *booking* aktif per buku.
- **Profil & Statistik**: Lacak riwayat baca, favorit, dan *bookmark*.

## Teknologi (Tech Stack)

Aplikasi dibangun dengan teknologi modern:
- **Frontend**: React 19, Vite, Tailwind CSS (v4), Framer Motion, Lucide React
- **Backend**: Express.js
- **Database**: SQLite (menggunakan `better-sqlite3`)
- **Autentikasi**: JSON Web Token (JWT)

## Cara Instalasi dan Menjalankan (Local Development)

1. **Clone Repositori**
   ```bash
   git clone https://github.com/zanworld/pemrog.git
   cd pemrog
   ```

2. **Instal Dependensi**
   ```bash
   npm install
   ```

3. **Jalankan Development Server**
   Perintah ini akan menjalankan frontend (Vite) dan backend (Express) secara bersamaan:
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3000`

   *Catatan: Database SQLite (`hybrid.db`) akan terbuat otomatis di folder `api/data`.*

## Deploy ke Vercel

Aplikasi ini telah dikonfigurasi untuk langsung di-_deploy_ ke Vercel tanpa perlu setup tambahan selain konfigurasi environment:

1. **Import Project di Vercel**
   - Hubungkan repositori GitHub Anda ke Vercel.
   - Vercel akan mendeteksi project Vite. Biarkan pengaturan `Build Command` (`npm run build`) dan `Output Directory` (`dist`) apa adanya.

2. **Environment Variables**
   Tambahkan *environment variables* berikut di dashboard Vercel (Project > Settings > Environment Variables):
   - `JWT_SECRET`: (Wajib) Masukkan string acak yang kuat untuk enkripsi token JWT.
   - `VITE_API_URL`: Kosongkan saja atau isi dengan url vercel Anda, sistem otomatis menggunakan relative path `/api` berkat *rewrite* di `vercel.json`.

3. **Catatan Penting: Database SQLite di Serverless (Vercel)**
   - Vercel menggunakan lingkungan *serverless* di mana *filesystem* bersifat *read-only*.
   - **Limitasi**: Sistem telah diprogram untuk otomatis meletakkan file SQLite di `/tmp/hybrid.db` ketika mendeteksi *environment* Vercel (`process.env.VERCEL`).
   - Karena sifat direktori `/tmp` yang **ephemeral (sementara)**, seluruh data (termasuk user, booking, dll) **akan hilang (ter-reset)** setiap kali fungsi *serverless* mengalami *cold start* (tidur lalu bangun lagi). 
   - Ini sangat cocok untuk keperluan **Demo** (karena setiap sesi mendapat database yang segar).

## Dokumentasi Pengujian

Untuk memastikan seluruh skenario fitur berjalan baik, Anda dapat merujuk ke tabel pengujian Black-Box di [docs/PENGUJIAN.md](./docs/PENGUJIAN.md).

## Kredit & Sumber Data

- [MangaDex API](https://api.mangadex.org) - Sumber utama data komik dan chapter.
- [Jikan API (MyAnimeList)](https://jikan.moe) - Sumber metadata tambahan.
