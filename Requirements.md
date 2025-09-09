Requirements

I want to build an SPA using SvelteKit and Skeleton UI.
The purpose of the app is to manage my daily routines and habits.

Goal: Help users (esp. ADHD/Autistic and time-blind users) run consistent guided routines with step timers, reminders, and light stats.

---

## RoutineFlow Clone – Simplified Requirements (Web SPA)

### Tech stack

* **Frontend:** SvelteKit SPA
* **Data store (MVP):** Browser storage (IndexedDB/LocalStorage)
* **Backend (later):** Supabase (Postgres + Auth + Storage)

---

### Core Features (MVP – Local Storage)

* Create/edit/delete **routines**

  * Routine = name, emoji/icon, color, optional notes
  * Each routine has **steps**: name, optional description, duration (seconds/minutes), optional checklist
  * Drag & drop to reorder steps
* **Run mode**

  * Start routine → full-screen step player
  * Show step timer, total progress
  * Controls: start, pause, skip, auto-advance on timeout
  * Track actual durations (planned vs real)
* **Reminders (basic)**

  * Local “upcoming routine” notifications (via browser APIs if supported)
* **Templates**

  * Starter templates (Morning, Evening, etc.)
* **Stats (lightweight)**

  * Track runs (date, completed, partial, abandoned)
  * Show weekly summary (# completed routines)

---

### Nice-to-Have (Phase 2)

* Schedule routines by day/time (recurring)
* Weekly planner view (calendar-style)
* Export/import routines (JSON)
* Widgets/shortcuts (later for mobile apps)

---

### Data Model (MVP – local, later Supabase)

* **Routine**

  * id, name, emoji, color, notes
* **Step**

  * id, routine\_id, name, description, duration\_s, checklist\[]
* **Session (Run)**

  * id, routine\_id, start\_ts, end\_ts, status
* **SessionStep**

  * session\_id, step\_id, planned\_duration\_s, actual\_duration\_s, skipped

---

### Non-functional

* Offline-first (all local storage)
* Responsive UI (mobile-first)
* Accessible (labels, large text, color contrast)
* Simple, focus-friendly design (low cognitive load)

---

### Future (Supabase integration)

* User accounts (Supabase Auth)
* Cloud sync of routines/sessions
* Share/export routines across devices


