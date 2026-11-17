---
name: Tujuhan Tactical
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3c4a42'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6c7a71'
  outline-variant: '#bbcabf'
  surface-tint: '#006c49'
  primary: '#006c49'
  on-primary: '#ffffff'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#4edea3'
  secondary: '#725c00'
  on-secondary: '#ffffff'
  secondary-container: '#fecf00'
  on-secondary-container: '#6f5900'
  tertiary: '#c0000a'
  on-tertiary: '#ffffff'
  tertiary-container: '#ff7b6b'
  on-tertiary-container: '#790004'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#ffe082'
  secondary-fixed-dim: '#eec200'
  on-secondary-fixed: '#231b00'
  on-secondary-fixed-variant: '#564500'
  tertiary-fixed: '#ffdad5'
  tertiary-fixed-dim: '#ffb4aa'
  on-tertiary-fixed: '#410001'
  on-tertiary-fixed-variant: '#930005'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-hero:
    fontFamily: Space Grotesk
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 60px
    letterSpacing: -0.04em
  display-hero-mobile:
    fontFamily: Space Grotesk
    fontSize: 38px
    fontWeight: '700'
    lineHeight: 42px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
    letterSpacing: 0em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.04em
  label-md:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.06em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

# Brand & Style Guide: Tujuhan Tactical (Neo-Brutalism)

Sistem desain ini mendefinisikan identitas visual Neo-Brutalist bertegangan tinggi khusus untuk adaptasi digital permainan kartu tradisional Indonesia **"7-an" (Tujuhan / Tujuh Sekop)**.

---

## 1. Personality & Tone

* **Tactical & Kinetic:** Tajam, bertensi tinggi, instan, dan responsif. Setiap giliran, keputusan menutup kartu, serta penalti kartu kunci mendarat dengan bobot taktis yang nyata.
* **Nostalgia Pos Ronda Elektrik:** Mentransformasikan kehangatan nongkrong main kartu di gardu pos ronda malam hari menjadi antarmuka cyber-retro bergaya arkade modern.
* **Unapologetic Rawness:** Sudut tegas tanpa gradien halus, garis tepi hitam pekat (*solid black outlines*), bayangan balok tanpa blur (*hard-edge offset shadows*), dan balok warna berpigmen tinggi yang menolak kompromi minimalisme hampa.
* **Target & Dampak Emosional:** Diciptakan untuk pemain kasual kompetitif, mahasiswa, dan komunitas pencinta kartu klasik di perangkat mobile (PWA) maupun desktop. Memberikan kepuasan visual haptic saat kartu valid diturunkan (*card slap*), serta kejelasan hierarki saat ronde berlangsung cepat.

---

## 2. Token Desain Komprehensif (Design Tokens)

### 2.1 Palet Warna (Color System)

| Token Name | Hex Code | Nilai RGB | Penggunaan Semantik |
| :--- | :--- | :--- | :--- |
| **`surface` / `background`** | `#FAF8FF` | `rgb(250, 248, 255)` | Kanvas latar belakang utama aplikasi & lobi |
| **`surface-container-lowest`** | `#FFFFFF` | `rgb(255, 255, 255)` | Muka kartu standar, kartu profil, input box, modal |
| **`surface-container-low`** | `#F2F3FF` | `rgb(242, 243, 255)` | Baris latar belakang alternatif, sel sekunder |
| **`surface-container`** | `#EAEDFF` | `rgb(234, 237, 255)` | Kontainer panel sekunder, status badge netral |
| **`surface-container-high`** | `#E1E7FF` | `rgb(225, 231, 255)` | Batas kontainer, divider tebal, badge netral |
| **`surface-container-highest`** | `#DAE2FD` | `rgb(218, 226, 253)` | Header sel sekunder, bar navigasi tidak aktif |
| **`inverse-surface`** | `#283044` | `rgb(40, 48, 68)` | Badge bot AI (`BOT`), kartu status kunci bot hard |
| **`inverse-on-surface`** | `#EEF0FF` | `rgb(238, 240, 255)` | Teks putih-kebiruan di atas latar gelap |
| **`primary`** | `#006C49` | `rgb(0, 108, 73)` | Aksen hijau dalam, outline primer, tint |
| **`primary-container`** | `#10B981` | `rgb(16, 185, 129)` | Hijau Mint: Tombol MAINKAN, banner lobi, badge SIAP |
| **`on-primary-container`** | `#00422B` | `rgb(0, 66, 43)` | Teks kontras tinggi di atas kontainer primer |
| **`secondary-container`** | `#FFD000` / `#FFE600` | `rgb(255, 208, 0)` | Kuning Canary: Kartu 7, banner Room ID, tombol REMATCH |
| **`tertiary-container`** | `#FF7B6B` / `#FF5A5F` | `rgb(255, 123, 107)` | Merah Coral: Tombol TUTUP / FOLD, indikator penalti |
| **`error`** | `#BA1A1A` / `#BE091D` | `rgb(186, 26, 26)` | Merah Bahaya: Tombol Keluar / Bubarkan Meja, denda 6/8 |
| **`felt-green`** | `#0C693A` | `rgb(12, 105, 58)` | Permukaan felt meja hijau pada Central Board |
| **`dock-tray`** | `#EDEBE6` | `rgb(237, 235, 230)` | Baki abu-abu hangat luar pada PlayerInteractionDock |
| **`dock-rack`** | `#1B4332` | `rgb(27, 67, 50)` | Kontainer hijau tua pekat rak kartu tangan & kartu tutup |
| **`rt-rw-maroon`** | `#8B0000` | `rgb(139, 0, 0)` | Merah Marun RT/RW: Badge eksklusif KEPALA RT & KEPALA RW |
| **`suit-black`** | `#000000` | `rgb(0, 0, 0)` | Garis tepi (*outlines*), bayangan balok, lambang Sekop/Keriting |
| **`suit-red`** | `#FF4343` | `rgb(255, 67, 67)` | Lambang Hati (`♥`) dan Wajik (`♦`) pada kartu remi |

#### Aturan Penerapan Warna

1. **Dilarang Gradien Halus:** Seluruh blok warna harus solid (*flat color fill*).
2. **Batas Garis Mutlak:** Semua kontainer, kartu, tombol, dan modal dibingkai garis tepi hitam pekat `solid #000000` (ketebalan `2px` hingga `3px`).
3. **Pembeda Kartu Kunci (6 & 8):** Menggunakan ikon emoji kunci `🔑` berwarna emas/kuning di sudut kanan atas kartu tangan untuk menandai risiko denda flat 30 poin.

---

### 2.2 Skala Tipografi (Typography Scale)

| Token | Font Family | Weight | Size | Line Height | Tracking | Penggunaan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`display-hero`** | Space Grotesk | 700 (Bold) | 56px | 60px | -0.04em | Headline raksasa desktop / Splash |
| **`display-hero-mobile`** | Space Grotesk | 700 (Bold) | 38px | 42px | -0.03em | Judul banner "7-an" pada mobile |
| **`headline-lg`** | Space Grotesk | 700 (Bold) | 36px | 40px | -0.02em | Judul layar utama, skor kemenangan |
| **`headline-lg-mobile`** | Space Grotesk | 700 (Bold) | 28px | 32px | -0.02em | Header mobile, judul modal |
| **`headline-md`** | Space Grotesk | 700 (Bold) | 24px | 28px | -0.01em | Judul sub-seksi, nomor ronde |
| **`headline-sm`** | Space Grotesk | 600 (Semibold) | 20px | 24px | 0em | Nama pemain, label modal penting |
| **`body-lg`** | Plus Jakarta Sans | 500 (Medium) | 18px | 26px | 0em | Aturan permainan, pengantar instruksi |
| **`body-md`** | Plus Jakarta Sans | 500 (Medium) | 15px | 22px | 0em | Teks dialog, toast status, info room |
| **`body-sm`** | Plus Jakarta Sans | 400 (Regular) | 13px | 18px | 0.01em | Keterangan denda, subteks rekam jejak |
| **`label-lg`** | Space Grotesk | 700 (Bold) | 14px | 18px | 0.04em | Tombol aksi utama (MAINKAN, TUTUP) |
| **`label-md`** | Space Grotesk | 700 (Bold) | 12px | 16px | 0.05em | Indeks kartu remi, badge status |
| **`label-sm`** | Space Grotesk | 700 (Bold) | 10px | 12px | 0.06em | Indeks kartu sekunder, telemetry tag |

---

### 2.3 Sistem Ruang & Tata Letak (Spacing & Layout)

* **Gutter & Margin:**
  * Mobile (< 640px): Margin `1rem` (16px), Gutter `0.75rem` (12px).
  * Desktop ($\ge$ 640px): Margin `1.5rem` (24px), Gutter `1rem` (16px).
* **Skala Spacing:**
  * `space-xs`: `0.25rem` (4px) — Jarak antar mini-card, padding badge rapat.
  * `space-sm`: `0.5rem` (8px) — Jarak antar tombol aksi kecil, celah grid kartu.
  * `space-md`: `1rem` (16px) — Padding dalam kontainer kartu, jarak antar baris.
  * `space-lg`: `1.5rem` (24px) — Jarak antar seksi halaman, celah modal.
  * `space-xl`: `2rem` (32px) — Ruang batas atas/bawah layar gameplay.

---

### 2.4 Sistem Ketinggian & Bayangan Balok (Elevation & Depth)

Tidak menggunakan *ambient blur* atau bayangan difus. Kedalaman diukur murni lewat **Hard-Edge Offset Shadows** hitam solid:

* **Level 0 (Flat Felt / Canvas):** Offset `0px 0px 0px #000000`. Latar felt hijau dan kanvas kanvas lobi.
* **Level 1 (Surface Cards & Structural Containers):**
  * Border: `2px solid #000000`
  * Shadow: `3px 3px 0px #000000`
  * Komponen: Kotak PlayerBadge lawan, slot CentralBoard, baris skor.
* **Level 2 (Interactive Buttons, Playing Cards in Hand, Modals):**
  * Border: `3px solid #000000`
  * Shadow: `4px 4px 0px #000000`
  * Komponen: Tombol `MAINKAN`, `TUTUP`, `MAIN LAGI`, modal popup, kartu tangan.
* **Level 3 (Prompts Kritis & Banner Hero):**
  * Border: `3px solid #000000`
  * Shadow: `6px 6px 0px #000000`
  * Komponen: Hero banner lobi, banner Room ID kuning, modal kartu 6/8.
* **Active / Pressed State (Haptic Slapdown):**
  * Transformasi: `translate(2px, 2px)` (atau `translate(3px, 3px)` pada tombol Level 2).
  * Shadow terkompresi: `1px 1px 0px #000000`.
  * Menghasilkan sensasi fisik bantingan kartu di atas meja kayu.

---

### 2.5 Geometri & Bentuk (Shapes & Radii)

* `rounded-sm`: `0.125rem` (2px) — Tag telemetry kecil.
* `rounded-DEFAULT`: `0.25rem` (4px) — Badge status, tag BOT, chip kartu tutup.
* `rounded-md`: `0.375rem` (6px) — Kartu tangan mini vertikal (`h-12 sm:h-14`), input box.
* `rounded-lg`: `0.5rem` (8px) — Tombol aksi utama, kontainer sekunder.
* `rounded-xl`: `0.75rem` (12px) — Kartu meja CentralBoard (`w-full h-[76px] sm:h-20`), panel modal.
* `rounded-full`: `9999px` — Avatar inisial pemain, indikator lampu koneksi server.

---

## 3. Arsitektur State & Skema Data (Data Schema)

Menggunakan paradigma *Single Source of Truth* (SSOT) antara engine TinyGo Wasm, backend WebSocket Melody, dan klien React TypeScript:

```typescript
export type CommunityStatus = 'NONE' | 'RT' | 'RW';

export interface Card {
  suit: 'spades' | 'hearts' | 'clubs' | 'diamonds';
  rank: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
}

export interface Player {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  isBot: boolean;
  botLevel?: 'easy' | 'medium' | 'hard';
  isHost?: boolean;
  isReady: boolean;
  hand: Card[];
  foldedCards: Card[];
  penaltyPoints: number;
  lossesCount: number;
  consecutiveLosses: number; // Jumlah kekalahan peringkat 4 (Juru Kunci) berurutan
  statusRtRw: CommunityStatus; // Status komunitas aktif: 'NONE' | 'RT' | 'RW'
  isConnected: boolean;
}

export interface PlayerScoreDetail {
  playerId: string;
  playerName: string;
  rankPosition: 1 | 2 | 3 | 4;
  foldedCards: Array<{
    card: Card;
    points: number;
    isKeyCardPenalty: boolean;
    isAceLocked: boolean;
  }>;
  totalPenalty: number;
  lossesCount: number;
  consecutiveLosses: number;
  statusRtRw: CommunityStatus;
  isWinner: boolean;
  isJuruKunci: boolean;
}

export interface RoomState {
  id: string;
  mode: 'offline' | 'online';
  status: 'waiting' | 'playing' | 'finished';
  roundNumber: number;
  turnNumber: number;
  currentTurn: string;
  aceMode: 'LOCKED_NONE' | 'LOW' | 'HIGH';
  openerSuit: 'spades' | 'hearts' | 'clubs' | 'diamonds';
  board: {
    suits: Record<string, {
      minPlayed: number;
      maxPlayed: number;
      hasSeven: boolean;
      hasAce: boolean;
    }>;
  };
  players: Player[];
  scores?: Record<string, PlayerScoreDetail>;
  rtRwHolderId: string;        // ID pemain pemegang tunggal status RT/RW aktif
  rtRwStatus: CommunityStatus; // Status komunitas tunggal aktif: 'NONE' | 'RT' | 'RW'
}
```

### Aturan State Machine RT/RW

1. **KEPALA RT:** Pemain menempati peringkat ke-4 (Juru Kunci / penalti tertinggi) sebanyak 3 kali berturut-turut (`consecutiveLosses == 3`) di meja yang sama.
2. **KEPALA RW:** Pemain menempati peringkat ke-4 sebanyak 6 kali berturut-turut (`consecutiveLosses >= 6`, yaitu 2 streak RT berturut-turut). Status otomatis naik dari RT ke RW.
3. **Pemegang Tunggal (Single Active Holder):** Hanya boleh ada maksimal 1 pemegang gelar RT atau RW dalam satu waktu di satu room. Jika pemain lain mencapai `consecutiveLosses == 3`, gelar pemain sebelumnya langsung gugur dan di-reset ke `NONE`.
4. **Reset Streak:** Finis di posisi 1, 2, atau 3 mereset `consecutiveLosses` pemain tersebut ke `0`. Pemegang gelar tetap memegang lencana sampai ada pemain lain yang mencapai 3 kekalahan beruntun.

---

## 4. Hierarki Komponen & Spesifikasi 10 Layar (Screens Specification)

### 4.1 Layar 1: Lobi Utama (`LobbyScreen`)

* **Header Bar:** Latar hijau mint (`#00D084` / `#10B981`, border-b 3px hitam), ikon kartu 4-lambang, teks `MENU`, dan tombol saklar audio di kanan.
* **Hero Banner:** Kotak Neo-Brutalist hijau mint tebal (`border-[3px] border-black shadow-[4px_4px_0px_#000000]`), judul besar `7-an` (`Space Grotesk 700 38px`), kapsul putih `Tentukan tujuanmu!`, dan ilustrasi kartu 7 miring artistik di kanan.
* **Guest Profile Card:**
  * Kolom input nama dibatasi ketat maksimal **7 karakter** alfanumerik (regex `^[a-zA-Z0-9]{1,7}$`).
  * Tombol dadu randomizer di sebelah kanan input untuk generate nama instan.
  * Avatar 2 karakter inisial otomatis (`w-12 h-12 rounded-full border-2 border-black`).
* **Game Mode Selection:**
  * Tab Segmented: Mode Offline vs Mode Online (MABAR).
  * Mode Offline: Selector 3 tingkat AI (*Easy*, *Medium*, *Hard*) dan tombol mulai hijau mint.
  * Mode Online: Tombol kuning Canary `Buat Room Baru` dan input 6-karakter `Kode Room` dengan tombol `Gabung`.
* **Bottom Bar:** Tombol navigasi `MENU` dan `Aturan` (membuka `RulesModal`).

---

### 4.2 Layar 2: Ruang Tunggu MABAR (`WaitingRoomScreen`)

* **Header:** Bar hijau mint (`#10B981`, border-b 3px hitam) dengan tombol kembali dan judul `RUANG TUNGGU`.
* **Banner Kode Room:** Banner kuning Canary (`#FFE600` / `#FFD000`, border 3px, shadow 4px) dengan kotak putih bersarang berisi teks `ROOM ID: #{roomCode}` dan tombol `SALIN` instan.
* **Bar Telemetri (2 Kolom):**
  * Kolom Kiri: Kartu putih menampilkan indikator kesiapan `X/Y PEMAIN SIAP`.
  * Kolom Kanan: Kartu gelap (`#283044` teks putih) mengunci status bot `🔒 BOT: HARD`.
* **Grid 4 Kursi Pemain:**
  * Kartu profil masing-masing pemain dengan inisial avatar bulat, nama, status badge (`HOST`, `Siap`, `Menunggu`, atau `BOT`).
* **Kontrol Footer:**
  * Tombol primer hijau mint `Mulai Permainan` (hanya aktif jika minimal 2 pemain manusia berstatus `Siap`).
  * Baris sekunder: Tombol putih `ATURAN` dan tombol merah `BUBARKAN MEJA` / `KELUAR`.

---

### 4.3 Layar 3: Meja Permainan Taktis (`GameplayScreen`)

* **Header Meja:** Bar putih bersih (`#FFFFFF`, border-b 3px hitam) memuat tombol hamburger menu (*Side Drawer*), teks ronde `RONDE {roundNumber}`, dan badge status As (`Belum Terbuka`, `As Rendah (1)`, `As Tinggi (15)`).
* **PlayerBadge Area (3 Lawan):**
  * Menampilkan avatar bulat 40px, nama pemain, status giliran berdenyut (*pulse ring*), rekor kumulatif `Kalah: Nx`, badge gelap `BOT` untuk bot AI, serta lencana marun `RT` / `RW` (`#8B0000`, border hitam 1.5px, shadow 1px) bagi pemegang status aktif.
  * Privasi taktis: Jumlah sisa kartu lawan dan isi kartu tutup lawan dirahasiakan sepenuhnya.
* **CentralBoard (Meja Kartu 4 Kolom):**
  * Permukaan felt hijau gelap (`#0C693A`, border-2 border-black, shadow-inner) dengan 4 kolom lambang vertikal (`♠`, `♥`, `♣`, `♦`).
  * Setiap kolom kartu menumpuk 3 slot kartu potret kompak (`aspect-[1/1.3]`, `h-[76px] sm:h-20`, `rounded-xl`, border 2.5px hitam, shadow `3px 3px 0px #000000`):
    * Ujung Atas (z-10): Kartu tertinggi yang telah turun (background `#FFFFFF`).
    * Kartu 7 Tengah (z-20): Kartu pembuka lambang (background `#FFE600`).
    * Ujung Bawah (z-30): Kartu terendah yang telah turun (background `#FFFFFF`).
  * **Anatomi 3 Titik Kartu Meja:**
    * Sudut Kiri Atas: Indeks angka (`Space Grotesk`, `font-black`, 12px–14px).
    * Pusat Tengah: Simbol lambang besar (18px–20px) dalam warna lambang flat.
    * Sudut Kanan Bawah: Indeks angka sekunder tegak (*upright*, 10px–12px, 65% opacity).
  * **Placeholder Lambang Belum Terbuka (`SuitPlaceholder`):** Slot berukuran identik dengan latar transparan gelap (`bg-black/20`, border 2px putih 15%) dan simbol lambang redup di tengah (85% opacity).
* **PlayerInteractionDock (3-Tier Vertical Stack):**
  * Baki luar berwarna abu-abu hangat / dock tray (`#EDEBE6`, border-t 3px hitam).
  * **Tingkat 1 (Top Action Buttons):**
    * Tombol `TUTUP`: Latar merah coral (`#FF5A5F` / `#FF4343`, border 3px hitam, shadow 3px). Terkunci jika kartu yang dipilih atau kartu tangan lainnya masih sah dimainkan (Anti-Bohong).
    * Tombol `MAINKAN`: Latar hijau mint (`#00D084` / `#10B981`, border 3px hitam, shadow 3px). Aktif jika kartu terpilih sah dimainkan ke meja.
  * **Tingkat 2 (Middle Hand Rack - 'KARTU TANGAN'):** Kontainer hijau tua pekat (`#1B4332`, border 2px hitam, shadow 2px) dengan header `KARTU TANGAN ({hand.length})` dan grid 2-baris tanpa scroll:
    * Baris 1: `grid grid-cols-7 gap-1`, kartu 1–7.
    * Baris 2: `grid grid-cols-6 gap-1 px-3 mt-1`, kartu 8–13.
    * Format mini-card tangan: `h-12 sm:h-14`, sudut `rounded-md`, indeks kiri atas, lambang kanan bawah, dan ikon `🔑` di kanan atas untuk kartu 6 & 8. Highlight seleksi kuning Canary `#FFE600` dengan elevasi `-translate-y-2`.
  * **Tingkat 3 (Bottom Folded Strip - 'KARTU TUTUP'):** Kontainer hijau tua pekat (`#1B4332`, border 2px hitam) dengan label `KARTU TUTUP`, badge penalti langsung (`Total: -{penalty} Poin`), dan deretan kartu tertutup mini yang dapat digulir horizontal.
* **Side Drawer Menu:**
  * Menampilkan informasi nama pemain, status koneksi online, telemetri latensi real-time (**`Ping: XX ms`**), tombol `Aturan Ringkas`, tombol **`PENGATURAN`** (`SettingsModal`), kotak info Room ID (`#{roomCode}`) dan durasi permainan (*Elapsed Timer* `MM:SS`), serta tombol `Keluar dari Permainan`.

---

### 4.4 Layar 4: Papan Skor Akhir (`ScoreboardScreen`)

* **Header & Subheader:** Bar hijau mint (`#10B981`, border-b 3px hitam) dengan judul `PAPAN SKOR` dan pill `#{roomCode}`. Subheader menampilkan nomor ronde dan status As terkunci.
* **Leaderboard 1–4 ('RINCIAN KARTU PEMAIN'):**
  * Terurut dari peringkat 1 (penalti terendah) hingga peringkat 4 (Juru Kunci / penalti tertinggi).
  * Peringkat 1: Badge emas `1ST`, pill hijau `PEMENANG`, total penalti terendah.
  * Peringkat 4: Pill merah `JURU KUNCI`, penalti tertinggi, tambahan `Kalah: Nx` (+1).
  * Rincian kartu: Menampilkan strip kartu tutup (atau `✨ PERFECT CLEAR`), denda kartu 6/8 (+30 poin), dan badge animasi `RT!` / `RW!` bila memegang gelar.
* **Kartu Status Eksklusif RT/RW (`STATUS RT / RW #{roomCode}`):**
  * Terletak di bagian bawah layar: Box Neo-Brutalist tebal (`border-[3px] border-black shadow-[4px_4px_0px_#000000]`).
  * Jika ada pemegang aktif: Avatar besar 48px, nama, tag pemain/bot, badge menyala `KEPALA RT` (`#8B0000`) atau `KEPALA RW` (`#8B0000`/`#FFE600`), serta rincian rekor kekalahan berturut-turut.
  * Jika belum ada pemegang: Status netral 'BELUM ADA KEPALA RT / RW'.
* **Footer:** Tombol utama kuning Canary `MAIN LAGI (REMATCH)` (mengarahkan ke Layar 5 Ritual Kocok Kartu) dan tombol sekunder putih `KEMBALI KE MENU`.

---

### 4.5 Layar 5: Ritual Kocok Kartu Manual 9 Titik (`ShuffleRitualScreen` - Juru Kunci)

* **Header:** Hijau mint (`#10B981`, border 3px) dengan judul `RITUAL KOCOK KARTU`, info room, nomor ronde, dan badge timer hitung mundur 14 detik (`00:14`).
* **Instruksi & Progres:** Panel putih memuat indikator putaran `PUTARAN {step} / 3`, bar progres 3-segmen, dan diagram referensi `TARGET POLA: TACTICAL-Z` (SVG mini 3x3 menghubungkan titik `[0, 2, 6, 8]`).
* **Touchpad Interaktif 9 Titik:**
  * Kanvas interaktif 3x3 dot dengan pelacak sentuhan jari/kursor mouse dan garis lintasan SVG tebal.
  * Pemain wajib menyelesaikan gestur pola Z sebanyak 3 putaran.
  * **Anti-Stall & Fallback:** Jika gagal 3 kali berturut-turut atau waktu 14 detik habis, sistem menyalakan peringatan `AUTO-RESHUFFLE AKTIF!` dan melanjutkan otomatis ke ronde berikutnya setelah 800ms demi mencegah pemain lain tertahan.
  * Tombol manual `RESET` jika pemain salah menarik garis di tengah jalan.

---

### 4.6 Layar 6: Waiting Lounge Santai Kawan (`ShuffleRitualScreen` - Non-Juru Kunci)

* **Banner Status:** Banner kuning mencolok bertuliskan `RITUAL WAJIB KALAH` dengan pesan hangat *"Santai kawan, {loserName} sedang mengocok kartu"*.
* **Panggung Animasi:** Visual 3 kartu remi bergoyang acak dengan teks humor (*"Idih, idiiiiih....."*), disertai sinkronisasi timer 14 detik.
* **Tracker Progres:** Bar 3-segmen `RITUAL GESTUR 9 TITIK` yang terhubung via WebSocket event `shuffle_progress` untuk memantau tahapan kocokan Juru Kunci secara langsung.
* **Interaksi Sosial Ringan:**
  * Tombol reaksi instan `☕ Sruput` pada daftar pemain.
  * Tombol footer `👋 SEMANGATIN!` (mengirim dorongan semangat dan getaran taktis selama 1.5 detik ke seluruh meja via event `lounge_reaction`).
  * Tombol footer `📜 LOG RONDE` (membuka `RoundLogModal`).

---

### 4.7 Modal 1: Panduan Aturan Permainan (`RulesModal`)

* **Header:** Kuning Canary (`#FFE600`, border-b 3px hitam) bertuliskan `ATURAN PERMAINAN 7-AN`.
* **Isi Konten:** Rangkuman taktis dengan bullet points tebal:
  1. Pembagian 13 kartu per pemain & auto-reshuffle jika $\ge$ 3 kartu angka 7.
  2. Kartu 7 pembuka wajib diturunkan otomatis ke tengah meja.
  3. Sambungan kartu sah ($N+1$ atau $N-1$) atau membuka 7 lainnya.
  4. Aturan Anti-Bohong: Dilarang menutup kartu jika memiliki kartu sah di tangan.
  5. State As (0 poin jika belum terbuka, 1 poin jika Low, 15 poin jika High).
  6. Denda flat 30 poin untuk kartu kunci 6 dan 8 yang tertutup.
  7. Penentuan pemenang berdasarkan akumulasi poin penalti kartu tertutup **terendah**.
  8. Sistem rekor kekalahan komunitas RT (3x kalah berturut-turut) dan RW (6x kalah berturut-turut).
* **Footer:** Tombol hijau mint `SAYA PAHAM`.

---

### 4.8 Modal 2: Pengaturan Permainan (`SettingsModal`)

* **Header:** Kuning Canary (`#FFE600`, border-b 3px hitam) bertuliskan `PENGATURAN PERMAINAN`.
* **Item Konfigurasi:**
  * Toggle 1 (Efek Audio & Suara): Switch Neo-Brutalist on/off untuk efek audio kartu dan notifikasi giliran (`localStorage: sevens_settings_v1`).
  * Toggle 2 (Tap 2 Kali Main / Tutup): Switch on/off untuk eksekusi langkah kartu cepat tanpa tombol dock.
* **Footer:** Kotak versi build dan tombol hijau mint `SIMPAN & TUTUP` (`#00D084`).

---

### 4.9 Modal 3: Peringatan Konfirmasi Kartu Kunci 6 & 8 (`KeyCardConfirmModal`)

* **Trigger:** Muncul jika pemain hendak menutup kartu bernilai 6 atau 8 saat tidak memiliki langkah sah lainnya.
* **Visual Peringatan:** Kotak merah cerah (`#FFDAD6` / `#BA1A1A`, border 3px hitam, shadow 6px) dengan ikon kunci besar `🔑`.
* **Pesan Penegasan:** Menegaskan bahwa kartu 6 dan 8 merupakan kartu kunci dengan denda denda pasti **+30 Poin Denda** flat per kartu.
* **Tombol Tindakan:**
  * Tombol Merah Bahaya: `Tetap Tutup (+30 Poin)`.
  * Tombol Putih Pembatalan: `Batal (Pilih Kartu Lain)`.

---

### 4.10 Modal 4: Cold Start Server Render & Rekap Log Ronde

* **Cold Start Modal (`ColdStartModal`):**
  * Muncul saat pemain membuat atau bergabung room ketika server Render sedang bangun (*waking up*).
  * Panel Neo-Brutalist putih dengan progress bar bersegmen dan teks: *"Sedang menyiapkan server gratisan (~20 detik)..."*.
  * Auto-retry WebSocket otomatis setiap 3 detik di latar belakang tanpa mengharuskan input ulang dari pengguna.
* **Round Log Modal (`RoundLogModal` / `📜 LOG RONDE`):**
  * Diakses dari waiting lounge Layar 6.
  * Menampilkan rekap visual lengkap ronde sebelumnya: kartu 7 pembuka, status mode As akhir, rincian kartu tangan tertutup setiap pemain, denda kartu 6/8, dan total penalti akhir.

---

## 5. Komponen Usang / Didepresiasi (Deprecated Items)

Demi mencegah kebingungan dalam implementasi teknis, komponen dan fitur berikut **telah didepresiasi dan dihapus permanen** dari basis kode Tujuhan Tactical:

* **Turn Timer HUD & Circular Countdown:** Seluruh countdown visual melingkar pada giliran gameplay telah dihapus dari meja taktis.
* **Input Chat Teks & Baki Pesan:** Tidak ada kolom chat teks atau baki pesan real-time untuk memangkas overhead server WebSocket dan moderasi konten.
* **Pot / Taruhan Chip / Koin Perjudian:** Seluruh elemen taruhan, koin virtual, dan chip poker ditiadakan sepenuhnya (100% *zero-cost casual game*).
* **Referensi Permainan Lain:** Seluruh istilah varian kartu di luar 7-an (seperti *Cangkulan*) dibersihkan agar dokumen terfokus murni pada *7-an (Tujuhan Tactical)*.
