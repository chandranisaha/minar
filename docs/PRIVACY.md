# Minar Insights: privacy, PII and setup

Minar's users are Grade 11 and 12 students, mostly under 18, from underserved communities in Hyderabad. The design goal is that
**no personal data about a student ever leaves their phone**, while teachers and NGOs still see how each class is learning.

## Who signs in

| Person | Signs in? | Why |
| --- | --- | --- |
| Student | **No** | A student account would mean collecting an email or phone number from a minor. Under India's DPDP Act 2023 that needs verifiable parental consent (s.9), and it adds friction on shared, low-end phones. Students already have local save slots, and progress reaches the teacher through an anonymous class code. |
| Teacher / NGO facilitator | **Yes**, email and password (Supabase Auth) | Adults, acting for an organisation. Login protects the class view, and row-level security makes sure each facilitator sees only their own classes. |

## Data inventory

| Data | Where it lives | Who can see it | Personal data? |
| --- | --- | --- | --- |
| Game progress (places, skills, Happy score, language, avatar type, Lite mode) | Student's phone; a copy in the class's database rows when the student taps **Send to my teacher** | The class's facilitator | No identifiers. Pseudonymous at most |
| Student code (7 random characters) | Same as above | Same | A hash of a random install id, not linked to any identity |
| Class code | Same as above | Same | No |
| Student name, alias, avatar name | **Phone only.** Never in a summary (tested in `src/ngo/ngo.test.ts`) | Nobody else | Not collected |
| Names a teacher types against student codes | **Teacher's browser only** (`localStorage`) | That teacher, on that device | Yes, so it never leaves the device and is never uploaded |
| Facilitator email, password hash, organisation name | Supabase Auth | Supabase project owner | Yes (adult staff), minimal |

## Safeguards in code

- **Allow-listed summary:** `submit_progress()` (in `supabase/schema.sql`) accepts only the known anonymous fields, rejects anything
  else (for example a name), caps the size at 4 KB, and rate-limits each student code to one update every 2 minutes.
- **Range-checked twice:** the phone re-validates the summary before sending (`parseSummary`), and the dashboard parses every row
  again when it reads it back (`rowToSummary`).
- **Row-level security:** facilitators can read or delete progress only in classes they own. Students (the `anon` role) have no
  read access at all and can insert only through the function.
- **Small-group suppression:** language and persona splits hide any group under 5 students (`K_MIN`), so nobody can be singled out.
- **No trackers:** no analytics, ads or third-party scripts; no location, contacts, camera or device fingerprinting.
- **Right to erase:** facilitators can delete a student's data or a whole class (cascades to every progress row). Students keep their
  own game on their phone and can delete it there.
- **Retention:** progress older than 400 days is purged nightly (`purge_old_progress`, via pg_cron).
- **Spreadsheet safety:** CSV exports neutralise cells that start with `=`, `+`, `-` or `@` (formula injection).
- **Separate storage:** the facilitator's session and desk data use `mm-slots-*` keys so a student's save slots on a shared device
  never capture or restore them.
- **Educate, never advise:** every screen, card and report says the money is made up and nothing recommends an investment.

## Connecting the database (about 10 minutes)

1. Create a free project at supabase.com. Choose the **Mumbai (ap-south-1)** region so data stays in India.
2. Open **SQL editor**, paste `supabase/schema.sql`, and press **Run**.
3. Optional: under **Database > Extensions**, enable `pg_cron`, then run the schema again to schedule the 400-day purge.
4. Under **Authentication > Providers > Email**, keep email confirmation on. Set the site URL to where the app is hosted.
5. Copy **Project URL** and the **anon public key** from **Project Settings > API** into `.env.local`:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
6. Restart `npm run dev`. `/ngo` now shows the sign-in page, and students get a **Send to my teacher** button under Share progress.

Without these variables the dashboard runs in **device-only mode**: no sign-in, data stays in the browser, and progress arrives as
pasted codes. The made-up demo class works in both modes.
