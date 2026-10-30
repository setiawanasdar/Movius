# Movius — Web Streaming Film & Serial TV Subtitle Indonesia

Aplikasi web modern, cinematic, dan responsif untuk streaming katalog serial TV, drama korea (drakor), anime, dan film dengan subtitle Bahasa Indonesia. Dibangun menggunakan sumber data utama dari [movieapi-sage.vercel.app](https://movieapi-sage.vercel.app/).

---

## ✨ Fitur Utama

- 🎬 **Beranda Sinematik (Cinematic Hero Banner)**:
  - Hero carousel otomatis dengan backdrop dinamis, badge rating IMDb, tahun, genre, status (Ongoing/Tamat), dan tombol *Nonton Sekarang* & *Watchlist*.
  - Baris katalog dinamis: *Top & Populer*, *Maraton Drakor*, *Rilis Terbaru*, *Serial Ongoing*, dan *Serial Komplit*.
  - Sesi *Lanjutkan Menonton* otomatis muncul jika terdapat riwayat tontonan aktif.
  - Jelajah cepat berdasarkan genre.
- 🔍 **Pencarian Cepat & Responsif (Debounced Search)**:
  - Pencarian dengan debounce 350ms, loading spinner, riwayat kata kunci terakhir, dan dropdown rekomendasi instan.
- 📑 **Katalog & Filter Lanjutan (Browse Page)**:
  - Tab kategori: Top Populer, Rilis Terbaru, Drakor, Ongoing, Tamat, Asia, Western.
  - Filter interaktif berdasarkan **Genre**, **Negara**, dan **Tahun Perilisan**.
  - Navigasi paginasi bersih dan responsif.
- 📺 **Detail Serial Komprehensif (Detail Page)**:
  - Backdrop sinematik dengan gradient overlay, poster rasio 2:3, rating, sinopsis lengkap, sutradara, dan daftar pemeran.
  - Pemilih musim (*Season Selector*) dan daftar kartu episode (*Episode Cards*).
  - Indikator status tontonan pada tiap episode.
  - Rekomendasi tayangan serupa di bagian bawah.
- 🎥 **Pemutar Video Fokus Pengalaman Menonton (Video Player)**:
  - Dukungan multi-server embed (*P2P*, *CAST*, *HYDRAX*) dengan fallback otomatis.
  - Indikator resmi Subtitle Bahasa Indonesia.
  - Navigasi Episode Sebelumnya & Berikutnya.
  - Opsi *Auto-Play Next Episode*.
  - *Theater Mode* & Layar Penuh (*Fullscreen*).
  - Fitur **Resume Playback**: Pengingat otomatis *"Lanjutkan tontonan dari menit mm:ss?"*.
  - Pelacak progres tontonan otomatis yang tersimpan ke penyimpanan lokal.
  - Panel daftar episode samping untuk perpindahan episode 1-klik tanpa kembali ke beranda.
- 📌 **Watchlist & Riwayat Tontonan (Persistent Storage)**:
  - Simpan dan hapus judul favorit ke Watchlist dengan notifikasi toast.
  - Filter Watchlist: Semua, Ongoing, Tamat.
  - Riwayat tontonan dengan persentase durasi tonton dan opsi hapus riwayat.
- 📱 **Desain Responsif & Mobile-First**:
  - Dark theme premium yang nyaman untuk mata.
  - *Bottom Navigation Bar* khusus perangkat layar sentuh dan mobile.
  - *Loading Skeleton* halus untuk transisi data asynchronous.
  - Penanganan error state dengan tombol *"Coba Lagi"* (Retry) dan halaman 404 yang elegan.

---

## 🏗️ Struktur Arsitektur

Sesuai dengan standar arsitektur modular:

```text
src/
├── api/                  # API client, konfigurasi base URL, caching & verified fallback
│   ├── client.ts
│   ├── fallbackData.ts
│   └── movieApi.ts
├── components/           # Reusable UI components
│   ├── common/           # Navbar, Footer, MovieCard, MovieRow, HeroBanner, SearchBar, Toast, dll.
│   ├── history/          # ContinueWatchingRow
│   ├── player/           # VideoPlayer multi-server
│   └── series/           # EpisodeCard, SeasonSelector
├── hooks/                # Custom React hooks (useDebounce, useDocumentTitle, dll.)
├── layouts/              # RootLayout (Navbar + Outlet + MobileBottomNav + Toast + Footer)
├── pages/                # Halaman aplikasi (Home, Browse, Search, Detail, Watch, Watchlist, History, 404)
├── services/             # Storage service abstraction (localStorage / future DB)
├── stores/               # State management hooks (Watchlist, History, Toast)
├── styles/               # Global styling, Tailwind v4 theme tokens
├── types/                # Type-safe TypeScript interfaces
└── utils/                # Helper functions (formatters, class merging)
```

---

## 🚀 Cara Menjalankan

### 1. Masuk ke direktori proyek
```bash
cd Movius
```

### 2. Install dependensi
```bash
npm install
```

### 3. Jalankan server pengujian lokal (Development)
```bash
npm run dev
```
Buka browser di `http://localhost:3000` (atau port yang ditampilkan).

### 4. Build untuk Production
```bash
npm run build
```

### 5. Jalankan Unit Test
```bash
npx tsx test_suite.js
```

---

## 🔌 Konfigurasi API

Aplikasi secara default menggunakan endpoint API:
```env
VITE_API_BASE_URL=https://movieapi-sage.vercel.app
```
Jika ingin menggunakan proxy server lokal (misalnya saat pengujian scraper di `localhost:5000`), cukup buat file `.env` di folder `Movius`:
```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## 🛡️ Lisensi & Hak Cipta
MIT License © 2026 Movius Team
