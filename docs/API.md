# Hybrid Library — Internal API Documentation

> **Base URL (dev):** `http://localhost:3000`  
> **Proxy:** Vite dev server proxies `/api/*` → `http://localhost:3000`  
> **Auth:** Mock JWT token (no signature verification). Pass token as `Authorization: Bearer <token>` (optional — currently not enforced).

---

## Table of Contents

1. [GET /api/health](#get-apihealth)
2. [POST /api/login](#post-apilogin)
3. [GET /api/manga](#get-apimanga)
4. [GET /api/manga/tag](#get-apimangatag)
5. [GET /api/manga/:id](#get-apimangaid)
6. [/api/auth](#apiauth)
7. [/api/bookings](#apibookings)
8. [/api/reviews](#apireviews)
9. [/api/progress](#apiprogress)
10. [/api/favorites](#apifavorites)
11. [/api/bookmarks](#apibookmarks)

---

## GET /api/health

Health check endpoint.

**Response** `200 OK`
```json
{
  "status": "ok",
  "message": "Backend is running perfectly!",
  "timestamp": "2026-06-29T16:00:00.000Z"
}
```

---

## POST /api/login

Autentikasi pengguna dengan email dan password.

**Request Body**
```json
{
  "email": "user@hybrid.com",
  "password": "user123"
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "email": "user@hybrid.com",
    "name": "User Reguler"
  },
  "token": "mock-jwt-token-12345"
}
```

**Response** `401 Unauthorized`
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**Test Accounts**

| Email | Password | Name |
|---|---|---|
| `dosen@kampus.ac.id` | `password123` | Dosen Pembimbing |
| `user@hybrid.com` | `user123` | User Reguler |

---

## GET /api/manga

Ambil daftar manga. Mendukung dua mode:

### Mode Gallery (MangaDex — real data)

Digunakan saat param `offset` hadir. Data di-proxy langsung dari `api.mangadex.org`.

**Query Parameters**

| Parameter | Type | Default | Deskripsi |
|---|---|---|---|
| `offset` | integer | — | **Wajib untuk mode ini.** Posisi mulai hasil (0-based) |
| `limit` | integer | `16` | Jumlah item per batch (max 32) |
| `title` | string | — | Filter berdasarkan judul (partial match) |
| `sortBy` | string | `popularity` | Urutan: `popularity`, `relevance`, `title`, `newest` |
| `includedTags[]` | UUID string | — | Filter berdasarkan tag/genre UUID MangaDex |

**Sort Mapping ke MangaDex**

| `sortBy` | MangaDex param |
|---|---|
| `popularity` | `order[followedCount]=desc` |
| `relevance` | `order[relevance]=desc` |
| `title` | `order[title]=asc` |
| `newest` | `order[updatedAt]=desc` |

**Response** `200 OK` (format MangaDex)
```json
{
  "result": "ok",
  "response": "collection",
  "data": [
    {
      "id": "uuid-string",
      "type": "manga",
      "attributes": {
        "title": { "en": "Manga Title" },
        "description": { "en": "Synopsis..." },
        "status": "ongoing",
        "year": 2020,
        "tags": [...]
      },
      "relationships": [
        {
          "type": "cover_art",
          "attributes": { "fileName": "cover.jpg" }
        }
      ]
    }
  ],
  "limit": 16,
  "offset": 0,
  "total": 8234
}
```

**Cover URL Formula:**
```
https://uploads.mangadex.org/covers/{manga.id}/{fileName}.512.jpg
```

---

### Mode Catalog (Mock Data — legacy)

Digunakan saat param `page` / `q` hadir (tanpa `offset`). Data dari `mockMangaData.js`.

**Query Parameters**

| Parameter | Type | Default | Deskripsi |
|---|---|---|---|
| `q` | string | — | Full-text search judul |
| `genres` | string | — | Comma-separated `mal_id` genre (integer) |
| `status` | string | `all` | `publishing`, `complete`, `upcoming` |
| `order_by` | string | `popularity` | `popularity`, `score`, `rank`, `title` |
| `sort` | string | `asc` | `asc` atau `desc` |
| `page` | integer | `1` | Halaman (1-based) |
| `limit` | integer | `12` | Item per halaman |

**Response** `200 OK`
```json
{
  "data": [...],
  "pagination": {
    "current_page": 1,
    "last_visible_page": 10,
    "has_next_page": true,
    "items": { "count": 12, "total": 120, "per_page": 12 }
  }
}
```

---

## GET /api/manga/tag

Ambil semua tag/genre dari MangaDex (digunakan untuk mengisi dropdown filter Gallery).

**Response** `200 OK` (format MangaDex tag list)
```json
{
  "result": "ok",
  "data": [
    {
      "id": "uuid",
      "type": "tag",
      "attributes": {
        "name": { "en": "Action" },
        "group": "genre"
      }
    }
  ]
}
```

---

## GET /api/manga/:id

Ambil detail satu manga berdasarkan ID.

- **UUID** (dari Gallery) → proxy ke MangaDex, response dinormalisasi ke format Jikan-like
- **Integer** (dari Catalog) → cari di mock data

**Response** `200 OK`
```json
{
  "data": {
    "mal_id": "uuid-or-integer",
    "title": "Manga Title",
    "title_english": "English Title",
    "title_japanese": "日本語タイトル",
    "images": {
      "jpg": {
        "image_url": "https://...",
        "large_image_url": "https://..."
      }
    },
    "synopsis": "Description...",
    "status": "Publishing",
    "chapters": 120,
    "volumes": 12,
    "published": { "string": "2020" },
    "genres": [{ "mal_id": "uuid", "name": "Action" }],
    "authors": [{ "name": "Author Name" }],
    "type": "Manga",
    "score": null,
    "rank": null,
    "popularity": null
  }
}
```

**Response** `404 Not Found`
```json
{ "message": "Manga not found" }
```

---

## /api/auth

> 📌 **Status:** Belum diimplementasikan sebagai route terpisah. Autentikasi saat ini menggunakan `POST /api/login` langsung di `api/index.js`.

**Rencana endpoint:**
- `POST /api/auth/register` — registrasi pengguna baru
- `POST /api/auth/logout` — invalidasi token
- `GET /api/auth/me` — info pengguna saat ini

---

## /api/bookings

> 📌 **Status:** Belum diimplementasikan sebagai API. Data booking saat ini disimpan di **localStorage** (`booking_history`).

**Rencana endpoint:**
- `GET /api/bookings` — daftar booking pengguna
- `POST /api/bookings` — buat booking baru (`{ date, slot, seat }`)
- `DELETE /api/bookings/:id` — batalkan booking

**Format data localStorage (`booking_history`):**
```json
[
  {
    "date": "2026-07-01",
    "slot": "Pagi",
    "seat": 5,
    "bookedAt": "2026-06-29T10:00:00.000Z"
  }
]
```

---

## /api/reviews

> 📌 **Status:** Belum diimplementasikan sebagai API. Data ulasan disimpan di **localStorage** (`hybrid_library_reviews`).

**Rencana endpoint:**
- `GET /api/reviews/:mangaId` — ambil ulasan untuk manga tertentu
- `POST /api/reviews/:mangaId` — kirim ulasan baru (`{ rating, comment, author }`)
- `DELETE /api/reviews/:mangaId/:reviewId` — hapus ulasan

---

## /api/progress

> 📌 **Status:** Belum diimplementasikan sebagai API. Progress baca disimpan di **localStorage** (`hybrid_library_progress`).

**Rencana endpoint:**
- `GET /api/progress/:mangaId` — progress baca pengguna
- `PUT /api/progress/:mangaId` — update progress (`{ chapter, page }`)

---

## /api/favorites

> 📌 **Status:** Belum diimplementasikan sebagai API. Favorit disimpan di **localStorage** (`hybrid_library_favorites` untuk Catalog, `gallery_favorites` untuk Gallery).

**Rencana endpoint:**
- `GET /api/favorites` — daftar favorit pengguna
- `POST /api/favorites` — tambah favorit (`{ mangaId }`)
- `DELETE /api/favorites/:mangaId` — hapus dari favorit

---

## /api/bookmarks

> 📌 **Status:** Belum diimplementasikan sebagai API. Bookmark disimpan di **localStorage** (`hybrid_library_bookmarks`).

**Rencana endpoint:**
- `GET /api/bookmarks` — daftar bookmark pengguna
- `POST /api/bookmarks` — tambah bookmark (`{ mangaId, mangaData }`)
- `DELETE /api/bookmarks/:mangaId` — hapus bookmark

---

## Error Responses

Semua endpoint mengembalikan format error konsisten:

```json
{
  "error": "Pesan error singkat",
  "message": "Detail error (opsional)"
}
```

| Status Code | Deskripsi |
|---|---|
| `400` | Bad Request — parameter tidak valid |
| `401` | Unauthorized — kredensial salah |
| `404` | Not Found — resource tidak ditemukan |
| `500` | Internal Server Error — error backend atau MangaDex tidak dapat dijangkau |

---

## Rate Limiting

MangaDex membatasi **~5 request/detik**. Backend proxy tidak menambahkan rate limiting tambahan. Jika mendapat `429 Too Many Requests`, tunggu sebentar dan coba lagi.

---

*Dokumentasi terakhir diperbarui: 2026-06-29*
