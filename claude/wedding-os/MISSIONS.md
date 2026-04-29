# Missions

Tasks to execute, each written as a self-contained prompt.

---

## Mission 4 — Guest Gifts & Envelope Management

Build a complete gift and envelope tracking feature inside the dashboard.

**Overview**
A dedicated tab where the couple can track every monetary gift received at their wedding — from confirmed guests and unexpected attendees alike. The goal is to replace the physical envelope ledger with a clean, digital, organized system.

**Guest List Integration**
- Auto-populate the gift list with all guests whose RSVP status is `ACCEPTED`.
- Each accepted guest (or their household/plus-one group) appears as a gift entry by default.
- Allow manually adding extra entries for walk-in guests, family friends not in the system, or group envelopes (e.g. "Uncle's side of the family").

**Per-Entry Tracking**
Each gift entry records:
- Guest name (pre-filled from guest list or manually entered)
- Number of attendees covered by this envelope (defaults to RSVP accepted count including plus-one)
- Gift amount (₪)
- Payment method: `Cash`, `Check`, `Bank Transfer`, `Bit`, `Online / App`
- Status: `Received` / `Pending`
- Notes (free text — e.g. "check #1234", "received via sister", "promised to transfer")
- Timestamp of when it was marked received

**Summary Dashboard**
At the top of the tab, show a summary card strip:
- Total gifts received (₪ sum of all `Received` entries)
- Total pending (₪ sum of `Pending` entries)
- Number of envelopes received vs. total
- Average gift per entry
- Average gift per person (total amount ÷ total attendees)
- Breakdown by payment method (bar or pill breakdown)

**Search & Filter**
- Search by guest name
- Filter by payment method
- Filter by status (received / pending / all)
- Sort by: amount (high/low), name (A–Z), date received

**Export**
- Export to CSV / Excel with all columns: name, attendees, amount, method, status, notes, date

**Tech Notes**
- Add a new `GiftEntry` Prisma model with fields: `id`, `weddingId`, `guestId` (optional FK to Guest), `guestName` (string, for manual entries), `attendeeCount`, `amount`, `method` (enum: CASH, CHECK, BANK_TRANSFER, BIT, ONLINE), `status` (enum: RECEIVED, PENDING), `notes`, `receivedAt`, `createdAt`.
- Add a `GiftEntry` enum for `method` and `status` in `schema.prisma`.
- Add server actions: `createGiftEntry`, `updateGiftEntry`, `deleteGiftEntry`, `importFromGuests` (bulk-create entries from accepted guests).
- Add a `/dashboard/gifts` page with the full UI.
- Add a "Gifts" entry to the dashboard sidebar (use a `Gift` or `Banknote` icon from lucide-react).
- Export via a `/api/gifts/export` route that returns a CSV.
- Follow existing dashboard layout, sidebar, and i18n patterns (en + he).
- Add all new UI strings to `src/messages/en.json` and `src/messages/he.json`.

---

## Mission 3 — Advanced Wedding Schedule Management

Build a complete, interactive wedding-day schedule system inside the dashboard.

**Core Timeline**
- A visual day-of timeline showing every key moment: photographer arrival, makeup artist, bride/groom first look, ceremony start, cocktail hour, reception flow, cake cutting, first dance, and more.
- Each timeline item has: time, title, description, location, assigned vendor/person, and category (vendor arrival, ceremony, reception, photo, personal, custom).
- Users can manually add any custom task, vendor arrival, or event to the timeline.
- **Drag-and-drop editor** — reorder or reschedule items by dragging them on the timeline.

**Vendor Integration**
- Link timeline items to vendors already in the vendors tab.
- **Quick contact actions** on each item: one-tap Call, WhatsApp, or Email the linked vendor.
- Show payment status and due date for each vendor inline on the timeline.

**Smart Features**
- **Buffer time suggestions** — warn when two consecutive items have no gap between them.
- **Checklist per item** — attach a mini-checklist of things that must be ready before each step (e.g. "bouquet ready", "DJ briefed").
- **Automatic reminders** — set a reminder time before each item; the platform sends an in-app notification (or email) when the time approaches.
- **Real-time notifications** — if a task is marked as delayed or updated, notify linked collaborators.

**Collaboration**
- **Shared access** — invite planners, family members, or vendors to view (or edit) the timeline via a share link or invite code.
- Collaborators see the same live timeline; changes sync in real time.

**Day-of Live Mode**
- A full-screen "live mode" view that shows:
  - Current time
  - The currently active task (highlighted)
  - Countdown to the next task
  - A scrollable list of remaining items
- Accessible from a prominent "Go Live" button on the timeline page.

**Export**
- **Printable / shareable PDF** — generate a clean, formatted wedding day schedule PDF the couple can print or share with vendors.

**AI Upgrades**
- Suggest an ideal timeline based on wedding type, guest count, and venue.
- Detect schedule conflicts (overlapping times, same vendor in two places).
- Recommend best time slots for photos, ceremony, and dinner based on sunset/season.
- Warn if a time gap is too tight or a section is unrealistically short.

**Tech notes**
- Extend the existing `ScheduleItem` Prisma model or create a richer `TimelineEvent` model with all new fields (vendorId, location, category, checklist, reminderMinutes, status).
- Add a `/dashboard/schedule` page (or enhance the existing one if it exists).
- Use `@dnd-kit` for drag-and-drop reordering (already in the stack).
- PDF generation via `@react-pdf/renderer` or similar.
- Real-time sync via polling or Server-Sent Events.
- Follow the existing dashboard layout, sidebar, and i18n patterns (en + he).
- Add a "Schedule" entry to the sidebar if not already present.

---

## Mission 2 — AI Wedding Planner

Build an intelligent in-platform assistant that helps couples plan every part of their wedding. The assistant lives inside the dashboard as a dedicated chat interface.

**Core Concept**
The AI knows the couple's full wedding context: their guest count, budget items, vendors, seating plan, to-do list, timeline, and wedding date. It uses this live data to give personalized, actionable advice — not generic responses.

**Example queries the assistant must handle well:**
- "Build me a budget for a 400-guest wedding in Beersheba"
- "Suggest a full wedding day timeline"
- "Which vendors am I still missing?"
- "How much alcohol should I order?"
- "How many tables do I need?"
- "What should I be doing 3 months before the wedding?"

**Features**
- **Chat UI** — A clean chat interface inside the dashboard (message bubbles, input box, send button). Persists conversation history for the session.
- **Live context injection** — Before each request, pull the couple's current data (guest count, RSVP breakdown, tables, budget totals, vendor list, to-do items, wedding date/venue) and inject it as system context so the AI answers relative to their actual wedding.
- **Structured action suggestions** — When the AI recommends something actionable (e.g. add a vendor, set a budget line), it can optionally return a suggestion chip the user can click to execute directly.
- **Streaming responses** — Stream the AI reply token-by-token for a smooth UX.
- **Hebrew + English** — Detect or follow the user's current locale and respond in the same language.

**Tech notes**
- Use the Anthropic Claude API (claude-sonnet-4-6 or latest available) via the `@anthropic-ai/sdk` package.
- Add a `/api/ai/chat` route that accepts `{ messages, locale }` and streams back the response.
- The system prompt must include injected live wedding data fetched server-side.
- Add an "AI Planner" entry to the dashboard sidebar nav with a sparkle/wand icon.
- Follow the existing dashboard layout, sidebar, and i18n patterns (en + he).
- Store the API key in `.env` as `ANTHROPIC_API_KEY`.

---

## Mission 1 — Seating Tab

Build a full **Seating** tab in the wedding-os dashboard. The feature works as follows:

**Sketch / Floor Plan**
- Give the user two entry points:
  1. **Upload a sketch** — upload an image of the venue floor plan as a background reference.
  2. **Build your own sketch** — an interactive canvas where the user places tables manually.

**Table Types**
- The user can add tables of three shapes:
  - Round
  - Square
  - Rectangle (מלבן)
- Each table has a configurable **number of chairs/seats**.
- Tables can be dragged and repositioned freely on the canvas.
- Tables should be labeled (e.g. "Table 1", "Table 2", …) and the label should be editable.

**Guest Assignment**
- Once tables are placed, the user can assign guests to seats.
- Pull the guest list from the existing guests data (already stored in the DB).
- Each seat on a table can be assigned to one guest.
- Show a clear visual indicator for filled vs. empty seats per table.
- Allow reassigning or removing a guest from a seat.

**Persistence**
- Save the entire floor plan (table positions, shapes, seat count, guest assignments) to the database.
- Load and restore the saved layout when the user revisits the tab.

**Tech notes**
- Use a canvas/drag-and-drop library (e.g. `react-konva` or plain HTML5 Canvas with a drag library) that fits the existing stack.
- Follow the existing dashboard layout, sidebar, and i18n patterns (en + he).
- Add the "Seating" entry to the dashboard sidebar nav.

