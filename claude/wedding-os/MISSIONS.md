# Missions

Tasks to execute, each written as a self-contained prompt.

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

