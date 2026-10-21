# Pojok Baca Kelas (tampilan Solid State)

Perpustakaan digital: koleksi Google Drive (PDF, DOCX, dan lainnya) + jutaan buku terbuka gratis.
Tampilan memakai template **Solid State** dari HTML5 UP (CC BY 3.0), jadi atribusi di footer wajib dipertahankan.

## Struktur
- `index.html`: halaman (struktur template, bagian koleksi, pembaca)
- `assets/css/main.css`: CSS asli template (dipakai apa adanya)
- `assets/css/app.css`: gaya komponen aplikasi (kartu, filter, pembaca) dalam bahasa desain template
- `assets/js/main.js` dan pustaka: perilaku template (header, menu geser, animasi pembuka)
- `assets/js/app.js`: logika aplikasi dan konfigurasi `CFG` di bagian atas
- `Code.gs`: backend Apps Script (opsional)
- `build_single.py`: menggabungkan semuanya menjadi satu file
- `index.single.html`: hasil gabungan, siap ditempel ke Google Sites Embed

## Mengubah tampilan
Warna dan sudut diatur template. Ubah warna aksen di `assets/css/app.css` (`--accent`) dan gambar latar di `images/bg.jpg`.
Teks halaman ada di `index.html`. Ganti `images/pic01.jpg` sampai `pic08.jpg` dengan fotomu sendiri.

## Menghubungkan Google Drive
Edit `CFG` di bagian atas `assets/js/app.js`. Pilih satu:
- **Cara A (Apps Script):** pasang `Code.gs` (isi `FOLDER_ID`), deploy sebagai Web App (Akses: Siapa saja), isi `CFG.API` dengan URL `/exec`.
- **Cara B (langsung):** isi `CFG.FOLDER_ID` dan `CFG.API_KEY` (Google Drive API, batasi ke domainmu).

Folder harus dibagikan "Siapa saja yang memiliki link". Subfolder menjadi kategori (awalan "Karya" = tipe Karya). Deskripsi file: `Penulis | Sinopsis`.
Setelah mengubah file di `assets/`, jalankan `python3 build_single.py` untuk memperbarui `index.single.html`.

## Perpustakaan Terbuka
Tab ini mencari di Project Gutenberg, Internet Archive, dan Open Library (hanya buku domain publik atau akses terbuka). Tanpa kunci atau backend, tapi hanya berjalan di hosting sendiri.

## Deploy
- **Hosting biasa** (disarankan): unggah seluruh folder (kecuali `Code.gs` dan `build_single.py`) ke Netlify, Cloudflare Pages, GitHub Pages, atau Vercel.
- **Google Sites:** Sisipkan > Embed > Embed code > tempel isi `index.single.html`, lebar penuh, tinggi sekitar 1000 px. Gunakan Cara A untuk koneksi Drive.

## Pembaca
Panah kiri/kanan pindah buku, `i` info, `Esc` tutup. Setiap buku punya tautan sendiri (`#/baca/ID`).
