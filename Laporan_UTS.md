### Jawaban Soal No. 2: Penjelasan Source Code Berdasarkan Pembagian Tugas

Aplikasi katalog manga/novel ini dibangun menggunakan React.js dan Vite. Untuk mempermudah pengembangan, kode dibagi menjadi beberapa modul dan komponen. Berikut adalah penjelasan *source code* sesuai dengan pembagian tugas masing-masing anggota:

#### **[Tulis Nama Anggota 1] - Bagian 1: Konfigurasi Utama & Routing (App.jsx & Router.jsx)**
Pada bagian ini, *source code* berfokus pada kerangka utama aplikasi dan sistem navigasi perpindahan halaman (*routing*).
*   **`App.jsx`**: Bertindak sebagai kerangka utama (*root component*). File ini mengatur tata letak (layout) global yang selalu muncul di setiap halaman, seperti komponen `Header` di bagian atas, `Sidebar` di samping, dan `Footer` di bagian bawah.
*   **`Router.jsx`**: Menggunakan pustaka `react-router-dom` untuk mendefinisikan seluruh rute URL di dalam aplikasi. Kode ini memetakan URL tertentu ke halaman yang sesuai (contoh: URL `/genre/action` diarahkan ke komponen `ActionGenrePage`). Dengan *routing* ini, aplikasi berjalan sebagai *Single Page Application* (SPA) di mana perpindahan halaman tidak memerlukan *reload* browser secara keseluruhan.

#### **[Tulis Nama Anggota 2] - Bagian 2: Pengelolaan Data Mockup & Komponen Dasar (mockMangaData.js, MangaCard.jsx, MangaGrid.jsx)**
Bagian ini bertanggung jawab atas penyediaan data sementara (*mock data*) dan cara data tersebut dirender ke layar secara visual.
*   **`mockMangaData.js`**: Berisi *array of objects* yang mensimulasikan data dari *database* (seperti judul manga, genre, sinopsis, gambar *cover*, dan *rating*). Data ini diekspor agar bisa digunakan oleh komponen lain.
*   **`MangaCard.jsx`**: Komponen modular (dapat digunakan berulang) yang bertugas menampilkan satu item manga. Komponen ini menerima data (via *props*) dan merendernya menjadi kartu visual lengkap dengan gambar dan judul.
*   **`MangaGrid.jsx`**: Komponen *wrapper* yang mengatur susunan `MangaCard` menggunakan sistem Grid dari CSS (Tailwind). Komponen ini memastikan kartu-kartu manga tampil rapi dan responsif, baik di layar HP maupun laptop.

#### **[Tulis Nama Anggota 3] - Bagian 3: Interaksi UI Lanjutan (HeroCarousel.jsx & MangaDetailModal.jsx)**
Bagian ini fokus pada komponen interaktif yang meningkatkan *User Experience* (UX) pada halaman utama dan saat melihat detail manga.
*   **`HeroCarousel.jsx`**: Kode untuk membuat *slider* (korsel) gambar di bagian atas halaman (*Hero Section*). Komponen ini menggunakan state (via `useState` atau *library* animasi seperti Framer Motion) untuk mengatur perpindahan *slide* konten manga yang sedang tren atau direkomendasikan.
*   **`MangaDetailModal.jsx`**: Komponen *pop-up* (Modal) yang muncul ketika pengguna mengklik salah satu *MangaCard*. Source code-nya memanfaatkan *conditional rendering*, di mana modal ini hanya di-render ke DOM jika *state* `isOpen` bernilai `true`. Modal ini bertugas menampilkan informasi lengkap dari sebuah manga (seperti sinopsis penuh dan daftar *chapter*).

#### **[Tulis Nama Anggota 4] - Bagian 4: Navigasi Global & Fitur Pencarian (Header.jsx, Sidebar.jsx, FilterForm.jsx)**
Tugas ini berfokus pada elemen antarmuka yang memfasilitasi pencarian dan navigasi pengguna.
*   **`Header.jsx` & `Sidebar.jsx`**: Berisi elemen-elemen navigasi yang statis di seluruh halaman. Source code pada bagian ini mencakup *link-link* internal (menggunakan komponen `<Link>` dari React Router) yang mengarahkan pengguna ke halaman Kategori, Profil, atau Riwayat.
*   **`FilterForm.jsx`**: Komponen form yang menangani *input* pengguna untuk mencari atau menyaring (*filter*) daftar manga. Kode ini menangkap teks yang diketik pengguna (via *event handler* `onChange`) dan menyimpan nilainya di dalam state lokal, yang kemudian diteruskan ke komponen induk untuk memfilter data dari `mockMangaData.js`.

#### **[Tulis Nama Anggota 5] - Bagian 5: Halaman Spesifik & Autentikasi (Folder `pages/` & `LoginPage.jsx`)**
Bagian ini mencakup implementasi tampilan halaman secara utuh yang menggabungkan berbagai komponen kecil.
*   **File Halaman Kategori (cth: `MysteryGenrePage.jsx`, `ActionGenrePage.jsx`)**: Kode pada file-file ini bertugas mengambil data spesifik (misalnya, memfilter `mockMangaData.js` hanya untuk genre *Mystery*) lalu meneruskannya ke komponen `MangaGrid` untuk ditampilkan.
*   **`LoginPage.jsx`**: Halaman yang menangani form autentikasi (masuk/daftar). Source code di sini mengatur validasi form sederhana (seperti pengecekan *email* dan *password*) dan menggunakan fungsionalitas React (seperti pencegahan *refresh* halaman dengan `e.preventDefault()`) sebelum mengalihkan pengguna ke halaman *Dashboard* atau *Home*.
