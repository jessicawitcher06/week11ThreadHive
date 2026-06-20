# Implementation Plan — 001 Bookmarks

Spec: `specs/001-bookmarks.md`  
Order: model → service → controller → route → backend tests → Redux slice → frontend service → components → wire-up → frontend tests

---

## Task 1 — Update the User model

**File:** `threadhive-backend/src/models/User.js`

Add `savedThreads` to `UserSchema` before the closing brace of the schema definition:

```
savedThreads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Thread' }]
```

No default needed — Mongoose returns `[]` for missing arrays automatically.

---

## Task 2 — Create the bookmark service

**File (new):** `threadhive-backend/src/services/bookmarkService.js`

Three exported async functions:

| Function | Logic |
|----------|-------|
| `saveThread(userId, threadId)` | Verify thread exists (throw `createAppError(404)` if not). Use `$addToSet` on `User.savedThreads` to add `threadId` (idempotent by design). Return the updated `savedThreads` array. |
| `unsaveThread(userId, threadId)` | Verify thread exists (throw `createAppError(404)` if not). Check that `threadId` is currently in `savedThreads` — throw `createAppError('Thread not in saved list', 404)` if not. Use `$pull` to remove it. Return the updated `savedThreads` array. |
| `getSavedThreads(userId)` | Find the user, populate `savedThreads` with `title content voteCount createdAt` and nested `author` (`name`) and `subreddit` (`name`). Filter out any null entries (stale refs from deleted threads). Return the populated array. |

---

## Task 3 — Create the bookmark controller

**File (new):** `threadhive-backend/src/controllers/bookmarkController.js`

Three thin exported async functions that extract params from `req` and delegate to the service:

| Function | Calls | Response |
|----------|-------|----------|
| `saveBookmark(req, res)` | `saveThread(req.user.userId, req.params.threadId)` | `200 { success, message: 'Thread saved successfully', data: { savedThreads } }` |
| `unsaveBookmark(req, res)` | `unsaveThread(req.user.userId, req.params.threadId)` | `200 { success, message: 'Thread unsaved successfully', data: { savedThreads } }` |
| `getBookmarks(req, res)` | `getSavedThreads(req.user.userId)` | `200 { success, message: 'Saved threads fetched successfully', data: threads }` |

---

## Task 4 — Create the bookmark route

**File (new):** `threadhive-backend/src/routes/bookmarks.js`

```
POST   /          authHandler → saveBookmark
DELETE /:threadId authHandler → unsaveBookmark
GET    /          authHandler → getBookmarks
```

Note: `POST` and `DELETE` use `/:threadId`; `GET` has no param.

---

## Task 5 — Mount the route in app.js

**File (edit):** `threadhive-backend/src/app.js`

Add import and `app.use` alongside the other route mounts:
```js
import bookmarkRoutes from './routes/bookmarks.js';
app.use('/api/bookmarks', bookmarkRoutes);
```

---

## Task 6 — Backend integration tests

**File (new):** `threadhive-backend/tests/integration/bookmark.test.js`

Use the same pattern as existing tests (`supertest(app)`, seed a user + thread in `beforeAll`, authenticate to get a token).

Tests to write (10 total — see spec test plan):
1. `POST` save — authenticated → `200`, thread in `savedThreads`
2. `POST` save — duplicate → `200`, no duplicate in array
3. `POST` save — unauthenticated → `401`
4. `POST` save — thread not found → `404`
5. `DELETE` unsave — authenticated → `200`, thread removed
6. `DELETE` unsave — not in list → `404`
7. `DELETE` unsave — unauthenticated → `401`
8. `GET` bookmarks — authenticated, threads saved → `200`, populated array
9. `GET` bookmarks — authenticated, none saved → `200`, empty array
10. `GET` bookmarks — unauthenticated → `401`

---

## Task 7 — Add API endpoint constants (frontend)

**File (edit):** `threadhive-frontend/src/config/apiConfig.js`

Add:
```js
export const BOOKMARK_API = {
  SAVE:    (id) => `/bookmarks/${id}`,
  UNSAVE:  (id) => `/bookmarks/${id}`,
  GET_ALL: '/bookmarks',
};
```

---

## Task 8 — Create the frontend bookmark service

**File (new):** `threadhive-frontend/src/services/bookmarkService.js`

Three exported async functions using `axiosInstance` and `getAuthHeaders()` (same pattern as `threadService.js`):

| Function | Method | Endpoint | Returns |
|----------|--------|----------|---------|
| `saveThread(threadId)` | `POST` | `BOOKMARK_API.SAVE(threadId)` | `res.data.data.savedThreads` |
| `unsaveThread(threadId)` | `DELETE` | `BOOKMARK_API.UNSAVE(threadId)` | `res.data.data.savedThreads` |
| `fetchSavedThreads()` | `GET` | `BOOKMARK_API.GET_ALL` | `res.data.data` |

---

## Task 9 — Create the Redux bookmark slice

**File (new):** `threadhive-frontend/src/reducers/bookmarkSlice.js`

State shape:
```js
{
  savedThreadIds: [],   // array of string thread IDs — for fast O(1) lookup in UI
  savedThreads: [],     // populated thread objects — for the Profile Saved tab
  loading: false,
  error: null,
}
```

Three async thunks:
| Thunk | Calls | On fulfilled |
|-------|-------|--------------|
| `saveThreadThunk(threadId)` | `saveThread(threadId)` | Replace `savedThreadIds` with returned array |
| `unsaveThreadThunk(threadId)` | `unsaveThread(threadId)` | Replace `savedThreadIds` with returned array |
| `fetchSavedThreadsThunk()` | `fetchSavedThreads()` | Set `savedThreads` and derive `savedThreadIds` from `thread._id` |

Optimistic update pattern for save/unsave:
- In the component, add/remove the ID from local state immediately before dispatching the thunk.
- On `rejected`, roll back by re-fetching or reverting local state.

---

## Task 10 — Register the slice in the Redux store

**File (edit):** `threadhive-frontend/src/store/store.js`

```js
import bookmarkReducer from '../reducers/bookmarkSlice';
// add to configureStore reducer map:
bookmarks: bookmarkReducer,
```

---

## Task 11 — Add bookmark button to ThreadList

**File (edit):** `threadhive-frontend/src/components/ThreadList/ThreadList.jsx`

- Import `useSelector`, `useDispatch`, `saveThreadThunk`, `unsaveThreadThunk` from the bookmark slice.
- Read `savedThreadIds` from `state.bookmarks.savedThreadIds`.
- For each thread, render a bookmark toggle button:
  - Icon: `bi-bookmark-fill` (saved) vs `bi-bookmark` (unsaved) from Bootstrap Icons.
  - `onClick`: dispatch `saveThreadThunk` or `unsaveThreadThunk` depending on current state.
- Position the button in the `thread-content-section` alongside the "View Comments" link.

---

## Task 12 — Add bookmark button to ThreadCard

**File (edit):** `threadhive-frontend/src/components/ThreadList/ThreadCard.jsx`

Same bookmark toggle button as Task 11, placed in the action row alongside the "Generate Summary" button.

---

## Task 13 — Add Saved tab to Profile

**File (edit):** `threadhive-frontend/src/pages/User/Profile.jsx`

- Add local state `activeTab` (`'profile'` | `'saved'`), default `'profile'`.
- Render two Bootstrap `Nav` tabs: "Profile" and "Saved".
- When `activeTab === 'saved'`:
  - Dispatch `fetchSavedThreadsThunk` on first activation (guard with `useEffect` + a `loaded` flag).
  - If `loading`: show a spinner.
  - If `savedThreads.length === 0`: show `"No saved threads yet."` empty-state.
  - Otherwise: render `<ThreadList threadsToDisplay={savedThreads} />`.
- When `activeTab === 'profile'`: render the existing profile form/view (no change to that logic).

---

## Task 14 — Frontend unit tests

**File (new):** `threadhive-frontend/tests/unit/reducers/bookmarkSlice.test.js`
- `saveThread.fulfilled` → `savedThreadIds` includes new id
- `unsaveThread.fulfilled` → `savedThreadIds` excludes removed id
- `fetchSavedThreads.fulfilled` → `savedThreads` populated, `savedThreadIds` derived

**File (edit):** `threadhive-frontend/tests/unit/components/ThreadList.test.jsx` *(or new file)*
- Thread in saved list → bookmark icon has `bi-bookmark-fill` class
- Thread not in saved list → bookmark icon has `bi-bookmark` class

**File (edit):** `threadhive-frontend/tests/unit/pages/Profile.test.jsx` *(or new file)*
- Saved tab with no bookmarks → empty-state message rendered
- Saved tab with bookmarks → `ThreadList` rendered with correct props

---

## Task Checklist

### Backend
- [ ] **Task 1** — Add `savedThreads` field to `src/models/User.js`
- [ ] **Task 2** — Create `src/services/bookmarkService.js` (`saveThread`, `unsaveThread`, `getSavedThreads`)
- [ ] **Task 3** — Create `src/controllers/bookmarkController.js` (`saveBookmark`, `unsaveBookmark`, `getBookmarks`)
- [ ] **Task 4** — Create `src/routes/bookmarks.js` (POST, DELETE, GET with `authHandler`)
- [ ] **Task 5** — Mount bookmark route in `src/app.js`
- [ ] **Task 6** — Write `tests/integration/bookmark.test.js` (10 tests)

### Frontend
- [ ] **Task 7** — Add `BOOKMARK_API` constants to `src/config/apiConfig.js`
- [ ] **Task 8** — Create `src/services/bookmarkService.js` (axios calls)
- [ ] **Task 9** — Create `src/reducers/bookmarkSlice.js` (slice + 3 thunks)
- [ ] **Task 10** — Register `bookmarks` reducer in `src/store/store.js`
- [ ] **Task 11** — Add bookmark toggle button to `src/components/ThreadList/ThreadList.jsx`
- [ ] **Task 12** — Add bookmark toggle button to `src/components/ThreadList/ThreadCard.jsx`
- [ ] **Task 13** — Add "Saved" tab to `src/pages/User/Profile.jsx`
- [ ] **Task 14** — Write frontend unit tests (slice + ThreadList + Profile)
