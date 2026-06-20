# Epic: Discover & Engage

Five independent, full-stack features that help users find content they care about and return to it. Each is a self-contained vertical slice fitting the existing controller → service → model backend and Redux slice → service → component frontend pattern.

---

## Feature 1 — Saved Threads (Bookmarks)

**Value proposition:** Let a logged-in user save any thread for later and view their saved list on their profile.

### Data-model changes
`src/models/User.js` — add one field:
```js
savedThreads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Thread' }]
```
No new collection required.

### Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/bookmarks/:threadId` | required | Save a thread (idempotent) |
| DELETE | `/api/bookmarks/:threadId` | required | Unsave a thread |
| GET | `/api/bookmarks` | required | List the user's saved threads (populated) |

### Frontend touch points
- Bookmark icon button on `ThreadCard` (filled/outlined based on saved state)
- `bookmarkSlice.js` reducer + `bookmarkService.js` API calls
- "Saved" tab on `Profile.jsx`

### Complexity
**Low–Medium.** All new files except the one-field addition to `User.js`. No schema migration risk.

---

## Feature 2 — Full-Text Search

**Value proposition:** Let users search thread titles and content from a header search bar and jump directly to results.

### Data-model changes
`src/models/Thread.js` — add a MongoDB text index:
```js
ThreadSchema.index({ title: 'text', content: 'text' });
```
No new fields on the document.

### Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/search?q=<query>` | required | Full-text search; returns matched threads with author + subreddit populated |

### Frontend touch points
- Search input in `Header.jsx`
- `searchSlice.js` reducer + `searchService.js` API calls
- Search results rendered inline (dropdown) or on a dedicated `/search` route

### Complexity
**Low–Medium.** MongoDB's `$text` operator handles ranking. The only backend risk is ensuring the index is created before the first query.

---

## Feature 3 — Trending Feed

**Value proposition:** Surface the most engaging recent threads so users always have something worth reading on the home page.

### Data-model changes
None. The existing `voteCount` field on `Thread` plus `createdAt` timestamps are sufficient. A comment-count projection is computed at query time.

### Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/threads/trending` | required | Returns threads ranked by a recency-weighted score (`voteCount + commentCount × recencyDecay`) |

### Frontend touch points
- "Trending" toggle/tab on `Home.jsx` alongside the existing feed
- Handled by a new thunk in the existing `threadSlice.js` or a dedicated `trendingSlice.js`

### Complexity
**Low.** No model changes. The scoring formula lives entirely in `threadService.js`.

> **File overlap warning:** The new route lives in `src/routes/threads.js` and the handler in `src/controllers/threadController.js` — the same files touched by any thread-level change. Build this independently of Feature 2 to avoid merge conflicts.

---

## Feature 4 — Thread Tags / Flair

**Value proposition:** Let authors label threads with tags (e.g. "Question", "Discussion") so readers can filter the feed by topic.

### Data-model changes
`src/models/Thread.js` — add:
```js
tags: [{ type: String, trim: true }]
```
`src/models/Subreddit.js` — optionally add:
```js
allowedTags: [{ type: String, trim: true }]
```

### Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/threads?tag=<tag>` | required | Filter threads by tag (extends existing list endpoint) |
| PUT | `/api/threads/:id` | required | Already exists — accepts `tags` in the body |

### Frontend touch points
- Tag chips displayed on `ThreadCard`
- Tag selector (multi-select) in `CreateThreadForm`
- Tag filter buttons in `FilterSortBar` on `Home.jsx`

### Complexity
**Medium.** Straightforward model change, but the filter logic extends the existing `GET /api/threads` endpoint and the `fetchAllThreads` service function.

> **File overlap warning:** Both Feature 2 (Search) and Feature 4 (Tags) modify `src/models/Thread.js`. Build and merge them on separate branches; the changes are to different parts of the file but a rebase may be needed.

---

## Feature 5 — Notifications

**Value proposition:** Alert users when someone comments on their thread, so they come back to engage.

### Data-model changes
New collection — `src/models/Notification.js`:
```js
{
  recipient:  { type: ObjectId, ref: 'User', required: true },
  type:       { type: String, enum: ['comment', 'reply'], required: true },
  thread:     { type: ObjectId, ref: 'Thread' },
  actor:      { type: ObjectId, ref: 'User' },  // who triggered it
  read:       { type: Boolean, default: false },
  createdAt:  Date  (via timestamps)
}
```
Notifications are created inside `commentService.js` after a comment is saved.

### Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/notifications` | required | List unread notifications for the current user |
| PUT | `/api/notifications/:id/read` | required | Mark a notification as read |
| PUT | `/api/notifications/read-all` | required | Mark all as read |

### Frontend touch points
- Notification bell icon in `Header.jsx` with an unread badge count
- `notificationSlice.js` reducer + `notificationService.js`
- Dropdown or `/notifications` page listing items

### Complexity
**Medium–High.** Requires hooking into `commentService.js` to emit notifications on comment creation — the only feature here that modifies an *existing* service file used by another domain.

> **File overlap warning:** Creating a comment (Feature 5 dependency) lives in `src/services/commentService.js` and `src/controllers/commentController.js`. Any concurrent work on comments will conflict here.

---

## Overlap Summary

| Files | Features that touch it |
|-------|------------------------|
| `src/models/User.js` | Feature 1 (Bookmarks) |
| `src/models/Thread.js` | Feature 2 (Search index), Feature 4 (Tags field) |
| `src/models/Subreddit.js` | Feature 4 (Tags — allowedTags) |
| `src/routes/threads.js` | Feature 3 (Trending — new route), Feature 4 (tag filter) |
| `src/controllers/threadController.js` | Feature 3 (Trending) |
| `src/services/commentService.js` | Feature 5 (Notifications — hook on comment create) |

**Features 1 and 2 (Bookmarks and Search) have zero file overlap with each other** — they are safe to build in parallel worktrees. Build those two first.
