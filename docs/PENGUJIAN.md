# Pengujian Black-Box "Hybrid Library"

Dokumen ini berisi skenario pengujian black-box untuk aplikasi "Hybrid Library". Pengujian harus dilakukan setelah deployment ke Vercel untuk memastikan semua fitur berjalan dengan baik di lingkungan produksi.

| No | Skenario | Langkah Pengujian | Hasil yang Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|-----------------------|--------------|--------|
| 1 | **Katalog** | Buka halaman beranda (`/`). | Menampilkan daftar komik (MangaDex) terbaru dengan gambar cover dan judul yang benar. | | [ ] Belum Diuji |
| 2 | **Pencarian** | Ketikkan kata kunci (misal: "Naruto") di kolom pencarian lalu tekan Enter. | Menampilkan hasil pencarian komik yang relevan dengan kata kunci. | | [ ] Belum Diuji |
| 3 | **Filter/Sort** | Gunakan dropdown filter status/demografis atau pengurutan. | Daftar komik diperbarui sesuai dengan kriteria filter atau urutan yang dipilih. | | [ ] Belum Diuji |
| 4 | **Detail** | Klik salah satu komik di halaman beranda atau hasil pencarian. | Menampilkan halaman detail komik (sinopsis, genre, author) beserta daftar chapter. | | [ ] Belum Diuji |
| 5 | **Baca (Sukses)** | Buka halaman detail komik, klik salah satu chapter. | Menampilkan halaman baca (reader) dan memuat gambar-gambar chapter secara berurutan. | | [ ] Belum Diuji |
| 6 | **Baca (Fallback)** | Simulasikan error MangaDex atau buka chapter yang tidak memiliki gambar. | Sistem harus menangkap error dan menampilkan halaman fallback/pesan error yang informatif. | | [ ] Belum Diuji |
| 7 | **Register/Login** | Buka halaman `/login` dan `/register`, buat akun baru dan login. | Registrasi berhasil dan pengguna diarahkan masuk dengan status terautentikasi (Token JWT tersimpan). | | [ ] Belum Diuji |
| 8 | **Booking Akun 1**| Login sebagai Pengguna A, lakukan *booking* komik di halaman detail. | Booking berhasil, status komik menjadi "Booked" untuk Pengguna A. | | [ ] Belum Diuji |
| 9 | **Booking Akun 2**| Logout, login sebagai Pengguna B. Coba lakukan *booking* komik yang sama. | Sistem menolak *booking* atau menampilkan status bahwa komik tersebut sudah tidak tersedia (sedang dibooking). | | [ ] Belum Diuji |
| 10| **Proteksi Rute** | Dalam status logout, coba akses `/profile` atau `/api/profile/stats`. | Sistem mengalihkan ke halaman `/login` atau mengembalikan respon Unauthorized (401). | | [ ] Belum Diuji |
| 11| **Halaman 404**   | Akses URL yang tidak terdaftar (misal: `/halaman-ngasal`). | Menampilkan halaman kustom 404 Not Found. | | [ ] Belum Diuji |
| 12| **Responsivitas (Mobile)** | Buka aplikasi di layar sempit (lebar < 768px). | Layout menyesuaikan (Sidebar menjadi menu hamburger/bawah, grid mengecil). | | [ ] Belum Diuji |
| 13| **Responsivitas (Tablet)** | Buka aplikasi di layar medium (lebar ~768px - 1024px). | Layout menyesuaikan proporsional, grid item bertambah. | | [ ] Belum Diuji |

## Catatan Bug
Jika ditemukan ketidaksesuaian antara "Hasil yang Diharapkan" dan "Hasil Aktual", catat di bawah ini untuk dikoordinasikan dengan anggota tim terkait:

1. [Belum ada bug tercatat]
