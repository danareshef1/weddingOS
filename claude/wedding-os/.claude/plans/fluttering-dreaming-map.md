# WeddingOS — "Modern Luxury Wedding" Visual Overhaul

## Context
The current design uses generic bright pink, pure white backgrounds, and basic styling. The user wants it to look **pretty, edgy, and attractive** — like a real luxury wedding website. The overhaul transforms the aesthetic into a **dark romantic + gold accent** design with glass-morphism effects, refined typography, and cinematic animations.

---

## Design Direction

- **Hero & Auth pages**: Dark plum-to-midnight gradient background with golden floating particles, elegant light-weight serif typography, gold `&` symbol, glass-morphism countdown boxes, gold CTA button
- **Color system**: Warm cream backgrounds, sophisticated deep rose primary, **champagne gold accent** throughout
- **Dashboard**: Warm gradient sidebar, pill-shaped active nav states, gold decorative accents on page headings
- **Overall feel**: Think luxury wedding invitation — not a pink template

---

## Files to Modify (12 files, 0 new)

### 1. `src/app/globals.css` — New Color System + Utilities
- Warm cream background (`40 33% 98%`) instead of pure white
- Deep rose primary (`350 60% 52%`) instead of bright pink
- Add `--gold: 38 80% 55%` CSS variable (light & dark)
- Warm beige borders/muted tones
- Add `.glass` and `.glass-dark` utility classes
- Add `@keyframes shimmer` for gold animation
- Add `.ornament` decorative divider class
- Add `.bg-warm-gradient` utility

### 2. `tailwind.config.ts` — Gold Token + Animations
- Add `gold` color: `hsl(var(--gold))` + foreground
- Add keyframes: `shimmer`, `fade-up`, `pulse-glow`
- Add matching animation shortcuts

### 3. `src/components/home/hero-section.tsx` — Stunning Dark Hero
- Background: `from-[#2d1b33] via-[#3d1f3a] to-[#1a1025]` (deep plum/midnight)
- Full `min-h-screen` (navbar overlays transparently)
- Add subtle noise texture overlay
- Gold decorative line above "Save the Date"
- Split couple names: gold `&` between them, `font-light` instead of bold, larger (`lg:text-9xl`)
- Gold decorative line below names
- Venue/date: lighter weight, `text-white/70`
- CTA button: gold champagne with glow shadow
- Bottom gradient fades to `background`

### 4. `src/components/home/floating-petals.tsx` — Golden Particles
- Reduce count: 20 → 15
- Smaller: `Math.random() * 6 + 3`
- Gold color: `#d4af37` instead of `#e8a0bf`
- Add `shadowBlur: 6` glow effect

### 5. `src/components/home/countdown.tsx` — Glass Countdown
- Larger boxes: `h-20 w-20` / `sm:h-24 sm:w-24`
- Glass: `bg-white/10 backdrop-blur-md border border-white/15`
- Larger numbers: `sm:text-5xl`
- Subtler labels: `text-white/50`, `tracking-[0.2em]`

### 6. `src/components/layout/navbar.tsx` — Transparent Over Hero
- `fixed top-0 left-0 right-0 z-50 bg-transparent` (overlays dark hero)
- Taller: `h-16`
- White text: logo `text-white`, buttons `text-white/80 hover:text-white`
- Glass hover: `hover:bg-white/10`
- Login/Dashboard: `border border-white/20`

### 7. `src/components/layout/footer.tsx` — Elegant Footer
- `bg-muted/50 py-12` (warm bg, more padding)
- Gold ornamental divider: gradient lines with gold Heart icon between
- Remove `border-t`

### 8. `src/components/layout/dashboard-sidebar.tsx` — Premium Sidebar
- Gradient background: `from-card to-muted/30`
- Gold decorative line under logo header
- Active state: `bg-primary text-primary-foreground rounded-full` (pill shape)
- All nav items: `rounded-full` for consistency

### 9. `src/app/[locale]/dashboard/layout.tsx` — Lighter Background
- `bg-muted/20` instead of `bg-muted/30`

### 10. `src/app/[locale]/auth/login/page.tsx` — Dark Glass Auth
- Background: same dark gradient as hero (`from-[#2d1b33] via-[#3d1f3a] to-[#1a1025]`)
- Card: `bg-white/10 backdrop-blur-lg border-white/10 shadow-2xl`
- Gold decorative line above title
- Title: `text-white`
- Inputs: `border-white/20 bg-white/5 text-white`
- Labels: `text-white/80`
- Button: gold (`bg-[hsl(38,80%,55%)]`)
- Links: gold colored

### 11. `src/app/[locale]/auth/register/page.tsx` — Same as Login
- Identical dark glass treatment

### 12. `src/app/[locale]/dashboard/page.tsx` — Refined Heading
- Add `tracking-tight` to h1
- Add gold accent underline (`h-0.5 w-12 bg-gradient-to-r from-primary to-gold`)

---

## Verification
1. `npx tsc --noEmit` passes
2. `npm run build` succeeds
3. Homepage hero looks cinematic with dark gradient + gold particles + glass countdown
4. Navbar is transparent, overlaying the hero
5. Login/Register pages match hero aesthetic (dark glass)
6. Dashboard sidebar has pill-shaped active states + gold accents
7. Footer has elegant gold ornament divider
8. Hebrew RTL still works correctly
