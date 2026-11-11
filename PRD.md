# Product Requirements Document (PRD): Web App Game "7-an" (Tujuhan Tactical) — Versi 1.0 (MVP)

## 1. Ringkasan & Visi Produk

Aplikasi web berbasis Progressive Web App (PWA) untuk permainan kartu tradisional Indonesia "7-an" (Tujuh Sekop). Aplikasi ini dibangun dengan prinsip *zero-cost infrastructure* (100% gratis tanpa verifikasi kartu kredit/debit dan tanpa unsur perjudian/taruhan), mengusung arsitektur *Single Source of Truth* (SSOT) menggunakan TinyGo WebAssembly (Wasm) agar seluruh logika kartu dan bot dieksekusi secara terpadu di *client* maupun *server*.

Antarmuka visual mengusung gaya **Neo-Brutalism ("Tujuhan Tactical")** yang berani, taktis, dan kontras tinggi: palet dasar krem terang (`#F5F0EA` / `#FAF8FF`), garis tepi hitam tegas (`2.5px–3px solid #000000`), bayangan balok tanpa blur (*hard-edge box-shadow* `3.5px 3.5px 0px #000000`), serta warna aksen elektrik (Canary Yellow `#FFE600`, Mint Green `#00D084` / `#10B981`, dan Coral Red `#FF4343` / `#FF4D4D`).

---

## 2. Target & Tujuan Utama

* **Aksesibilitas PWA & Offline Penuh:** Aplikasi dapat dipasang ke layar beranda (*homescreen*) ponsel tanpa toko aplikasi, berukuran sangat ringan, dan dapat dimainkan penuh secara offline (Airplane Mode) melawan AI bot setelah kunjungan pertama.
* **Arsitektur Single Source of Truth (SSOT):** Logika kartu, validasi gerakan, penentuan status As, denda flat, dan AI bot hanya ditulis satu kali dalam paket Go murni (`pkg/engine`). Engine ini dikompilasi menggunakan TinyGo menjadi Wasm untuk *client*, serta di-import secara *native* oleh server backend Go.
* **Infrastruktur Zero-Cost Tanpa Kartu:** Memanfaatkan Cloudflare Pages (*bandwidth unlimited*, edge network Jakarta) dan Render Free Tier (container Go 512 MB RAM).
* **Multiplayer Kasual Tanpa Friksi:** Bermain bersama teman secara privat menggunakan sistem Room Code 6 karakter unik tanpa perlu registrasi akun, toleransi *reconnect* 30 detik, pengisian otomatis slot kosong oleh AI Bot (Hard), serta migrasi host otomatis.
* **Fitur Rematch Instan:** Pemain dapat langsung memulai ronde berikutnya (*Main Lagi*) di dalam meja yang sama tanpa mereset kode room, dengan sistem akumulasi skor kekalahan (`Kalah: Nx`).
* **Eliminasi Cold Start:** Mengatasi waktu bangun server Render (30–50 detik) menggunakan mekanisme *background silent wake-up* sejak pemain berada di lobi utama.

---

## 3. Spesifikasi Teknis (Tech Stack)

| Komponen | Teknologi | Peran & Alasan Pemilihan |
| :--- | :--- | :--- |
| **Core Game Engine** | Pure Go (`pkg/engine`) | Berisi aturan main, scoring, dan AI bot tanpa dependensi I/O. |
| **Wasm Compiler** | TinyGo | Menghasilkan binary `.wasm` berukuran ringkas (sub-megabyte) agar hemat memori dan cepat di-cache browser. |
| **Frontend Framework** | React + Vite | Performa rendering cepat, modular, dan ekosistem modern. |
| **PWA Engine** | `@vite-pwa/plugin` (Workbox) | Menangani Service Worker dan strategi *cache-first* untuk aset statis dan file `game.wasm`. |
| **State & Styling** | Zustand & Tailwind CSS | Pengelolaan state reaktif ringan dan styling Neo-Brutalism responsif (Mobile-First PWA). |
| **Tipografi** | Space Grotesk & Plus Jakarta Sans | `Space Grotesk` untuk headline, angka skor, dan label taktis; `Plus Jakarta Sans` untuk teks bodi dan aturan. |
| **Backend Framework** | Go + Melody (WebSocket) | Menangani *authoritative room state* berbasis WebSocket secara monolitik dan efisien di memori RAM. |
| **Data Storage** | Murni In-Memory (Go RAM) | Menggunakan `map[string]*Room` dengan proteksi `sync.RWMutex`. Tanpa database SQL dan tanpa Redis pada MVP. |
| **Hosting Frontend** | Cloudflare Pages | Gratis permanen, *bandwidth unlimited*, tanpa verifikasi kartu kredit/debit, terintegrasi Git. |
| **Hosting Backend** | Render (Free Web Service) | Menjalankan Docker container backend Go (512 MB RAM, 0.1 vCPU). |
| **Aset Visual** | Vector SVG / Inline Glyphs | Aset kartu remi berukuran sangat kecil, tajam di semua resolusi layar, dan hemat bandwidth. |

---

## 4. Logika & Aturan Permainan (Game Engine)

* **Kondisi Awal & Pembagian Kartu:**
  * Menggunakan 52 kartu standar tanpa Joker, dibagikan rata ke 4 pemain (masing-masing 13 kartu).
  * **Auto-Reshuffle:** Jika sistem mendeteksi ada pemain menerima $\ge$ 3 kartu angka 7, pembagian diacak ulang secara otomatis di latar belakang sebelum kartu ditampilkan ke pemain.
  * Kartu 7 pembuka (diacak antara 7 Hati, 7 Wajik, 7 Sekop, atau 7 Keriting) otomatis diturunkan ke tengah meja oleh sistem saat ronde dimulai.

* **Validasi Gerakan (Action State):**
  * Pemain hanya dapat memainkan kartu yang melanjutkan urutan angka pada lambang yang sudah ada di meja ($N+1$ atau $N-1$), atau membuka lambang baru dengan kartu 7 lainnya.
  * **Anti-Bohong:** Jika pemain memiliki minimal satu kartu valid di tangan (`validMoves > 0`), tombol **TUTUP** otomatis dinonaktifkan (*disabled*). Pemain wajib menurunkan kartu valid ke meja.
  * **Anti-Sabotase Kartu 7:** Kartu 7 haram ditutup dalam kondisi apa pun dan wajib dimainkan ke meja jika gilirannya tiba.

* **State Machine Kartu As:**
  * Dimulai dengan status awal `aceMode = LOCKED_NONE` (Header: *Status As: Belum Terbuka*).
  * As pertama turun di bawah angka 2 $\rightarrow$ `aceMode = LOW`. Semua kartu As resmi terkunci bernilai **1 poin**. Seluruh kartu As lain dilarang dipasang di atas King.
  * As pertama turun di atas King $\rightarrow$ `aceMode = HIGH`. Semua kartu As resmi terkunci bernilai **15 poin**. Seluruh kartu As lain dilarang dipasang di bawah 2.
  * Hingga akhir ronde tidak ada satu pun As yang turun ke meja $\rightarrow$ semua kartu As yang tertutup bernilai **0 poin**.

* **Perhitungan Penalti Akhir (Poin Terendah = Pemenang):**
  * Angka 2 sampai 10: Nilai nominal kartu (2 s.d. 10 poin).
  * Kartu Gambar: J = 11 poin, Q = 12 poin, K = 13 poin.
  * Kartu As: Sesuai status As (0 poin jika belum terbuka, 1 poin jika Low, 15 poin jika High).
  * **Denda Kartu Kunci (6 & 8):** Kartu 6 dan 8 yang tertutup / gagal turun dikenakan denda pasti **flat 30 poin per kartu** (bukan nominal + 30).
  * **Pemenang & Urutan Peringkat:** Pemenang (Juara 1) adalah pemain dengan total akumulasi poin penalti kartu tertutup **terendah**. Pemain dengan total poin penalti tertinggi dinyatakan Kalah (**Juru Kunci** / Posisi ke-4).

* **Pencatatan Rekor Kalah Kumulatif (`Kalah: Nx`):**
  * Selama pemain berada di room yang sama melintasi beberapa ronde (*Rematch*), server mencatat jumlah kekalahan kumulatif masing-masing pemain.
  * Pemain yang finis pada peringkat ke-4 (poin penalti tertinggi) pada setiap ronde mendapatkan tambahan `+1` pada indikator `Kalah: Nx`.

* **Aturan Kondisi RT & RW (Rekor Komunitas Room):**
  * **Kondisi RT (KEPALA RT):** Pemain finis pada peringkat ke-4 (Juru Kunci / penalti tertinggi) sebanyak 3 kali berturut-turut (`consecutiveLosses == 3`) di dalam room yang sama.
  * **Kondisi RW (KEPALA RW):** Pemain finis pada peringkat ke-4 (Juru Kunci) sebanyak 6 kali berturut-turut (`consecutiveLosses >= 6`, yaitu 2 streak RT berturut-turut tanpa terputus). Status pemain seketika di-upgrade dari RT menjadi RW.
  * **Eksklusivitas Gelar (Single Active Holder):** Di dalam satu room hanya boleh ada maksimal 1 pemegang gelar RT atau RW dalam satu waktu. Ketika ada pemain lain yang mencapai RT (`consecutiveLosses == 3`), gelar pemegang sebelumnya langsung dicabut dan di-reset kembali ke status netral (`NONE`).
  * **Reset Streak:** Finis di peringkat 1, 2, atau 3 (bukan Juru Kunci) langsung mereset nilai `consecutiveLosses` pemain tersebut menjadi `0`. Pemegang gelar RT/RW yang finis di peringkat 1–3 tetap mempertahankan gelarnya sampai ada pemain lain yang berhasil mencapai `consecutiveLosses == 3`.

---

## 5. Kebutuhan Fungsional (Functional Requirements)

### F1. Mode Offline (PWA & TinyGo Wasm Engine)

* **Service Worker Caching:** Mengunduh seluruh HTML, JS, CSS, aset kartu, dan binary `game.wasm` pada kunjungan pertama.
* **Tingkat Kesulitan Bot (AI):**
  * **Easy (Kasual/Acak):** Memilih langkah acak dari kartu valid. Saat terpaksa menutup kartu, memilih kartu secara acak.
  * **Medium (Pemain Aman):** Memprioritaskan menurunkan kartu bernilai besar. Menghindari menutup kartu 6 dan 8. Saat menutup kartu, memilih kartu nominal terkecil (angka 2 atau 3).
  * **Hard (Taktikal/Agresif):** Menahan kartu 6 atau 8 secara agresif untuk mengunci langkah lawan (*blocking*). Mengarahkan alur As secara matematis sesuai komposisi kartu tangan. Menghitung probabilitas penalti saat terpaksa *fold*.

### F2. Mode Online Multiplayer & Room Management

* **Sistem Room Code 6 Karakter:** Pembuatan room instan menghasilkan 6 karakter alfanumerik kapital unik (contoh: `7X9K2A`). Tidak ada lobi publik maupun sistem taruhan.
* **Kesiapan Pemain (Ready State):**
  * Pemain yang baru bergabung ke dalam room tidak otomatis siap, melainkan harus menekan tombol **"Siap" (Ready)** terlebih dahulu.
  * Status pemain berubah menjadi badge hijau `Siap` setelah tombol ditekan.
* **Fleksibilitas Jumlah Pemain:**
  * Host dapat memulai permainan jika minimal ada **2 pemain manusia yang telah berstatus "Siap"**.
  * Seluruh slot kursi kosong yang tersisa (kursi 3 dan/atau 4) otomatis diisi oleh **Bot (Hard)**.
* **Penguncian Tingkat Kesulitan Bot Online:**
  * Pada mode online, tingkat kesulitan AI pengisi slot kosong **dikunci mutlak ke mode Hard**.
  * Tombol kontrol bot pada ruang tunggu online hanya berfungsi sebagai **indikator status terkunci** (menampilkan toast konfirmasi bahwa bot online dikunci ke mode Hard untuk menjaga keadilan kompetisi).
* **Host Migration:** Jika Host terputus permanen atau keluar, kepemilikan room dialihkan secara otomatis ke pemain manusia aktif berikutnya.
* **Sistem Disconnect & Reconnect (30 Detik):**
  * `sessionToken` unik disimpan pada `sessionStorage` browser.
  * Masa toleransi reconnect adalah **30 detik**. Jika pemain kembali dalam kurun waktu tersebut, state kartu dan meja langsung disinkronkan.
  * Jika melewati 30 detik, kursi pemain diambil alih secara permanen oleh Bot Hard hingga ronde berakhir.

### F3. Mitigasi Cold Start ("Silent Wake-Up") & Indikator Koneksi

* **Pre-fetch Non-blocking di Lobi:**
  * Saat lobi dibuka, frontend otomatis mengirim request `fetch('/healthz')` asinkron ke backend Render di latar belakang.
* **Status Indikator Jaringan Neo-Brutalist:**
  * Menampilkan badge koneksi di lobi: titik hijau menyala menandakan server siap, titik kuning berkedip menandakan server sedang dibangunkan.
* **Modal Cold Start Server:**
  * Jika pemain menekan Buat/Gabung Room saat server masih proses bangun, sistem menampilkan modal Neo-Brutalist: *"Sedang menyiapkan server gratisan (~20 detik)..."* dengan animasi loading bar bersegmen dan *auto-retry* WebSocket setiap 3 detik.

### F4. Ritual Kocok Kartu (Shuffle Ritual) & Waiting Lounge Interaktif

* **Ritual Kocok Kartu Manual Juru Kunci (9 Titik Interaktif):**
  * Pemain yang menempati peringkat ke-4 (Juru Kunci / penalti tertinggi) wajib melakukan ritual mengocok kartu manual melalui touchpad interaktif 9 titik berpola "TACTICAL-Z" (`[0, 2, 6, 8]`) sebanyak 3 putaran.
  * Deteksi pola dilengkapi feedback visual garis lintasan SVG. Jika pemain melakukan kesalahan gestur sebanyak 3 kali berturut-turut, sistem otomatis mengaktifkan *auto-reshuffle* untuk kelancaran jalannya permainan.
* **Ruang Tunggu Interaktif (Waiting Lounge untuk 3 Pemain Lainnya):**
  * Tiga pemain yang tidak kalah berada di ruang tunggu santai yang memvisualisasikan animasi dan progres kocokan kartu Juru Kunci secara real-time.
  * Menyediakan tombol interaksi sosial ringan tanpa fitur chat teks: tombol reaksi `☕ Sruput` dan tombol pemicu semangat `👋 SEMANGATIN!`.
  * Menyediakan tombol akses modal `📜 LOG RONDE` untuk meninjau riwayat kartu pembuka, status As, dan rincian penalti ronde sebelumnya.

### F5. Papan Skor Transparan & Rematch Cepat (Rekor Komunitas RT/RW)

* **Rincian Kartu Transparan 4 Pemain:**
  * Menampilkan 4 kartu ringkas terurut 1–4 dengan rincian kartu terbuka/tertutup, denda flat 30 poin kartu kunci 6/8, penalti nominal, dan status kalah kumulatif (`Kalah: Nx`).
* **Kotak Status Eksklusif RT/RW (`STATUS RT / RW #XXXXXX`):**
  * Menampilkan pemegang tunggal aktif penobatan KEPALA RT atau KEPALA RW di meja tersebut beserta telemetry rekor kekalahan beruntun.
* **Rematch Instan via Ritual:**
  * Tombol `Main Lagi` (Rematch) langsung mengarahkan meja menuju Layar 5 (Ritual Kocok Kartu) tanpa mereset kode room dan mempertahankan rekor kekalahan beruntun komunitas.

---

## 6. Spesifikasi Antarmuka & Layar (UI/UX Neo-Brutalism)

### Layar 1: Lobi Utama

* **Header & Identitas:** Bar header hijau mint (`#00D084`, border hitam 3px) dengan logo kartu 4-lambang angka 7, judul `MENU`, dan tombol toggle audio di sisi kanan (`audioEnabled` / suara aktif).
* **Hero Banner:** Banner hijau mint (`#00D084`, border 3px, shadow 4px) dengan judul besar `7-an`, kapsul teks putih `Tentukan tujuanmu!`, serta ilustrasi kartu 7 miring artistik di kanan.
* **Form Profil Guest:**
  * Kolom input *Nickname* dibatasi maksimal **7 karakter** alfanumerik.
  * **Tombol Dadu (Randomizer):** Tombol di samping input nama untuk mengacak nama guest secara instan dari preset lokal (contoh: `Sekop07`, `Wajik99`, `Ksatria`, `Taktik7`).
  * **Tanpa Avatar Chooser:** Avatar profil digenerate otomatis dari 2 karakter inisial nama pemain (misal: `Sekop07` $\rightarrow$ `S7`).
* **Pilihan Mode Permainan:**
  * **Mode Offline (Versus AI):** Selector segmented 3 opsi (*Easy*, *Medium*, *Hard*) dan tombol mulai offline.
  * **Mode Online (MABAR):** Tombol `Buat Room Baru` dan formulir input `Kode Room 6 Karakter` dengan tombol `Gabung`.
* **Bottom Nav & Modal Panduan Aturan:**
  * Navigasi bawah bertombol `MENU` (menggantikan 'Lobi') dan `Aturan`.
  * Modal aturan memuat panduan ringkas 7-an yang seragam: aturan buka 7, urutan sambungan, aturan tutup kartu, denda flat 30 poin kartu 6/8, penentuan juara berdasarkan **poin penalti terendah**, dan status rekor RT/RW.

### Layar 2: Ruang Tunggu (Waiting Room / Ruang Tunggu MABAR)

* **Header:** Bar hijau mint (`#10B981`, border 3px) dengan tombol kembali, judul `RUANG TUNGGU`, dan tombol toggle audio di sisi kanan.
* **Banner Kode Room:** Banner kuning mencolok (`#FFD000` / `#FFE600`) dengan kotak putih bersarang (*nested white box*) bergaris tepi hitam tebal berisi label `ROOM ID`, kode meja `#{roomCode}`, dan tombol `SALIN` instan (disertai feedback toast).
* **Bar Telemetri 2-Kolom:**
  * Kolom Kiri: Kartu putih menampilkan indikator kesiapan `X/Y PEMAIN SIAP`.
  * Kolom Kanan: Kartu gelap (`#283044` teks putih) mengunci status bot `🔒 BOT: HARD`.
* **Daftar 4 Slot Kursi:**
  * Slot 1: Host manusia (Badge kuning `HOST`, status `Siap`).
  * Slot 2: Tamu manusia (Badge inisial, status `Siap` vs `Menunggu`).
  * Slot 3 & 4: Slot bot bernama taktis (`Cermat8`, `Taktik7`, `Agresif9`) dengan badge hitam `BOT` dan badge gelap `⚡ AUTO SIAP`.
* **Kontrol Aksi Bawah:**
  * Tombol utama `Mulai Permainan`: Hanya aktif jika minimal 2 pemain manusia telah siap.
  * Baris sekunder: Tombol kiri putih `ATURAN` dan tombol kanan merah coral `BUBARKAN MEJA` / `KELUAR`.

### Layar 3: Meja Permainan Taktis (Gameplay)

* **Header Meja:**
  * Bar putih bersih dengan tombol *Side Drawer* menu burger, judul `RONDE {roundNumber}`, dan indikator status As (`Belum Terbuka`, `As Rendah (1)`, `As Tinggi (15)`).
* **Area Pemain (3 Lawan & PlayerBadge):**
  * Menampilkan avatar inisial, nama pemain, status giliran aktif (*pinging border*), rekor kekalahan kumulatif (`Kalah: Nx`), tag gelap `BOT` untuk bot AI, serta badge eksklusif `RT` / `RW` berwarna merah marun tua (`#8B0000`, border hitam 1.5px, shadow 1px) bagi pemegang status aktif di room.
  * **Privasi Taktis:** Untuk mempertahankan ketegangan dan strategi membaca kartu, sisa jumlah kartu maupun isi kartu tutup milik lawan **tidak ditampilkan** di meja.
* **Kolom Kartu Meja (Central Board):**
  * Terdiri dari 4 kolom vertikal representatif (`♠ Sekop`, `♥ Hati`, `♣ Keriting`, `♦ Wajik`).
  * Setiap kolom kartu menumpuk secara vertikal dengan overlap (`-space-y-6` sm:`-space-y-7`, z-index bertingkat 10, 20, 30) menampilkan 3 slot kartu persegi-potret kompak (`h-[76px] sm:h-20`, sudut membulat `rounded-xl`, garis tepi `2.5px solid #000000`, bayangan `3px 3px 0px #000000`):
    1. **Kartu Ujung Atas (z-10):** Nilai tertinggi yang telah turun di atas 7 (misal: 8, 9, dst. background putih `#FFFFFF`).
    2. **Kartu 7 Tengah (z-20):** Kartu jangkar pembuka lambang (background kuning `#FFE600`).
    3. **Kartu Ujung Bawah (z-30):** Nilai terendah yang telah turun di bawah 7 (misal: 6, 5, dst. background putih `#FFFFFF`).
  * **Slot Placeholder Lambang:** Lambang yang belum dibuka menampilkan slot placeholder berukuran identik dengan latar gelap semi-transparan (`bg-black/20`, `border-2 border-white/15`) dan ikon lambang di tengah.
* **Dock Interaksi Pemain Bawah (PlayerInteractionDock - 3-Tier Vertical Stack):**
  * **Tingkat 1 (Atas - Tombol Aksi):** Dua tombol berdampingan selebar layar (`grid grid-cols-2 gap-2`):
    * Tombol **`TUTUP`** (merah coral `#FF5A5F` / `#FF4343`). Terkunci jika kartu yang dipilih atau kartu tangan lainnya masih sah dimainkan (Anti-Bohong).
    * Tombol **`MAINKAN`** (hijau mint `#00D084`). Aktif jika kartu terpilih sah dimainkan ke meja.
  * **Tingkat 2 (Tengah - Rak Kartu Tangan):** Kontainer hijau tua pekat (`#1B4332`, border 2px hitam, shadow 2px) dengan header `KARTU TANGAN ({hand.length})` dan grid 2-baris tanpa scroll:
    * Baris 1 (`grid-cols-7 gap-1`): Kartu tangan 1–7 berformat mini-card vertikal (`h-12 sm:h-14`, indeks kiri atas, simbol kanan bawah, ikon `🔑` kanan atas untuk kartu 6 & 8).
    * Baris 2 (`grid-cols-6 gap-1 px-3 mt-1`): Kartu tangan 8–13.
    * Dukungan aksi: Ketuk untuk memilih (highlight kuning `#FFE600`) atau ketuk dua kali (*double-tap*) untuk langsung memainkan/menutup kartu.
  * **Tingkat 3 (Bawah - Strip Kartu Tutup):** Strip horizontal ramping (`#1B4332`, border 2px hitam) dengan label `KARTU TUTUP`, badge akumulasi `Total: -{penalty} Poin`, serta deretan kartu tertutup mini yang dapat digulir horizontal.
* **Modal Konfirmasi Kartu Kunci (6 & 8):**
  * Jika pemain hendak menutup kartu 6 atau 8, muncul modal peringatan risiko tinggi bergaya Neo-Brutalism yang menegaskan denda flat `+30 Poin Denda`, dengan pilihan `Tetap Tutup (+30 Poin)` atau `Batal (Pilih Kartu Lain)`.
* **Side Drawer Menu:**
  * Menampilkan informasi nama pemain, status online, indikator latensi real-time (**`Ping: XX ms`**), tombol `Aturan Ringkas`, tombol **`PENGATURAN`** (membuka `SettingsModal` audio & preferensi kontrol), kotak info Room ID (`#{roomCode}`) dan durasi match (*Elapsed Timer* `MM:SS`), serta tombol `Keluar dari Permainan`. Opsi 'Papan Skor Sementara' ditiadakan.

### Layar 4: Papan Skor Akhir (Scoreboard)

* **Header & Subheader:** Bar hijau mint (`#10B981`, border 3px) dengan judul `PAPAN SKOR` dan Room ID pill `#{roomCode}`. Subheader menampilkan badge kiri `RONDE {roundNumber}` dan badge kanan `🔒 STATUS AS: {aceModeLabel}`.
* **Bagian 1: 'RINCIAN KARTU PEMAIN' (Leaderboard 1–4):**
  * 4 kartu pemain kompak terurut berdasarkan peringkat poin penalti terendah (1) hingga tertinggi (4):
    * Peringkat 1: Pemenang utama (Badge `1ST` pada avatar, pill hijau `PEMENANG`, total penalti terendah).
    * Peringkat 2 & 3: Runner-up (Pill `#2`, `#3`, rincian kartu sisa).
    * Peringkat 4: Juru Kunci (Pill merah `JURU KUNCI`, penalti tertinggi).
  * Setiap kartu menampilkan nama, tag `ANDA` / `BOT`, total poin penalti, strip kartu tutup/terbuka (`Tutup: 4♦ 10♥` atau `✨ PERFECT CLEAR`), akumulasi `Kalah: Nx`, serta badge animasi `RT!` / `RW!` bila pemain memegang gelar.
* **Bagian 2: Kartu Eksklusif 'STATUS RT / RW #{roomCode}':**
  * Kartu Neo-Brutalist tebal (`border-[3px] border-black shadow-[4px_4px_0px_#000000]`) di bagian bawah layar:
    * Jika terdapat pemegang aktif: Menampilkan avatar, nama, tag pemain/bot, badge berdenyut `KEPALA RT` (merah marun `#8B0000`) atau `KEPALA RW` (emas/merah), dan deskripsi pencapaian rekor ('Kalah 3x berturut-turut di room yang sama' atau 'Mencapai 2x status RT beruntun (6x Kalah Beruntun)').
    * Jika belum ada pemegang: Menampilkan kartu status netral 'BELUM ADA KEPALA RT / RW' ('Belum ada pemain yang kalah 3x berturut-turut di meja ini.').
* **Kontrol Aksi Footer:**
  * Tombol utama kuning Canary `#FFE600`: `MAIN LAGI (REMATCH)` (mengarahkan ke Layar 5: Ritual Kocok Kartu).
  * Tombol sekunder putih: `KEMBALI KE MENU` (kembali ke lobi utama).

### Layar 5: Ritual Kocok Kartu (9 Titik Interaktif) & Waiting Lounge

* **Menggantikan Countdown Modal 3 Detik:** Memberikan pengalaman interaktif berbobot taktis bagi pemain kalah dan ruang santai interaktif bagi pemain lainnya.
* **Cabang A (Untuk Pemain Juru Kunci - Layar Kocok Kartu Manual):**
  * Header hijau mint (`#10B981`) bertuliskan `RITUAL KOCOK KARTU` dengan telemetry room dan nomor ronde berikutnya.
  * Frame instruksi `KOCOK KARTU MANUAL` dengan indikator putaran `PUTARAN {step} / 3` dan bar progres 3-segmen.
  * Pita informasi tengah: Komponen `TARGET POLA: TACTICAL-Z` (diagram 3x3 SVG pola `[0, 2, 6, 8]`) dan `STATUS TUMPUKAN` animasi kartu acak (`33%` $\rightarrow$ `66%` $\rightarrow$ `100%`).
  * **Touchpad Gestur 9 Titik:** Area kanvas interaktif 3x3 dot dengan pelacak pointer/mouse/touch dan garis lintasan SVG:
    * Pemain wajib menghubungkan titik pola Z (`0 -> 2 -> 6 -> 8`) sebanyak 3 putaran berturut-turut untuk menyelesaikan pengocokan kartu.
    * Setiap kesalahan menggambar pola menambah `failCount`. Jika salah 3 kali berturut-turut (`failCount >= 3`), sistem menyalakan peringatan `AUTO-RESHUFFLE AKTIF!` dan otomatis melanjutkan ke ronde berikutnya setelah 800ms demi mencegah *soft-lock*.
    * Dilengkapi tombol `RESET` manual jika garis salah di tengah jalan.
* **Cabang B (Untuk 3 Pemain Lainnya - Layar Waiting Lounge "Santai Kawan"):**
  * Banner kuning mencolok bertuliskan `RITUAL WAJIB KALAH` dan pesan bersahabat: *"Santai kawan, {loserName} sedang mengocok kartu"*.
  * Menampilkan profil Juru Kunci ronde lalu beserta total penaltinya dan panggung animasi 3 kartu kocok (*"Idih, idiiiiih....."*).
  * Bar progres 3-segmen `RITUAL GESTUR 9 TITIK` yang melacak tahapan kocokan Juru Kunci secara langsung (`Pola 1/3` $\rightarrow$ `Pola 2/3` $\rightarrow$ `Pola 3/3`, atau simulasi bot ~4.5 detik jika Juru Kunci adalah AI).
  * Daftar kondisi 3 pemain di meja dengan tombol reaksi instan `☕ Sruput`.
  * Tombol aksi bawah: Tombol `👋 SEMANGATIN!` (menyalakan efek dorongan semangat ke meja selama 1.5 detik) dan tombol `📜 LOG RONDE` (membuka modal detail rekap ronde sebelumnya).
* **Modal Log & Rekap Ronde (`📜 LOG RONDE`):**
  * Modal popup Neo-Brutalist yang menampilkan kartu 7 pembuka ronde lalu, status As akhir, rincian kartu tangan tertutup, denda flat kartu 6/8, dan total penalti setiap pemain.

---

## 7. Arsitektur & Optimasi Backend Go (Render Free Tier)

* **Tuning Buffer WebSocket:** Mengatur `ReadBufferSize` dan `WriteBufferSize` Melody ke **1024 byte** (memangkas konsumsi RAM per koneksi aktif hingga 50%).
* **In-Memory Room Garbage Collection (Room Reaper):** Goroutine *ticker* periodik yang berjalan setiap 60 detik untuk menghapus data room dari RAM jika seluruh pemain telah keluar atau tidak ada aktivitas selama lebih dari 5 menit.
* **Pengendalian Runtime Memory Go (`GOMEMLIMIT`):** Mengatur env container `GOMEMLIMIT=420MiB` dan `GOGC=80` agar Garbage Collector Go bekerja lebih agresif sebelum menyentuh batas keras 512 MB di Render, mencegah *OOM kill*.
* **Heartbeat Ping/Pong:** Interval 30 detik untuk memutus *dead socket* dari browser yang ditutup mendadak.

---

## 8. Batasan Ruang Lingkup (Non-Goals v1.0 / MVP)

Hal-hal yang secara eksplisit **tidak** disertakan dalam versi 1.0 demi menjaga fokus, kecepatan pengembangan, dan kebersihan arsitektur:

* **Fitur Chat Teks:** Tidak menyediakan kolom obrolan teks di dalam room guna menghindari moderasi konten dan beban data WebSocket.
* **Sistem Akun / Login Permanen:** Pemain murni bermain menggunakan *nickname* sementara (Guest) tanpa password atau database.
* **Sistem Saldo / Tiket Koin / Unsur Perjudian:** Seluruh mode online dan offline pada v1.0 dimainkan secara **100% gratis** tanpa koin virtual, tanpa taruhan chip, dan tanpa transaksi uang riil.
* **Lobi Meja Publik:** Permainan multiplayer hanya dapat diakses melalui Room Code privat 6 digit yang dibagikan antar-teman.

---

## 9. Rencana Monetisasi Pasca-MVP (Roadmap v2.0)

Setelah versi MVP v1.0 stabil dan memiliki basis pemain aktif, sistem monetisasi berbasis kredit arcade (tiket masuk server) dapat dipertimbangkan:

* **Mekanisme Pay-to-Play Non-Perjudian:**
  * Koin murni berfungsi sebagai biaya tiket masuk server online (contoh: 100 koin per sesi), bukan taruhan antar-pemain. Mode offline vs AI bot tetap gratis selamanya.
* **Kebutuhan Teknis v2.0:**
  * Autentikasi akun via Google OAuth (Firebase / Supabase Auth).
  * Database transaksional PostgreSQL untuk mutasi saldo.
  * Payment gateway QRIS lokal (Midtrans / Xendit).

---

## 10. Alur Pengguna Terpadu (User Flow)

```text
[ Buka Web App (Cloudflare Pages) ]
       │
       ▼
[ Lobi Utama (Neo-Brutalism) ]
  ├── Background: Silent Wake-Up Render Backend (/healthz)
  ├── Input Nickname (Maks. 7 Karakter / Tombol Dadu Acak)
  │
  ├── [ Pilih Mode Offline ] ─────────────────────────┐
  │     ├── Pilih Kesulitan (Easy / Medium / Hard)    │
  │     └── Langsung Masuk ke Meja Permainan          │
  │                                                   │
  └── [ Pilih Mode Online ]                           │
        ├── Host: "Buat Room Baru" (Dapat Kode 6 Karakter)
        └── Tamu: "Gabung Meja" (Ketik Kode 6 Karakter)
              │
              ▼
        [ Ruang Tunggu (Waiting Room) ]
          ├── Bagikan / Salin Kode Meja
          ├── Tamu Menekan Tombol "Siap"
          ├── Kursi Kosong Terkunci ke Bot Hard
          └── Host Menekan "Mulai" (Min. 2 Manusia Siap)
              │
              ▼
        [ Meja Permainan Taktis (Gameplay) ] ◄────────┘
          ├── Kartu 7 Pembuka Turun Otomatis
          ├── Indikator Giliran Aktif per Pemain
          ├── 4 Kolom Representatif (Tertinggi, 7, Terendah)
          ├── Rekor Akumulasi 'Kalah: Nx' pada Avatar Lawan
          ├── Dock: Pilih Kartu -> TUTUP / MAINKAN
          ├── Modal Peringatan Khusus Kartu Kunci 6 & 8 (+30 Poin)
          └── Toleransi Reconnect 30 Detik (Penggantian Bot Hard)
              │
              ▼
        [ Papan Skor Akhir (Leaderboard) ]
          ├── Juara 1: Poin Penalti Terendah (PEMENANG)
          ├── Posisi 4: Poin Penalti Tertinggi (JURU KUNCI / Kalah +1)
          ├── Rincian Denda Flat 30 Poin (Kartu 6/8) & Kartu As
          ├── Kartu Status Eksklusif Pemegang RT / RW (#XXXXXX)
          │
          ├── [ Tombol: Main Lagi (Rematch) ]
          │     │
          │     ▼
          │   [ Layar 5: Ritual Kocok Kartu / Waiting Lounge ]
          │     ├── Juru Kunci: Ritual 9-Titik Pola TACTICAL-Z (3 Putaran / Auto-Reshuffle)
          │     └── 3 Pemain Lain: Waiting Lounge (☕ Sruput, 👋 SEMANGATIN!, 📜 LOG RONDE)
          │     │
          │     ▼
          │   [ Meja Permainan Taktis (Gameplay) Ronde Baru ]
          │
          └── [ Tombol: Kembali ke Lobi ] ────── (Reset Sesi -> Kembali ke Lobi Utama)
```
