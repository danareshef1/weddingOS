# Wedding OS

A full-featured, bilingual wedding planning platform built with Next.js 14. Designed for couples to manage every aspect of their wedding — guests, seating, budget, vendors, gallery, and more — with a beautiful, elegant UI and full Hebrew/English support.

---

## Features

### Guest-Facing Pages
- **Home** — Landing page with couple hero section and feature overview
- **Our Story** — Couple's timeline and story
- **Details** — Event location, timing, and logistics
- **Gallery** — Public photo gallery
- **Registry** — Gift registry
- **FAQ** — Bilingual frequently asked questions
- **Contact** — Guest contact form
- **RSVP** — Guest RSVP form with invite code support
- **Guest Portal** — Personalized RSVP status and wedding info for guests

### Dashboard (Couple/Admin)
- **Overview** — RSVP stats and budget summary at a glance
- **Guests** — Full guest list management with CSV import/export, RSVP tracking, meal choices, plus-ones, and song requests
- **Seating** — Visual drag-and-drop seating canvas with auto-seating algorithm
- **Budget** — Budget tracking by category; actual, paid, and deposit amounts; venue cost calculator with extra hours/persons
- **Vendors** — Vendor contacts, status tracking, and payment management
- **Gallery** — Image upload and management (approval/public flags)
- **Messages** — Pre-built message templates for SMS, Email, and WhatsApp
- **Settings** — Wedding details: couple names, date, venue, locale, theme

### Authentication & Access Control
- Email/password login via NextAuth v5
- **Email verification required** — users receive a verification link after registration and cannot log in until confirmed
- Passwords hashed with **bcrypt** (cost factor 12)
- Roles: `COUPLE`, `ADMIN`, `GUEST`, `VENDOR`
- Role-based route protection via middleware
- Onboarding flow for new couples

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS + Radix UI |
| Animation | Framer Motion, GSAP |
| Database | PostgreSQL via Prisma ORM |
| Auth | NextAuth v5 (Credentials + Prisma Adapter) |
| Password Hashing | bcryptjs (cost factor 12) |
| Email | Nodemailer (SMTP) |
| i18n | next-intl (Hebrew default, English) |
| File Storage | AWS S3 (with local `/public/uploads` fallback) |
| Charts | Recharts |
| Drag & Drop | @dnd-kit |
| Validation | Zod |
| Testing | Vitest + Testing Library |

---

## Project Structure

```
src/
├── app/
│   └── [locale]/              # i18n-aware routing
│       ├── (public)/          # Guest-facing pages
│       ├── (auth)/            # Login, register, onboarding
│       └── dashboard/         # Couple/admin pages
├── components/
│   └── ui/                    # Shared UI primitives (Button, Card, Dialog, etc.)
├── lib/                       # Utilities, auth helpers, shared logic
├── messages/
│   ├── he.json                # Hebrew translations
│   └── en.json                # English translations
├── actions/                   # Server actions (guests, budget, vendors, etc.)
└── prisma/
    └── schema.prisma          # Database schema
```

---

## Database Models

- **Wedding** — Core entity: couple info, venue, dates, settings
- **User** — Auth with roles (COUPLE, ADMIN, GUEST, VENDOR)
- **Guest** — RSVP, meal choice, plus-one, song requests
- **Table** — Seating layout with X/Y canvas coordinates
- **BudgetItem** — Per-category budget with actual/paid/deposit tracking
- **Vendor** — Contact info, status, and payment tracking
- **GalleryImage** — Photos with approval and public flags
- **MessageTemplate** — SMS/Email/WhatsApp message templates
- **FAQ** — Bilingual question/answer pairs
- **TimelineEvent** — Story and timeline events
- **ScheduleItem** — Day-of schedule
- **InviteCode** — Reusable guest invite codes

---

## Internationalization

- **Languages:** Hebrew (`he`, default) and English (`en`)
- **RTL:** Full right-to-left layout support for Hebrew
- **Locale prefix:** Always in URL (`/he/...`, `/en/...`)
- **Translations:** Organized by page section in `src/messages/`
- Server-side (`getTranslations`) and client-side (`useTranslations`) support

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- (Optional) AWS S3 bucket for image storage

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Fill in DATABASE_URL, NEXTAUTH_SECRET, and optionally AWS credentials

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and complete the onboarding flow.

### Environment Variables

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret        # generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# SMTP — required for email verification
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your@email.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@your-domain.com

# Optional S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET_NAME=
```

---

## Scripts

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
npm run test      # Run Vitest tests
npx prisma studio # Open Prisma database GUI
```

---

## Design

- **Fonts:** Playfair Display (serif headings) + Inter (body)
- **Colors:** Rose/pink accents on ivory/stone backgrounds
- **Animations:** Floating petal hero animation, smooth page transitions
- **Components:** Card-based layouts, modal dialogs, data tables, badge status indicators
- **Responsive:** Mobile-first, fully responsive across all pages

---

## What's Been Built

| Area | Status |
|---|---|
| Authentication (login, register, onboarding) | Done |
| Email verification on registration (bcrypt + Nodemailer) | Done |
| Password hashing upgraded SHA-256 → bcrypt | Done |
| Dashboard layout and navigation | Done |
| Guest management (list, add, edit, CSV import/export) | Done |
| RSVP flow (invite codes, meal choice, plus-ones) | Done |
| Seating chart (drag-and-drop canvas, auto-seat algorithm) | Done |
| Budget tracker (categories, venue calculator, totals) | Done |
| Vendor management | Done |
| Gallery (upload, approve, public toggle) | Done |
| Message templates (SMS/Email/WhatsApp) | Done |
| Settings (wedding details, locale, theme) | Done |
| Public pages (home, story, details, FAQ, contact, registry) | Done |
| Guest portal | Done |
| Full Hebrew/English i18n with RTL support | Done |
| AWS S3 image storage (with local fallback) | Done |
| Role-based access control | Done |
