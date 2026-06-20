# Spec 002 — Full-Text Search

## Problem / Motivation

ThreadHive has no way to find a specific thread without manually browsing the feed or a subreddit. As the number of threads grows, discovery becomes increasingly difficult. This feature adds a search input to the header that lets any logged-in user search thread titles and content by keyword and navigate directly to a matching thread.

---

## User Stories

1. As a logged-in user, I can type a keyword into the header search bar and see a list of matching threads.
2. As a logged-in user, I can click a search result to navigate to that thread's page.
3. As a logged-in user, searching with no keyword or only whitespace returns no results (not an error).
4. As a logged-in user, if no threads match my query I see an empty-state message.
5. As an unauthenticated visitor, the search bar is not shown and the search API returns `401`.

---

## Acceptance Criteria

1. `GET /api/search?q=<query>` returns `200` and an array of threads whose `title` or `content` matches the query (case-insensitive, partial-word matches accepted).
2. Results are returned sorted by MongoDB text-score relevance (most relevant first).
3. Each result includes `_id`, `title`, `content`, `voteCount`, `createdAt`, `author.name`, and `subreddit.name`.
4. A query that matches no threads returns `200` with `"data": []`.
5. A request with a missing or blank `q` parameter returns `400`.
6. The endpoint returns `401` when called without a valid JWT.
7. The search input appears in the header **only when the user is authenticated** (i.e. `token` is present in Redux state).
8. Typing in the search input dispatches the search thunk; results update without a full page navigation.
9. Results are displayed in a dropdown below the search bar (not on a separate route).
10. Clicking a result navigates to `/thread/:threadId` and closes the dropdown.
11. Pressing `Escape` or clicking outside the dropdown closes it without navigating.
12. While a search is in-flight the results area shows a loading indicator.
13. The search input is debounced — the API is not called on every keystroke (minimum 300 ms debounce).

---

## API Contract

### GET `/api/search?q=<query>`
Search threads by full-text match.

**Auth:** Bearer token required  
**Query params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `q` | string | yes | Search query (1–200 characters) |

**Success response `200`:**
```json
{
  "success": true,
  "message": "Search results fetched successfully",
  "data": [
    {
      "_id": "<threadId>",
      "title": "...",
      "content": "...",
      "voteCount": 5,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "author":    { "_id": "...", "name": "Alice" },
      "subreddit": { "_id": "...", "name": "webdev" }
    }
  ]
}
```

Empty result set returns `200` with `"data": []`.

**Error responses:**

| Status | Condition |
|--------|-----------|
| 400 | `q` is missing, empty, or whitespace-only |
| 401 | Missing or invalid JWT |

---

## Data Model Changes

### `src/models/Thread.js`
Add a MongoDB compound text index after the schema definition:

```js
ThreadSchema.index({ title: 'text', content: 'text' });
```

No new fields are added to the document. No migration is needed — MongoDB builds the index asynchronously on the existing collection when the application starts.

> **Note:** A collection can have only one text index. If a text index is added later for another feature, these fields must be merged into it.

---

## UI Changes

### Backend (new files)

| File | Purpose |
|------|---------|
| `src/services/searchService.js` | `searchThreads(query)` — runs `$text` query, populates author + subreddit |
| `src/controllers/searchController.js` | Validates `q`, calls service, returns response |
| `src/routes/search.js` | `GET /` with `authHandler` |

Mount in `src/app.js`:
```js
import searchRoutes from './routes/search.js';
app.use('/api/search', searchRoutes);
```

### Frontend (new files)

| File | Purpose |
|------|---------|
| `src/services/searchService.js` | Axios `GET /search?q=` call |
| `src/reducers/searchSlice.js` | RTK slice: `results`, `loading`, `error`, `query` + `searchThreadsThunk` |

Register in `src/store/store.js`:
```js
import searchReducer from '../reducers/searchSlice';
// add to reducer map:
search: searchReducer,
```

Add to `src/config/apiConfig.js`:
```js
export const SEARCH_API = {
  SEARCH: '/search',
};
```

### Existing files modified

**`src/components/Header/Header.jsx`**
- Add a search input (Bootstrap `Form.Control`) between the logo and the right-side buttons, visible only when `token` is set.
- Maintain local state for the input value; debounce dispatch of `searchThreadsThunk` by 300 ms.
- Maintain local state for dropdown open/closed.
- Render a `SearchDropdown` component below the input when the dropdown is open.

**New component: `src/components/Header/SearchDropdown.jsx`**
- Reads `state.search.results`, `state.search.loading`, `state.search.error` from Redux.
- Renders a loading spinner, empty-state message, or result list.
- Each result row shows `thread.title` and `r/subreddit.name`; clicking navigates to `/thread/:threadId` via `useNavigate` and calls an `onClose` prop to close the dropdown.

---

## Edge Cases & Error Handling

| Scenario | Expected behaviour |
|----------|--------------------|
| Query is blank / whitespace only | `400` from the API; frontend prevents dispatch if trimmed value is empty |
| Query has no matches | `200` with `[]`; dropdown shows "No results found for …" |
| Query is extremely long (>200 chars) | Backend rejects with `400`; frontend caps input at 200 characters via `maxLength` |
| Special regex characters in query (`$`, `.`, etc.) | MongoDB `$text` treats the input as a phrase, not a regex — safe by default |
| User clears the input | Dropdown closes and Redux `results` is reset to `[]` |
| Network error during search | `error` set in slice; dropdown shows "Search failed, please try again" |
| User navigates away while search is in-flight | Component unmounts; the resolved thunk still updates the store but the dropdown is no longer rendered — no action needed |
| Two rapid searches (first resolves after second) | Debounce prevents this; if it occurs the last dispatched thunk's result wins |

---

## Out of Scope

- Searching comments.
- Filtering results by subreddit, author, or date range.
- Search history / recent searches.
- Highlighted keyword matches in results.
- Pagination of search results.
- Unauthenticated search (public API).
- A dedicated `/search` results page (dropdown only for this iteration).

---

## Test Plan

### Backend integration tests — `tests/integration/search.test.js`

| # | Test | Assertion |
|---|------|-----------|
| 1 | `GET /api/search?q=matching-word` — authenticated | `200`, array contains threads with that word in title or content |
| 2 | `GET /api/search?q=no-match-xyz` — authenticated | `200`, empty array |
| 3 | `GET /api/search?q=` (blank) — authenticated | `400` |
| 4 | `GET /api/search` (no `q` param) — authenticated | `400` |
| 5 | `GET /api/search?q=word` — unauthenticated | `401` |
| 6 | Results contain populated `author.name` and `subreddit.name` | field present on each result object |
| 7 | Results are sorted by relevance (highest-scoring thread first) | first result's title contains the exact query word |

### Frontend unit tests

| # | Test | Assertion |
|---|------|-----------|
| 1 | `searchSlice` — `searchThreads.pending` | `loading: true`, `results: []` |
| 2 | `searchSlice` — `searchThreads.fulfilled` | `loading: false`, `results` populated |
| 3 | `searchSlice` — `searchThreads.rejected` | `loading: false`, `error` set |
| 4 | `Header` — search input hidden when unauthenticated | input not in DOM when `token` is null |
| 5 | `Header` — search input visible when authenticated | input rendered when `token` is set |
| 6 | `SearchDropdown` — loading state | spinner rendered when `loading: true` |
| 7 | `SearchDropdown` — empty state | "No results" message when `results: []` and not loading |
| 8 | `SearchDropdown` — result click | `navigate` called with `/thread/:id` |
