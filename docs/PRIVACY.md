# Minar Insights: privacy, PII and setup

Minar's users are Grade 11 and 12 students, mostly under 18, from underserved communities in Hyderabad. The design rule is:
**no student's name or contact detail ever leaves a device.** Teachers still see whose progress is whose, because students send a
school **roll number**, and only the teacher's own device knows which name goes with it.

## How a teacher knows who is who

```
 Student's phone                        Minar database (Supabase)                 Teacher's browser
 ───────────────                        ─────────────────────────                 ─────────────────
 class code  HYD-K7Q2M      ─────►      HYD-K7Q2M · roll 0023 ·        ─────►     roll 0023 = "Ravi Kumar"
 roll number 23                         student code 0ofpuya ·                    (class list, stored only here)
 game results                           game results
 (name stays here)                      NO NAME                                   shows "Ravi Kumar · Roll 0023"
```

- **Student:** types the class code and their roll number once (Settings, or the Share progress screen). Up to 4 digits; `23`,
  `023` and `0023` are the same student. Then taps **Send to my teacher**, or copies a progress code.
- **Database:** stores the class code, the 4-digit roll number, a random student code and game results. Never a name.
- **Teacher:** pastes the class list once (Classes → Class list: `0023, Ravi Kumar` per line, or two columns from a spreadsheet).
  The list is kept in that browser only. The dashboard, report cards and "not shared yet" list then show names.
- Students without a roll number still appear, by student code; the teacher can name them on their device.
- If two student codes share a roll number (a second phone, or a typo) the dashboard marks it "roll used twice".

## Who signs in

| Person | Signs in? | Why |
| --- | --- | --- |
| Student | **No** | An account would mean collecting an email or phone number from a minor. Not needed: the roll number plus class code is enough for the teacher, and the name never travels. Students already have local save slots. |
| Teacher / NGO facilitator | **Yes**, email and password (Supabase Auth) | Adults acting for an organisation. Row-level security means each facilitator sees only their own classes. |

## Data inventory

| Data | Where it is stored | Who can see it | Classification |
| --- | --- | --- | --- |
| Game results (places, skills, Happy score, language, avatar type, Lite mode) | Student's phone; a copy in the database when shared | That class's facilitator | Pseudonymous, no identifiers |
| Student code (7 random characters, hashed from a per-game random id) | Phone; database | Facilitator | Pseudonymous |
| Class code | Phone; database | Facilitator | Not personal |
| **Roll number** (exactly 4 digits) | Phone; database | Facilitator | Pseudonymous: identifies a student only together with the school's own register |
| **Student name** | **Never sent.** Phone only (save-slot name, alias) | Nobody | Not collected |
| **Class list** (roll number → name) | **Teacher's browser only** (`localStorage`, key `mm-slots-ngo-v1`) | That teacher, on that device | Personal data, kept local: never uploaded, never in CSV exports, deleted with the class |
| Facilitator email, password hash, organisation name | Supabase Auth | Supabase project owner | Personal data of adult staff, minimal |

## PII compliance checklist

Built against India's **Digital Personal Data Protection Act, 2023** principles (and the brief's "privacy-conscious" requirement).
This is a design summary, not legal advice; NGOs and schools should confirm their own obligations with counsel.

| Principle | How Minar Insights meets it |
| --- | --- |
| **Data minimisation** | Students send only what teaching needs: class, roll number, game results. No name, phone, email, photo, school, address, location, device id or contacts. |
| **Children's data** | No account, no contact details, no tracking across apps, no ads, no profiling for anything but teaching this class. Names of minors never reach a server. |
| **Purpose limitation** | Data is used only to show a class's learning to its own teacher. The sign-up asks facilitators to confirm teaching-only use. |
| **Storage limitation** | Progress older than 400 days is purged nightly (`purge_old_progress`). Deleting a class deletes all its progress (cascade) and the class list on that device. |
| **Security safeguards** | Row-level security (facilitators read only their classes; students cannot read at all); writes only through `submit_progress()`, which allow-lists fields, requires a 4-digit roll number or none, caps size at 4 KB, and rate-limits each student to one update per 2 minutes. |
| **Erasure** | Teachers can delete a student's progress or a whole class at any time; students can delete their own game on their phone. |
| **Small groups** | Language and persona breakdowns hide any group under 5 students. |
| **Data location** | Create the Supabase project in **Mumbai (ap-south-1)** so data stays in India. |
| **No third parties** | No analytics, trackers or third-party scripts in the app. |
| **Educate, never advise** | Every screen, card, slide and report says the money is made up and nothing recommends an investment. |

## Safeguards in code

- `supabase/schema.sql` → `submit_progress()`: field allow-list, `roll` must be `null` or match `^[0-9]{4}$`, 4 KB cap, rate limit.
- `src/ngo/summary.ts` → `buildSummary` never reads the save-slot name or alias (tested); `parseSummary` range-checks every field.
- `src/ngo/cloud.ts` → summaries are re-validated before sending and again when read back.
- `src/ngo/roster.ts` and `src/ngo/store.ts` → the class list is persisted only to `localStorage`, never sent; CSV exports
  (`studentsCsv`) contain roll numbers, never names.
- CSV exports neutralise cells starting with `=`, `+`, `-` or `@` (spreadsheet formula injection).

## Student to teacher, live

- **Starting a game:** the student types their name (kept on the phone as the save's name, never sent), their roll number, and
  optionally the class code. The code is checked with `class_name()`, which returns only the class name, so the student sees they
  joined the right class.
- **Sharing:** Profile → My teacher → *Share progress with my teacher*, or automatically after every finished game (a switch the
  student can turn off). Each share is one call to `submit_progress()` with the anonymous summary.
- **Dashboard:** the `progress` table is in the Supabase realtime publication, so a signed-in teacher's dashboard reloads the
  moment a student shares and shows who it was (name from the on-device class list). Realtime applies the same row-level security:
  a teacher only hears about their own classes.

## Connecting the database (about 10 minutes)

1. Create a free project at supabase.com in the **Mumbai (ap-south-1)** region.
2. Open **SQL editor**, paste `supabase/schema.sql`, press **Run**. Re-run it whenever it changes (it is safe to re-run).
3. Optional: **Database → Extensions → pg_cron**, then run the schema again to schedule the 400-day purge.
4. **Authentication → URL Configuration:** set the Site URL to where the app is hosted.
5. Put **Project URL** and the **anon / publishable key** (Project Settings → API Keys) in `.env.local`:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_...
   ```
6. Restart `npm run dev`. `/ngo` shows the sign-in page; students get **Send to my teacher** under Share progress.

Without these variables the dashboard runs in **device-only mode**: no sign-in, data stays in the browser, progress arrives as
pasted codes. The made-up demo class (with a made-up class list) works in both modes.
