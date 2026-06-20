# Spec 001 — Saved Threads (Bookmarks)

## Problem / Motivation

ThreadHive users currently have no way to save threads they want to return to. Once a thread scrolls off the home feed there is no way to find it again without manually browsing subreddits. This feature lets logged-in users bookmark any thread and access their saved list from their profile, increasing return visits and session depth.

---

## User Stories

1. As a logged-in user, I can click a bookmark icon on any thread so that I can save it for later.
2. As a logged-in user, clicking the bookmark icon on an already-saved thread unsaves it.
3. As a logged-in user, I can visit my profile and see a "Saved" tab that lists all my bookmarked threads.
4. As a logged-in user, I can click a saved thread from my profile to navigate to that thread's page.
5. As an unauthenticated visitor, I cannot access the bookmarks API and the bookmark UI is not shown.

---

## Acceptance Criteria

1. `POST /api/bookmarks/:threadId` returns `200` and adds the thread to the user's saved list.
2. Saving a thread that is already saved is **idempotent** — the second `POST` returns `200` without duplicating the entry.
3. `DELETE /api/bookmarks/:threadId` returns `200` and removes the thread from the saved list.
4. Deleting a bookmark for a thread that was never saved returns `404`.
5. `GET /api/bookmarks` returns `200` and an array of the user's saved threads, each populated with `title`, `content`, `author.name`, `subreddit.name`, `voteCount`, and `createdAt`.
6. All three endpoints return `401` when called without a valid JWT.
7. All three endpoints return `404` when `:threadId` does not exist in the database.
8. The bookmark icon in `ThreadList` and `ThreadCard` reflects the current saved state (filled vs. outlined) for the authenticated user.
9. Toggling the bookmark icon updates the UI **optimistically** — no full-page reload required.
10. The "Saved" tab on the profile page renders the user's bookmarked threads using the same `ThreadList` component used on the home page.
11. When a user has no saved threads the "Saved" tab shows an empty-state message.
12. Deleting a thread that has been bookmarked removes it from all users' `savedThreads` arrays (referential cleanup). *(Can be deferred; see Out of Scope.)*

---

## API Contract

### POST `/api/bookmarks/:threadId`
Save a thread.

**Auth:** Bearer token required  
**URL params:** `threadId` — a valid MongoDB ObjectId

**Success response `200`:**
```json
{
  "success": true,
  "message": "Thread saved successfully",
  "data": { "savedThreads": ["<threadId>", "..."] }
}
```

**Error responses:**
| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid JWT |
| 404 | `threadId` does not exist |

---

### DELETE `/api/bookmarks/:threadId`
Unsave a thread.

**Auth:** Bearer token required  
**URL params:** `threadId` — a valid MongoDB ObjectId

**Success response `200`:**
```json
{
  "success": true,
  "message": "Thread unsaved successfully",
  "data": { "savedThreads": ["<remaining threadIds>"] }
}
```

**Error responses:**
| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid JWT |
| 404 | `threadId` does not exist, or thread was not in the user's saved list |

---

### GET `/api/bookmarks`
Retrieve the current user's saved threads.

**Auth:** Bearer token required

**Success response `200`:**
```json
{
  "success": true,
  "message": "Saved threads fetched successfully",
  "data": [
    {
      "_id": "<threadId>",
      "title": "...",
      "content": "...",
      "voteCount": 12,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "author": { "_id": "...", "name": "Alice" },
      "subreddit": { "_id": "...", "name": "webdev" }
    }
  ]
}
```

Empty list returns `200` with `"data": []`.

**Error responses:**
| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid JWT |

---

## Data Model Changes

### `src/models/User.js`
Add one field to `UserSchema`:

```js
savedThreads: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Thread',
    default: [],
  }
]
```

No new collection. No migration required — Mongoose treats a missing array field as `[]` for existing documents.

---

## UI Changes

### Backend (new files)
| File | Purpose |
|------|---------|
| `src/services/bookmarkService.js` | `saveThread`, `unsaveThread`, `getSavedThreads` |
| `src/controllers/bookmarkController.js` | Thin handlers calling the service |
| `src/routes/bookmarks.js` | Mounts all three routes with `authHandler` |

Mount in `src/app.js`:
```js
import bookmarkRoutes from './routes/bookmarks.js';
app.use('/api/bookmarks', bookmarkRoutes);
```

### Frontend (new files)
| File | Purpose |
|------|---------|
| `src/services/bookmarkService.js` | Axios calls for save, unsave, fetch |
| `src/reducers/bookmarkSlice.js` | RTK slice: `savedThreadIds` array + async thunks |

Register in `src/store/store.js`:
```js
import bookmarkReducer from '../reducers/bookmarkSlice';
// add to reducer map:
bookmarks: bookmarkReducer,
```

Add endpoint constants to `src/config/apiConfig.js`:
```js
export const BOOKMARK_API = {
  SAVE:   (id) => `/bookmarks/${id}`,
  UNSAVE: (id) => `/bookmarks/${id}`,
  GET_ALL: '/bookmarks',
};
```

### Existing files modified

**`src/components/ThreadList/ThreadList.jsx`**
- Add a bookmark toggle button (bookmark icon) to each thread row.
- Button reads `state.bookmarks.savedThreadIds` to determine filled vs. outlined state.
- On click, dispatches `saveThreadThunk` or `unsaveThreadThunk`.

**`src/components/ThreadList/ThreadCard.jsx`** (single-thread view)
- Add the same bookmark toggle button alongside the existing action buttons.

**`src/pages/User/Profile.jsx`**
- Add a "Saved" tab (Bootstrap `Nav.Item`) alongside the profile details.
- On tab activation, dispatch `fetchSavedThreadsThunk` if not already loaded.
- Render saved threads using the existing `ThreadList` component.
- Show empty-state copy ("No saved threads yet.") when the list is empty.

---

## Edge Cases & Error Handling

| Scenario | Expected behaviour |
|----------|--------------------|
| User saves the same thread twice | Second save is a no-op; returns `200` without duplicating the ObjectId in the array |
| User unsaves a thread they never saved | Returns `404` with `"Thread not in saved list"` |
| `threadId` is a malformed ObjectId | Mongoose cast error → caught by `errorHandler` → `400` |
| Thread is deleted after being bookmarked | `GET /api/bookmarks` populates and silently drops null references; front end skips rendering null items |
| User is not authenticated | `authHandler` returns `401` before the controller runs |
| Network error while toggling bookmark | Optimistic UI update is rolled back; show a toast/alert |

---

## Out of Scope

- Real-time badge/count of how many users saved a thread.
- Sorting or filtering the saved threads list.
- Sharing a saved thread list publicly.
- Automatic cleanup of `savedThreads` when a thread is deleted (tracked as a future enhancement; the `GET /api/bookmarks` endpoint handles stale refs gracefully by dropping nulls).
- Pagination of the saved threads list.

---

## Test Plan

### Backend integration tests — `tests/integration/bookmark.test.js`

| # | Test | Assertion |
|---|------|-----------|
| 1 | `POST /api/bookmarks/:threadId` — authenticated | `200`, thread appears in user's `savedThreads` |
| 2 | `POST /api/bookmarks/:threadId` — duplicate save | `200`, no duplicate in array |
| 3 | `POST /api/bookmarks/:threadId` — unauthenticated | `401` |
| 4 | `POST /api/bookmarks/:threadId` — thread not found | `404` |
| 5 | `DELETE /api/bookmarks/:threadId` — authenticated | `200`, thread removed from `savedThreads` |
| 6 | `DELETE /api/bookmarks/:threadId` — not in list | `404` |
| 7 | `DELETE /api/bookmarks/:threadId` — unauthenticated | `401` |
| 8 | `GET /api/bookmarks` — authenticated, threads saved | `200`, populated thread array |
| 9 | `GET /api/bookmarks` — authenticated, none saved | `200`, empty array |
| 10 | `GET /api/bookmarks` — unauthenticated | `401` |

### Frontend unit tests

| # | Test | Assertion |
|---|------|-----------|
| 1 | `bookmarkSlice` — `saveThread.fulfilled` | `savedThreadIds` includes the new id |
| 2 | `bookmarkSlice` — `unsaveThread.fulfilled` | `savedThreadIds` excludes the removed id |
| 3 | `ThreadList` render — thread in saved list | Bookmark icon renders in filled state |
| 4 | `ThreadList` render — thread not in saved list | Bookmark icon renders in outlined state |
| 5 | `Profile` Saved tab — no bookmarks | Empty-state message rendered |
| 6 | `Profile` Saved tab — bookmarks present | `ThreadList` rendered with saved threads |
