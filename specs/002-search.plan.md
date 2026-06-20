# Implementation Plan — 002 Full-Text Search

Spec: `specs/002-search.md`  
Order: model → service → controller → route → backend tests → Redux slice → frontend service → component → wire-up → frontend tests

---

## Task 1 — Add text index to Thread model

**File (edit):** `threadhive-backend/src/models/Thread.js`

Add a compound text index after the schema definition, before the model export:

```
ThreadSchema.index({ title: 'text', content: 'text' });
```

No new document fields. MongoDB builds the index asynchronously on first app start. Only one text index is allowed per collection — if other features later need text search on Thread, merge their fields into this index.

---

## Task 2 — Create the search service

**File (new):** `threadhive-backend/src/services/searchService.js`

One exported async function:

| Function | Logic |
|----------|-------|
| `searchThreads(query)` | Run `Thread.find({ $text: { $search: query } }, { score: { $meta: 'textScore' } })`, sort by `{ score: { $meta: 'textScore' } }`, populate `author` (select `name`) and `subreddit` (select `name`), select `title content voteCount createdAt author subreddit`. Return the result array (may be empty). |

---

## Task 3 — Create the search controller

**File (new):** `threadhive-backend/src/controllers/searchController.js`

One exported async function:

| Function | Logic |
|----------|-------|
| `search(req, res)` | Extract `q` from `req.query`. If missing or `q.trim()` is empty, throw `createAppError('Search query is required', 400)`. If `q.length > 200`, throw `createAppError('Query too long', 400)`. Call `searchThreads(q.trim())`. Return `200 { success: true, message: 'Search results fetched successfully', data: results }`. |

---

## Task 4 — Create the search route

**File (new):** `threadhive-backend/src/routes/search.js`

```
GET /    authHandler → search
```

Single route, no URL params — query string only.

---

## Task 5 — Mount the route in app.js

**File (edit):** `threadhive-backend/src/app.js`

Add import and `app.use` alongside the other route mounts:
```js
import searchRoutes from './routes/search.js';
app.use('/api/search', searchRoutes);
```

---

## Task 6 — Backend integration tests

**File (new):** `threadhive-backend/tests/integration/search.test.js`

Use the same pattern as existing tests (`supertest(app)`, seed a user + subreddit + threads in `beforeAll`, authenticate to get a token).

Seed at least two threads — one whose title contains a known unique word (`"uniqueword123"`) and one that does not — to make relevance assertions reliable.

Tests to write (7 total — see spec test plan):

| # | Test | Assertion |
|---|------|-----------|
| 1 | `GET /api/search?q=uniqueword123` — authenticated | `200`, result array contains the seeded thread |
| 2 | `GET /api/search?q=zzznomatchzzz` — authenticated | `200`, empty array |
| 3 | `GET /api/search?q=` — authenticated | `400` |
| 4 | `GET /api/search` (no `q`) — authenticated | `400` |
| 5 | `GET /api/search?q=word` — unauthenticated | `401` |
| 6 | Populated fields present | `res.body.data[0].author.name` and `res.body.data[0].subreddit.name` are strings |
| 7 | Relevance sort | First result's title contains the exact query word |

---

## Task 7 — Add API endpoint constant (frontend)

**File (edit):** `threadhive-frontend/src/config/apiConfig.js`

Add:
```js
export const SEARCH_API = {
  SEARCH: '/search',
};
```

---

## Task 8 — Create the frontend search service

**File (new):** `threadhive-frontend/src/services/searchService.js`

One exported async function using `axiosInstance` and `getAuthHeaders()` (same pattern as `threadService.js`):

| Function | Method | Endpoint | Returns |
|----------|--------|----------|---------|
| `searchThreads(query)` | `GET` | `SEARCH_API.SEARCH + ?q=<query>` (pass via `params: { q: query }`) | `res.data.data` |

---

## Task 9 — Create the Redux search slice

**File (new):** `threadhive-frontend/src/reducers/searchSlice.js`

State shape:
```js
{
  results: [],
  query: '',
  loading: false,
  error: null,
}
```

One async thunk:

| Thunk | Calls | Behaviour |
|-------|-------|-----------|
| `searchThreadsThunk(query)` | `searchThreads(query)` | `pending`: set `loading: true`, `query: query`, clear `results` and `error`. `fulfilled`: set `loading: false`, `results`. `rejected`: set `loading: false`, `error`. |

One sync reducer:

| Reducer | Behaviour |
|---------|-----------|
| `clearSearch()` | Reset `results: []`, `query: ''`, `error: null` |

---

## Task 10 — Register the slice in the Redux store

**File (edit):** `threadhive-frontend/src/store/store.js`

```js
import searchReducer from '../reducers/searchSlice';
// add to configureStore reducer map:
search: searchReducer,
```

---

## Task 11 — Create the SearchDropdown component

**File (new):** `threadhive-frontend/src/components/Header/SearchDropdown.jsx`

Props: `onClose` (function called when a result is clicked or Escape is pressed)

Reads from Redux: `state.search.results`, `state.search.loading`, `state.search.error`, `state.search.query`

Render logic:
- `loading: true` → show Bootstrap spinner
- `error` set → show `"Search failed, please try again"`
- `results.length === 0` and not loading → show `"No results found for "<query>"."`
- Otherwise → render a list; each item shows `thread.title` and `r/thread.subreddit.name`; on click call `navigate('/thread/' + thread._id)` then `onClose()`

Position: absolutely positioned below the search input (CSS — `position: absolute`, `z-index` above header content, `min-width` matching the input).

---

## Task 12 — Wire search input and dropdown into Header

**File (edit):** `threadhive-frontend/src/components/Header/Header.jsx`

Changes:
- Add local state: `searchQuery` (string, default `''`), `dropdownOpen` (boolean, default `false`).
- Add `useDispatch` import; import `searchThreadsThunk`, `clearSearch` from `searchSlice`.
- Add a `useEffect` that debounces `searchQuery` by 300 ms:
  - If trimmed value is empty: dispatch `clearSearch()`, set `dropdownOpen: false`.
  - Otherwise: dispatch `searchThreadsThunk(trimmedValue)`, set `dropdownOpen: true`.
- Render the search input (Bootstrap `Form.Control`, `type="search"`, `maxLength={200}`) only when `token` is set, between the logo and right-side buttons.
- Render `<SearchDropdown onClose={() => setDropdownOpen(false)} />` when `dropdownOpen` is true.
- Add a `useEffect` to listen for `keydown` `Escape` → call `setDropdownOpen(false)` + `setSearchQuery('')` + dispatch `clearSearch()`.
- Wrap the search area in a `div` with `position: relative` so the dropdown positions correctly.
- Add a click-outside handler (`useRef` on the container + `mousedown` event listener) to close the dropdown when clicking elsewhere.

---

## Task 13 — Frontend unit tests

**File (new):** `threadhive-frontend/tests/unit/reducers/searchSlice.test.js`
- `searchThreads.pending` → `loading: true`, `results: []`
- `searchThreads.fulfilled` → `loading: false`, `results` populated
- `searchThreads.rejected` → `loading: false`, `error` set
- `clearSearch` action → state reset to initial

**File (new):** `threadhive-frontend/tests/unit/components/SearchDropdown.test.jsx`
- Loading state → spinner in DOM
- Empty results (not loading) → "No results" message in DOM
- Result click → `navigate` called with correct path

**File (edit):** `threadhive-frontend/tests/unit/components/Header.test.jsx` *(or new file)*
- `token` null → search input not in DOM
- `token` set → search input rendered

---

## Task Checklist

### Backend
- [ ] **Task 1** — Add text index to `src/models/Thread.js`
- [ ] **Task 2** — Create `src/services/searchService.js` (`searchThreads`)
- [ ] **Task 3** — Create `src/controllers/searchController.js` (`search`)
- [ ] **Task 4** — Create `src/routes/search.js` (GET `/` with `authHandler`)
- [ ] **Task 5** — Mount search route in `src/app.js`
- [ ] **Task 6** — Write `tests/integration/search.test.js` (7 tests)

### Frontend
- [ ] **Task 7** — Add `SEARCH_API` constant to `src/config/apiConfig.js`
- [ ] **Task 8** — Create `src/services/searchService.js` (axios call)
- [ ] **Task 9** — Create `src/reducers/searchSlice.js` (slice + thunk + `clearSearch`)
- [ ] **Task 10** — Register `search` reducer in `src/store/store.js`
- [ ] **Task 11** — Create `src/components/Header/SearchDropdown.jsx`
- [ ] **Task 12** — Wire search input + dropdown into `src/components/Header/Header.jsx`
- [ ] **Task 13** — Write frontend unit tests (slice + SearchDropdown + Header)
