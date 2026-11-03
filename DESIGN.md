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

- **Tactical & Kinetic:** Sharp, high-stakes, responsive, and immediate. Turn timers, card plays, and sequence breaks land with physical weight.
- **Nostalgic yet Electric:** Warms the communal street-corner atmosphere of Indonesian *pos ronda* card nights into an amplified, arcade-grade cyber-retro interface.
- **Unapologetic Rawness:** Heavy ink-traps, unsoftened edges, deliberate offset shadows, and saturated blocks of pigment that reject generic flat design or subtle gradient tropes.

### Target Audience & Emotional Impact

Designed for competitive casuals, university students, and classic card enthusiasts across mobile and web. The interface must evoke tension, visceral satisfaction on card slaps, and supreme clarity during fast-paced 4-player turns.

## Colors

The palette operates on uncompromising color collisions. Every hue is hyper-saturated, balanced against stark black structural framing (`#000000`) and pure canvas chalk (`#FFFFFF`).

### Palette Allocation

- **Electric Mint (`#10B981`):** Primary brand accent, confirmed turns, active player indicator, successful sequences, and valid card plays.
- **Canary Yellow (`#FFD000`):** Secondary action state, trump suit indicator, spade callouts, attention chips, and turn timers.
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
- Playing cards utilize an 8px (`0.5rem`) corner radius combined with a `3px` solid border, preserving classic bicycle card proportions while maintaining harsh comic-book punch.
- Badges and status pills may employ sharp 0px or soft 4px corners, always framed in `2px` black line-weights.

## Components

### 1. Playing Cards (Core Component)

- **Face Card Styling:** Crisp white background (`#FFFFFF`), `3px solid #000000` border, `4px 4px 0px #000000` shadow.
- **Corner Indices:** Font: `Space Grotesk Bold`. Suits rendered in pure flat colors: Spades/Clubs in `#0F172A`, Hearts/Diamonds in `#FF3B30`.
- **Center Suit Illustration:** High-contrast graphic motifs with heavy outlines.
- **Valid Play State:** Electric Mint glow-ring replaced with thick dashed border (`3px dashed #10B981`) and a vertical upward hover lift: `translateY(-12px)`.
- **Card Back:** Canary Yellow (`#FFD000`) canvas with a dense 45-degree black checkerboard or Indonesian batik-geometric diamond grid framed in `3px` black border.

### 2. Buttons

- **Primary Action (e.g., "SLAP / JALAN", "LEPAS"):** Electric Mint (`#10B981`) or Canary Yellow (`#FFD000`) fill, uppercase `Space Grotesk` font, `3px solid #000000` border, `4px 4px 0px #000000` shadow.
- **Destructive/Fold (e.g., "PAS", "TUTUP"):** Punchy Coral (`#FF3B30`) fill, white text, `3px solid #000000` border.
- **Hover/Focus State:** Background shifts +5% brightness, no shadow change.
- **Active State:** Transforms `translate(3px, 3px)` with shadow compressing to `1px 1px 0px #000000`.

### 3. Chips & Multipliers

- Rectangular or chamfered tags with `2px solid #000000`, `2px 2px 0px #000000` drop-shadow.
- Fills indicate game status: Sky Cyan (`#00D4FF`) for pot value, Canary Yellow (`#FFD000`) for Spade trump, Coral (`#FF3B30`) for penalty points.

### 4. Input Fields & Chat Trays

- Solid white input bar with `2px solid #000000` border, no default outline.
- Active focus state: `box-shadow: 3px 3px 0px #000000`, background changes to pale mint tint (`#ECFDF5`).
- Placeholder text in 60% muted black with mono-style brackets (e.g., `[ Masukkan pesan... ]`).

### 5. Tactical Scoreboard & Dialogue Overlays

- Modal overlays do not blur the play area. They drop down with a solid `#000000` border (`3px`) and intense offset shadow (`6px 6px 0px #000000`), filled with high-contrast panel colors.
- Header bars within cards or modals are segmented with a solid black dividing line (`2px solid #000000`) and distinct background fill (e.g., Canary Yellow banner on white card).

### 6. Turn Timer HUD

- Hard segmented progress bar with black block segments filling in real-time, accompanied by a vibrating countdown timer in Coral Red when `< 5` seconds remain.
