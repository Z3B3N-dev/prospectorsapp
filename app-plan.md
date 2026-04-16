## Plan (English) — Points 3, 4, and 5

### 3) Data access layer (reading from Supabase)
**Goal:** Define the exact queries needed for the Contacts list + Professional Family filter, and structure them cleanly for Next.js (App Router).

#### 3.1 Define required data
- **Contacts**: `id, name, position, phone, email, enterprise_id`
- **Enterprise (company name)**: `enterprises.id, enterprises.name` (joined from `contacts.enterprise_id`)
- **Professional Families catalog** (for the filter UI): `professional_family.id, code, name`
- **Contact ↔ Family links**: `contacts_professional_families.contact_id, professional_family_id` (+ optional join to family for labels)

#### 3.2 Create query functions (server-side)
Create a small data-access module:
- `lib/data/professionalFamilies.ts`
  - `getProfessionalFamilies()` → fetch all families ordered by code
- `lib/data/contacts.ts`
  - `getContacts({ familyIds?: string[] })` → returns contacts joined with enterprise
  - (optional) `getContactFamilies(contactIds: string[])` → returns family labels per contact for chips/badges

#### 3.3 Queries
- Load families for the filter:
  - `select id, code, name from professional_family order by code`
- Fetch contacts (no filter):
  - `select id,name,position,phone,email, enterprise:enterprises(id,name)`
  - apply `.eq('is_deleted', false)` + order by name
- Fetch contacts filtered by family (ANY match):
  - **Step 1:** get `contact_id`s from `contacts_professional_families`
    - filter: `professional_family_id in (...)`
  - **Step 2:** fetch contacts where `id in (contactIds)` + join enterprise

#### 3.4 Error handling
- Standardize return types:
  - `{ data, error }` or throw typed errors
- Handle edge cases:
  - No family selected → show all contacts
  - Family selected but no matches → show empty state (not an error)

---

### 4) UI for `/contacts` (Pages + components)
**Goal:** Build the `/contacts` page that renders fast, is filterable, and keeps state in the URL.

#### 4.1 Page structure
- Route: `/contacts`
- Server Component page that reads:
  - `searchParams.family` (single) or `searchParams.families` (comma-separated for multi)
- Fetch:
  - `families` for filter options
  - `contacts` based on active filter
  - (optional) `contactFamiliesMap` for chips

#### 4.2 Components
- `ContactsFilters`
  - Professional Family dropdown (start with single-select)
  - “Clear filter” button
  - Writes filter into URL query params using `router.push()`
- `ContactsTable` (or `ContactsList`)
  - Columns: Contact name, Position, Enterprise name, Phone, Email
  - Optional “Families” column with chips
- `EmptyState`
  - No contacts yet / No results for this filter

#### 4.3 URL-driven state
- Single-select:
  - `/contacts?family=<family_uuid>`
- Multi-select (future-ready):
  - `/contacts?families=<uuid1>,<uuid2>`
This makes the UI shareable and refresh-safe.

#### 4.4 UX basics
- Show “Active filter” label (family name)
- Provide clear removal/reset
- Loading state if you later add client-side transitions

---

### 5) Implement the Professional Family filter (backend logic + wiring)
**Goal:** Make filtering correct, performant, and simple to extend to multi-select later.

#### 5.1 Start with “ANY of these families” logic
For MVP, treat the filter as OR:
- A contact is shown if it belongs to **at least one** selected family.

#### 5.2 Two-step query approach (recommended for clarity)
1) Query the join table to get contact IDs:
   - `contacts_professional_families`
   - filter: `.eq('professional_family_id', familyId)` (single)
   - or `.in('professional_family_id', familyIds)` (multi)
2) Fetch contacts by IDs:
   - `contacts`
   - `.in('id', contactIds)`
   - join enterprise: `enterprise:enterprises(id,name)`
   - `.eq('is_deleted', false)`

#### 5.3 Handle empty ID lists
- If step 1 returns 0 IDs:
  - return `[]` contacts immediately (avoid `.in()` with empty array)

#### 5.4 Optional: show family chips per contact
After fetching the contacts:
- Query `contacts_professional_families` for those `contactIds`
- Join to `professional_family` to display `code/name`
- Build a `Map<contactId, Family[]>` for rendering chips

#### 5.5 Performance notes (lightweight)
- Ensure indexes exist:
  - `contacts_professional_families (professional_family_id)`
  - `contacts_professional_families (contact_id)`
- Limit + pagination (optional next step):
  - Start with `limit 50` + simple pagination if needed

#### 5.6 Definition of Done
- `/contacts` renders a list of contacts
- Selecting a family updates the URL and results
- Clear filter returns to full list
- Empty results state works correctly