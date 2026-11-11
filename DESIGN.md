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

# Brand & Style

This design system establishes a high-voltage Neo-Brutalist visual identity engineered specifically for digital adaptations of traditional Indonesian trick-taking and card shed games, primarily *Cangkulan* and *7-an* (Seven Spades / Tujuhan).

## Personality & Tone

- **Tactical & Kinetic:** Sharp, high-stakes, responsive, and immediate. Card plays, tactical folds, and sequence breaks land with physical weight.
- **Nostalgic yet Electric:** Warms the communal street-corner atmosphere of Indonesian *pos ronda* card nights into an amplified, arcade-grade cyber-retro interface.
- **Unapologetic Rawness:** Heavy ink-traps, unsoftened edges, deliberate offset shadows, and saturated blocks of pigment that reject generic flat design or subtle gradient tropes.

### Target Audience & Emotional Impact

Designed for competitive casuals, university students, and classic card enthusiasts across mobile and web. The interface must evoke tension, visceral satisfaction on card slaps, and supreme clarity during fast-paced 4-player turns.

## Colors

The palette operates on uncompromising color collisions. Every hue is hyper-saturated, balanced against stark black structural framing (`#000000`) and pure canvas chalk (`#FFFFFF`).

### Palette Allocation

- **Electric Mint (`#10B981`):** Primary brand accent, confirmed turns, active player indicator, successful sequences, and valid card plays.
- **Canary Yellow (`#FFD000`):** Secondary action state, trump suit indicator, spade callouts, attention chips, and active turn indicators.
- **Punchy Coral Red (`#FF3B30`):** Tertiary tactical color, heart/diamond card suits, fouls, skips, penalty draws, and forfeit actions.
- **Vibrant Sky Cyan (`#00D4FF`):** Utility accent, club/spade neutral states, round stats, match multipliers, and chat badges.
- **Deep Black (`#000000` & `#0F172A`):** Pure outline ink, hard dropped cast shadows, and terminal-grade typographic marks.
- **Pure Milk Chalk (`#FFFFFF`):** High-readability card faces, text badges, and crisp interactive container fills.

### Color Rules

- No soft color blending or multi-stop gradients across card components.
- Borders and hard drop-shadows must always be rendered in absolute `#000000`.
- Dark mode inverses the field canvas to an ink-dense `#0F172A`, keeping borders `#000000` or `#FFFFFF` at absolute contrast and preserving pure neon fills.

## Typography

The typographic pairing balances raw mechanical punch with ultra-crisp interface legibility.

### Hierarchy & Application

- **Headline & Display Font (`Space Grotesk`):** Delivers aggressive geometric cuts, hard numeric symbols, and assertive table callouts. Used for scores, card indices (A, K, Q, J, 10–2), table states, and big screen banners. Headlines must remain uppercase or sentence case with tight tracking.
- **Body Font (`Plus Jakarta Sans`):** Offsets the harshness of brutalism with clean, rhythmic readability for game rule explanations, chat overlays, log history, and profile data.
- **Label Font (`Space Grotesk`):** Heavy, compact uppercase labels for button triggers, suit badges, multipliers, and phase counters.

## Layout & Spacing

The layout is grounded in rigid spatial containment. Elements do not float unanchored; they sit within distinct boxed territories defined by explicit outlines.

### Grid & Composition

- **Game Table Layout:** Uses contextual fixed safe areas with a central green felt playfield canvas framed by a 12-column responsive layout for lobby, deck management, and stats viewports.
- **Player Rail:** In game-play mode, the hand tray occupies the bottom viewport area with strict `space-xs` overlapping card negative margins (-28px desktop, -16px mobile) to support multi-card fan formations.
- **Breakpoints:**
  - **Mobile (< 640px):** Single-column stack for lobbies; table view defaults to horizontal orientation lock or compact portrait arena with fixed action trays.
  - **Tablet (641px - 1024px):** 8-column layout with pinned chat and battle logs.
  - **Desktop (> 1024px):** 12-column layout with 24px margins, housing full-size round analytics, live table spectators, and tactile scoreboard modules.

## Elevation & Depth

This design system strictly prohibits Gaussian blurs, diffuse ambient drop shadows, and pseudo-realistic 3D bevels. Elevation is expressed entirely through **Hard-Edge Offset Shadows** and structural black ink weight.

### Depth Hierarchy

- **Level 0 (Flat Canvas / Felt):** 0px offset. Flat background with optional 1px grid pattern or halftoning.
- **Level 1 (Surface Cards & Structural Containers):**
  - Border: `2px solid #000000`
  - Shadow: `3px 3px 0px #000000`
- **Level 2 (Interactive Buttons, Playing Cards in Hand, Modals):**
  - Border: `3px solid #000000`
  - Shadow: `4px 4px 0px #000000`
- **Level 3 (Dragged Cards, Critical Victory Prompts, Floating Action HUD):**
  - Border: `3px solid #000000`
  - Shadow: `6px 6px 0px #000000`
- **Active / Pressed State (Physical Slapdown):**
  - Transform: `translate(2px, 2px)` (or `translate(3px, 3px)` for Level 2/3)
  - Shadow: `1px 1px 0px #000000`
  - Provides instant, physical haptic response mimicking slamming a physical card onto a wooden table.

## Shapes

The design system uses a strict **Soft Neo-Brutalist** curvature (`roundedness: 1` — 4px base radius, 8px on large cards, 12px on overlay panels).

### Geometry Rules

- Never use fully pill-shaped or bubble radiuses for operational buttons; buttons must maintain boxy, angular dignity.
- Playing cards on the central table (`variant="board"`) utilize a 12px (`0.75rem` / `rounded-xl`) corner radius, square-portrait proportions (`h-[76px] sm:h-20`), a `2.5px` solid black border, and a `3px 3px 0px #000000` hard offset shadow, while compact cards in hand and folded trays use a 6px (`rounded-md`) radius.
- Badges and status pills may employ sharp 0px or soft 4px corners, always framed in `2px` black line-weights.

---

## 2. Arsitektur State & Skema Data (Data Schema)

### 2.1 Room State JSON Schema

Arsitektur state aplikasi menggunakan paradigma *Single Source of Truth* (SSOT) terpadu antara Go engine Wasm, backend WebSocket, dan klien React TypeScript:

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
  consecutiveLosses: number; // Jumlah kekalahan peringkat ke-4 (Juru Kunci) berurutan di room yang sama
  statusRtRw: 'NONE' | 'RT' | 'RW'; // Status komunitas aktif: 'NONE' | 'RT' | 'RW'
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
  statusRtRw: 'NONE' | 'RT' | 'RW';
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
  rtRwHolderId: string;       // ID pemain pemegang tunggal status RT/RW aktif di meja
  rtRwStatus: 'NONE' | 'RT' | 'RW'; // Status komunitas tunggal aktif: 'NONE' | 'RT' | 'RW'
}
```

#### Aturan Transisi Kondisi RT/RW (State Machine Engine):
1. **Kondisi RT (KEPALA RT):** Pemain menempati peringkat ke-4 (Juru Kunci / penalti tertinggi) sebanyak 3 kali berturut-turut (`consecutiveLosses == 3`) di room yang sama.
2. **Kondisi RW (KEPALA RW):** Pemain menempati peringkat ke-4 sebanyak 6 kali berturut-turut (`consecutiveLosses >= 6`, yaitu 2 streak RT berturut-turut tanpa jeda peringkat 1–3). Status otomatis naik dari RT ke RW.
3. **Eksklusivitas Kamar (Single Active Holder):** Di dalam satu room hanya boleh ada maksimal 1 pemegang status RT atau RW dalam satu waktu. Ketika pemain lain mencapai RT (`consecutiveLosses == 3`), status pemegang sebelumnya seketika dicabut dan di-reset ke `NONE`.
4. **Reset Streak Kalah:** Finis di peringkat 1, 2, atau 3 mereset `consecutiveLosses` pemain tersebut ke `0`. Pemegang gelar RT/RW yang finis di peringkat 1–3 tetap mempertahankan lencana gelarnya sampai ada pemain lain yang mencapai `consecutiveLosses == 3`.

---

## 3. Spesifikasi Komponen UI (Component Specifications)

### 1. Playing Cards (Core Component)

- **Face Card Styling (Table / Board Variant):** Square-portrait card (`w-full h-[76px] sm:h-20`, `rounded-xl`), crisp white background (`#FFFFFF`) for standard ranks and Canary Yellow (`#FFE600`) for anchor rank `7`, framed with a `2.5px solid #000000` border and `3px 3px 0px #000000` hard drop-shadow.
- **3-Point Board Card Anatomy:**
  - **Top-Left Index:** Primary rank label (`Space Grotesk`, `font-black`, `12px–14px`) aligned to top-left in flat suit color (`#000000` for `♠`/`♣`, `#FF4343` for `♥`/`♦`).
  - **Center Suit Motif:** Centered suit symbol (`18px–20px`) in flat suit color. Key card icons (`🔑`) are omitted on board cards.
  - **Bottom-Right Index:** Upright secondary rank label (`10px–12px`, `font-bold`, `65%` opacity) aligned to bottom-right.
- **Unopened Suit Placeholder (`SuitPlaceholder`):** Matches board card dimensions (`w-full h-[76px] sm:h-20`, `rounded-xl`) with a dark translucent felt overlay (`bg-black/20`, `2px solid rgba(255, 255, 255, 0.15)`) and centered suit symbol (`85%` opacity).
- **Hand & Folded Strip Variants:** Compact horizontal strips (`h-8` / `h-9`, `rounded-md`, `2px solid #000000` border) displaying rank on the left and key badge (`🔑` for 6 & 8) + suit symbol on the right. Mini-card tangan vertikal menggunakan dimensi `h-12 sm:h-14` dengan grid 7-kolom dan 6-kolom.
- **Valid Play State:** Electric Mint dashed target slot (`2px dashed #00D084`) on the board and upward selection lift (`-translate-y-2`) with Canary Yellow fill (`#FFE600`) in hand.
- **Card Back:** Canary Yellow (`#FFD000`) canvas with a dense 45-degree black checkerboard or Indonesian batik-geometric diamond grid framed in `3px` black border.

### 2. Buttons

- **Primary Action (e.g., "SLAP / JALAN", "LEPAS", "MAINKAN"):** Electric Mint (`#10B981` / `#00D084`) or Canary Yellow (`#FFD000` / `#FFE600`) fill, uppercase `Space Grotesk` font, `3px solid #000000` border, `4px 4px 0px #000000` shadow.
- **Destructive/Fold (e.g., "PAS", "TUTUP"):** Punchy Coral (`#FF3B30` / `#FF5A5F`) fill, white text, `3px solid #000000` border.
- **Hover/Focus State:** Background shifts +5% brightness, no shadow change.
- **Active State:** Transforms `translate(3px, 3px)` with shadow compressing to `1px 1px 0px #000000`.

### 3. Chips & Multipliers

- Rectangular or chamfered tags with `2px solid #000000`, `2px 2px 0px #000000` drop-shadow.
- Fills indicate game status: Sky Cyan (`#00D4FF`) for pot value, Canary Yellow (`#FFD000`) for Spade trump, Coral (`#FF3B30`) for penalty points, Deep Maroon (`#8B0000`) for RT/RW community badges.

### 4. Input Fields & Chat Trays

- Solid white input bar with `2px solid #000000` border, no default outline.
- Active focus state: `box-shadow: 3px 3px 0px #000000`, background changes to pale mint tint (`#ECFDF5`).
- Placeholder text in 60% muted black with mono-style brackets (e.g., `[ Masukkan pesan... ]`).

### 5. Tactical Scoreboard & Dialogue Overlays

- Modal overlays do not blur the play area. They drop down with a solid `#000000` border (`3px`) and intense offset shadow (`6px 6px 0px #000000`), filled with high-contrast panel colors.
- Header bars within cards or modals are segmented with a solid black dividing line (`2px solid #000000`) and distinct background fill (e.g., Canary Yellow banner on white card).

### 6. Turn Timer HUD (Deprecated)

- *Status:* Fitur Turn Timer HUD dan logika countdown giliran telah didepresiasi dan dihapus dari antarmuka permainan.

### 7. PlayerInteractionDock (3-Tier Vertical Stack)

Komponen dock kontrol pemain di bagian bawah layar gameplay (`GameplayScreen`) dengan arsitektur 3 tingkat vertikal tanpa scroll:
- **Tingkat 1 (Top Action Buttons):** Dua tombol aksi lebar penuh berdampingan (`grid grid-cols-2 gap-2`):
  - Tombol `TUTUP`: Latar merah coral (`#FF5A5F`), dinonaktifkan jika pemain memiliki kartu yang valid dimainkan (Anti-Bohong).
  - Tombol `MAINKAN`: Latar hijau mint (`#00D084`), aktif hanya jika kartu yang dipilih valid disambung ke meja.
- **Tingkat 2 (Middle Hand Rack - 'KARTU TANGAN'):** Wadah hijau tua (`#1B4332`, border 2px hitam, shadow 2px) dengan header `KARTU TANGAN ({hand.length})` dan indikator status kartu valid. Memuat kartu tangan dalam 2 baris tetap:
  - Baris 1: `hand.slice(0, 7)` dalam `grid grid-cols-7 gap-1`.
  - Baris 2: `hand.slice(7, 13)` dalam `grid grid-cols-6 gap-1 px-3 mt-1`.
  - Kartu tangan menggunakan komponen `PlayingCard` varian mini vertikal (`h-12 sm:h-14`) dengan indeks sudut kiri atas, lambang kanan bawah, dan ikon kunci `🔑` di kanan atas untuk kartu 6 & 8. Mendukung gestur tap untuk memilih (highlight kuning `#FFE600`) dan double-tap cepat jika diaktifkan di pengaturan.
- **Tingkat 3 (Bottom Folded Strip - 'KARTU TUTUP'):** Bar horizontal ramping (`#1B4332`, border 2px hitam) dengan label `KARTU TUTUP`, badge penalti langsung (`Total: -{totalPenalty} Poin`), dan strip chip kartu tertutup yang dapat di-scroll horizontal.

### 8. ScoreboardScreen (Papan Skor & Rekor Komunitas RT/RW)

Halaman penutup ronde (`ScoreboardScreen`) bergaya Neo-Brutalist dengan integrasi telemetry komunitas:
- **Header:** Latar hijau mint (`#10B981`, border 3px bawah) dengan tombol kembali, judul `PAPAN SKOR`, dan pill kode room `#{roomCode}`.
- **Subheader:** Baris telemetry dengan badge kiri `RONDE {roundNumber}` dan badge kanan status nilai As (`🔒 STATUS AS: {aceModeLabel}`).
- **Bagian 1 ('RINCIAN KARTU PEMAIN'):** Daftar 4 kartu pemain kompak terurut dari peringkat 1 hingga 4. Setiap kartu menampilkan avatar inisial (`1ST` tag untuk peringkat 1), nama pemain, tag `ANDA` / `BOT`, pill peringkat (`PEMENANG`, `#2`, `#3`, `JURU KUNCI`), total penalti poin, rincian kartu yang ditutup/terbuka, akumulasi `Kalah: Nx`, dan badge animasi `RT!` atau `RW!` jika pemain memegang gelar.
- **Bagian 2 ('STATUS RT / RW #{roomCode}'):** Kartu eksklusif Neo-Brutalist di bagian bawah scroll area (`border-[3px] border-black shadow-[4px_4px_0px_#000000]`):
  - Jika pemegang aktif ada: Avatar besar (`w-12 h-12`), nama, tag ANDA/BOT, badge menyala `KEPALA RT` (`#8B0000`) atau `KEPALA RW` (`#8B0000`/`#FFE600`), dan ringkasan rekor ('Kalah 3x berturut-turut di room yang sama' atau 'Mencapai 2x status RT beruntun (6x Kalah Beruntun)').
  - Jika belum ada pemegang: Kartu status netral 'BELUM ADA KEPALA RT / RW' ('Belum ada pemain yang kalah 3x berturut-turut di meja ini.').
- **Fixed Footer:** Tombol primer kuning `MAIN LAGI (REMATCH)` (mengarahkan ke Layar 5 `ShuffleRitualScreen`) dan tombol sekunder putih `KEMBALI KE MENU`.

### 9. SettingsModal (Pengaturan Permainan)

Modal konfigurasi permainan yang diakses melalui tombol `PENGATURAN` pada `SideDrawer`:
- **Header:** Kuning mencolok (`#FFE600`, border 3px hitam) dengan judul `PENGATURAN PERMAINAN`.
- **Toggle 1 (Efek Audio & Suara):** Switch on/off untuk audio latar dan efek suara kartu, tersimpan di `localStorage` (`sevens_settings_v1`).
- **Toggle 2 (Tap 2 Kali Main / Tutup):** Switch on/off gestur double-tap untuk eksekusi langkah kartu cepat.
- **Info Box & Action:** Kotak informasi versi aplikasi dan tombol hijau mint `SIMPAN & TUTUP` (`#00D084`).

### 10. ShuffleRitualScreen (Ritual Kocok Kartu & Waiting Lounge)

Layar pasca-rematch (Layar 5) menggantikan countdown modal 3 detik:
- **Cabang Juru Kunci (Kocok Kartu Manual):**
  - Header hijau mint `RITUAL KOCOK KARTU` dengan telemetry room dan ronde.
  - Kartu instruksi `KOCOK KARTU MANUAL`, indikator `PUTARAN {step} / 3`, dan progress bar 3 segmen.
  - Diagram panduan pola `TARGET POLA: TACTICAL-Z` (mini 3x3 SVG pola titik `[0, 2, 6, 8]`) dan status tumpukan acakan (`33%` $\rightarrow$ `66%` $\rightarrow$ `100%`).
  - **Touchpad Gestur 9 Titik:** Kanvas interaktif 3x3 dot dengan pelacak pointer/mouse/touch. Pemain wajib menghubungkan titik pola Z sebanyak 3 putaran. Jika salah 3 kali berturut-turut, sistem menyalakan feedback merah `AUTO-RESHUFFLE AKTIF!` dan melanjutkan otomatis ke ronde baru setelah 800ms.
- **Cabang 3 Pemain Lainnya (Waiting Lounge "Santai Kawan"):**
  - Banner kuning `RITUAL WAJIB KALAH` dengan pesan *"Santai kawan, {loserName} sedang mengocok kartu"*.
  - Visualisasi animasi 3 kartu kocok (*"Idih, idiiiiih....."*) dan tracker 3 segmen yang melacak progres pengocokan kartu secara live.
  - Daftar kondisi pemain meja dengan tombol reaksi instan `☕ Sruput`.
  - Tombol footer: `👋 SEMANGATIN!` (efek visual dorongan semangat selama 1.5 detik) dan `📜 LOG RONDE` (membuka modal detail rekap ronde sebelumnya).
- **Round Log Modal (`📜 LOG RONDE`):**
  - Modal ringkasan pertandingan yang menampilkan kartu 7 pembuka ronde lalu, status As akhir, rincian kartu tangan tertutup, denda flat kartu 6/8, dan total penalti setiap pemain.
