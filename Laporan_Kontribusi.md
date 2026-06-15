# Laporan Kontribusi Anggota Kelompok
## Project: Hybrid Manga Library
**Tanggal Laporan:** 15 Juni 2026  
**Repository:** d:/Pemrog  
**Tech Stack:** React 19, Vite, Tailwind CSS, Express.js, React Router

---

## Ringkasan Kontribusi

| Anggota | GitHub | Email | Commit | Peran |
|---------|--------|-------|--------|-------|
| zanworld | zanworld | famzzmakruf@gmail.com | 9 | Lead Developer |
| Orangjawahitamberbulu | Orangjawahitamberbulu | falihbayang@gmail.com | 1 | Kontributor |
| Cute Cat | pawscat | icremmm@gmail.com | 1 | Kontributor |
| cyannfinch17 | cyannfinch17 | diaskurniawan395@gmail.com | 1 | Kontributor |

---

## Detail Kontribusi Per Anggota

### 1. zanworld (famzzmakruf@gmail.com)
**Total Commit: 9 | Lines Added: ~8.300+ | Files Created: 70+**

#### 03 Juni 2026 — Initial Commit
Membangun seluruh struktur project dari nol. Meliputi:
- **Frontend (React + Vite)**
  - `src/App.jsx` — komponen utama, state management (filter, favorites, pagination), integrasi API
  - `src/Router.jsx` — routing aplikasi (77 baris)
  - `src/components/Header.jsx` — navigasi dan search bar (189 baris)
  - `src/components/Sidebar.jsx` — filter panel (227 baris)
  - `src/components/HeroCarousel.jsx` — carousel hero dengan animasi (380 baris)
  - `src/components/FilterForm.jsx` — form filter genre/status/sort (187 baris)
  - `src/components/MangaCard.jsx` — card item manga (92 baris)
  - `src/components/MangaDetailModal.jsx` — modal detail manga (182 baris)
  - `src/components/MangaGrid.jsx` — grid layout manga (54 baris)
  - `src/components/GenrePage.jsx` — halaman per genre (178 baris)
  - `src/components/PublisherPage.jsx` — halaman per publisher (186 baris)
  - `src/components/Footer.jsx` — footer aplikasi (180 baris)
  - `src/mockMangaData.js` — data dummy manga (370 baris)
  - `src/pages/` — 30+ halaman individual (genre, publisher, bookmarks, catalog, dll.)
- **Backend (Express.js)**
  - `api/index.js` — server Express (47 baris)
- **Konfigurasi**
  - `package.json`, `vite.config.js`, `tailwind.config.js`, `eslint.config.js`
  - `vercel.json`, `public/_redirects` — konfigurasi deployment
  - `generatePages.cjs`, `setupRouter.cjs` — script utility
  - `.gitignore`, `index.html`

#### 03 Juni 2026 — Fix GitHub Pages Deployment
- Menambahkan GitHub Actions workflow (`.github/workflows/deploy.yml`)
- Setup CI/CD otomatis ke GitHub Pages

#### 08 Juni 2026 — Fix: Relative Path Vite Config
- Perbaikan `vite.config.js`: mengubah base path menjadi relative untuk kompatibilitas GitHub Pages

#### 08 Juni 2026 — Perf: Optimasi Animasi Sitemap Modal
- Optimasi animasi modal sitemap menggunakan Framer Motion untuk menghilangkan lag

#### 09 Juni 2026 — Merge Pull Request #1, #3, #4
- Review dan merge kontribusi dari 3 anggota tim

#### 15 Juni 2026 — Refactor: Migrasi dari Jikan API ke Local Express Backend
- Membuat `api/routes/mangaRoutes.js` — route handler lengkap untuk manga data (97 baris)
- Refactor `src/App.jsx` — menghapus fallback data lokal dan logika Jikan API
- Refactor `src/components/GenrePage.jsx` — fetch dari local API
- Refactor `src/components/PublisherPage.jsx` — fetch dari local API
- Refactor `src/components/Header.jsx` — update API endpoint
- Refactor `src/components/HeroCarousel.jsx` — update API endpoint
- Menghapus dependency Jikan API eksternal, semua data diproses lewat backend sendiri

---

### 2. Orangjawahitamberbulu (falihbayang@gmail.com)
**Total Commit: 1 | Pull Request: #1**

#### 09 Juni 2026 — Update README.md (PR #1)
- Menambahkan tanda titik (`.`) pada baris terakhir `README.md`

---

### 3. Cute Cat / pawscat (icremmm@gmail.com)
**Total Commit: 1 | Pull Request: #3**

#### 09 Juni 2026 — Update README.md (PR #3)
- Menghapus tanda titik (`.`) dari baris terakhir `README.md`

---

### 4. cyannfinch17 (diaskurniawan395@gmail.com)
**Total Commit: 1 | Pull Request: #4**

#### 09 Juni 2026 — Update README.md (PR #4)
- Kontribusi pada `README.md`

---

## Statistik Keseluruhan

```
Total Commit     : 12 commit
Total File       : 70+ file
Total Lines Code : 8.300+ baris (initial) + ~121 baris (refactor backend)
Periode Kerja    : 03 Juni — 15 Juni 2026 (12 hari)
```

## Fitur Aplikasi yang Dibangun

- Browsing & pencarian manga
- Filter berdasarkan genre, status, dan sorting
- Halaman detail per manga (modal)
- Halaman per genre (Action, Adventure, Comedy, Drama, Fantasy, Romance, dll.)
- Halaman per publisher (Dark Horse, Yen Press, dll.)
- Sistem favorit (disimpan di LocalStorage)
- Hero carousel animasi
- Responsive design (Tailwind CSS)
- Deployment otomatis ke GitHub Pages via GitHub Actions
- Backend Express.js lokal sebagai proxy API manga

---

*Laporan dibuat otomatis berdasarkan git history repository.*
