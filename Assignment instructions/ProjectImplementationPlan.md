# Week 11 ThreadHive — Project Implementation Plan

## Overview

Build two product features on the ThreadHive full-stack Reddit-style app using a disciplined 9-stage agentic development pipeline with Claude Code. The two features are:

1. **Saved Threads (Bookmarks)** — logged-in users can save/unsave a thread and view their saved list on their profile
2. **Full-Text Search** — search thread titles and content from a header search bar

---

## Current State

| Area | Details |
|------|---------|
| Backend | Express 5 + Mongoose 8, layered controller → service → model, routes in `src/app.js`, errors via `createAppError`, Vitest + Supertest tests |
| Frontend | React 19 + Redux Toolkit + Bootstrap 5, slices in `src/reducers/`, API calls in `src/services/` |
| `.claude/` toolkit | `settings.json` (pre-approved git/gh/npm permissions, acceptEdits mode), custom commands: `spec.md`, `plan-feature.md`, `open-pr.md` |
| Git / GitHub | No repo yet — to be created in Stage 0 |
| Docs / Specs | No `docs/` or `specs/` folders yet — created during the workflow |

---

## The 9-Stage Pipeline

### Stage 0 — Setup
**Goal:** Initialize the repo and push the baseline to GitHub.

1. Run `/init` to generate `CLAUDE.md` (already done)
2. Review and tighten `CLAUDE.md` to capture: ES modules, layered backend, Mongoose models in `src/models/`, routes in `src/app.js`, Redux slices in `src/reducers/`, API calls in `src/services/`, Vitest tests, vertical slice pattern
3. Initialize a git repo, generate `.gitignore`, commit the full codebase + `.claude/` toolkit + `CLAUDE.md`
4. Create a private GitHub repo `threadhive-cc` and push `main`

**Artifacts:** `CLAUDE.md`, `.gitignore`, GitHub repo with initial commit

---

### Stage 1 — Brainstorm
**Goal:** Explore the codebase and propose 5 "Discover & Engage" features.

Prompt:
> *I want to add an epic focused on content discovery and engagement to this existing application. Explore the codebase, then propose 5 independent, full-stack features for this epic that fit our existing architecture. For each feature, give a one-line value proposition, the data-model changes, the endpoints, the frontend touch points, and a rough complexity estimate. Flag any features that would touch the same files. Save the result to docs/epic-discover-engage.md*

Review that the proposal includes Bookmarks and Search. Commit `docs/epic-discover-engage.md`.

**Artifact:** `docs/epic-discover-engage.md`

---

### Stage 2 — Spec
**Goal:** Write a precise, testable specification for each feature.

#### Bookmarks
```
/spec bookmarks — let a logged-in user save/unsave a thread and see their saved threads on their profile
```
Review `specs/001-bookmarks.md` for:
- Testable acceptance criteria (e.g., "saving an already-saved thread is idempotent")
- Precise API contract (status codes, auth required, response shape)
- Data-model delta matching the existing Mongoose schema style
- Edge cases (unauthenticated user, thread not found, duplicate save)

#### Search
```
/spec search — full-text search of thread titles and content from a header search bar
```
Review `specs/002-search.md` similarly.

Optionally generate an HTML presentation for each spec:
> *Read specs/001-bookmarks.md and generate a single self-contained HTML document at specs/001-bookmarks-review.html suitable for presenting to engineers, product managers, and other stakeholders.*

Commit both specs.

**Artifacts:** `specs/001-bookmarks.md`, `specs/002-search.md`

---

### Stage 3 — Plan & Tasks
**Goal:** Break each spec into an ordered, bottom-up implementation plan.

```
/plan-feature specs/001-bookmarks.md
/plan-feature specs/002-search.md
```

Review each plan: model/service should come before controller/route, UI last. Each file to be created or modified should be named explicitly. Commit both plans.

**Artifacts:** `specs/001-bookmarks.plan.md`, `specs/002-search.plan.md`

---

### Stage 4 — Branch & Worktree
**Goal:** Isolate each feature in its own working directory.

```bash
git worktree add -b feature/bookmarks ../th-bookmarks
git worktree add -b feature/search ../th-search
```

- Open each worktree in its own VS Code window
- Run `npm install` in both `threadhive-backend/` and `threadhive-frontend/` inside each worktree
- Stop the main-window dev servers before starting servers in the worktrees to avoid port conflicts

**Artifacts:** `../th-bookmarks/` (feature/bookmarks branch), `../th-search/` (feature/search branch)

---

### Stage 5 — Implement (tests-first)
**Goal:** Build each feature to spec. Can run in parallel across both worktrees.

#### Bookmarks (in `../th-bookmarks`)
Vertical slice — bottom to top:

| Layer | File(s) |
|-------|---------|
| Model | `src/models/User.js` — add `savedThreads: [{ type: ObjectId, ref: 'Thread' }]` |
| Service | `src/services/bookmarkService.js` |
| Controller | `src/controllers/bookmarkController.js` |
| Route | `src/routes/bookmarks.js` → mount in `src/app.js` |
| Tests | `tests/integration/bookmark.test.js` |
| Redux slice | `src/reducers/bookmarkSlice.js` |
| API service | `src/services/bookmarkService.js` (frontend) |
| Component | Saved tab on `src/pages/User/Profile.jsx` + bookmark button on `ThreadCard` |

#### Search (in `../th-search`)
Vertical slice — bottom to top:

| Layer | File(s) |
|-------|---------|
| Model | `src/models/Thread.js` — add MongoDB text index on `title` + `content` |
| Service | `src/services/searchService.js` |
| Controller | `src/controllers/searchController.js` |
| Route | `src/routes/search.js` → mount in `src/app.js` |
| Tests | `tests/integration/search.test.js` |
| Redux slice | `src/reducers/searchSlice.js` |
| API service | `src/services/searchService.js` (frontend) |
| Component | Search bar in `src/components/Header/Header.jsx` + results page/dropdown |

Commit with a descriptive message in each worktree.

---

### Stage 6 — Code Review
**Goal:** Run automated code review on each feature branch's diff.

```
/code-review
```

Run this inside each worktree's Claude session. Read the findings and decide: accept, fix now, or log as a future GitHub issue.

---

### Stage 7 — Test & Verify *(optional but recommended)*
**Goal:** Confirm the feature works end-to-end in the running app.

```
/verify the bookmarks feature works: a logged-in user can save a thread from a thread card, see it under the Saved tab on their profile, and unsave it

/verify the search feature works: typing in the header search bar returns matching threads
```

Check loading and empty states, and confirm unauthenticated users are handled gracefully.

---

### Stage 8 — Pull Request
**Goal:** Open a PR per feature for final review.

```
/open-pr
```

Run in each worktree after committing all changes. Open the PR in the browser (`gh pr view --web`) and review the full diff one more time.

**Artifacts:** Open GitHub PR per feature

---

### Stage 9 — Merge & Integrate
**Goal:** Squash-merge each PR, then sync local main.

```bash
# Merge each PR via GitHub CLI (squash + delete remote branch)
gh pr merge --squash --delete-branch

# Back in the main window — sync main
git pull origin main

# Clean up worktrees and local branches
git worktree remove ../th-bookmarks
git worktree remove ../th-search
git branch -D feature/bookmarks feature/search
```

> **Rule:** Never `git merge` a feature branch into local main yourself. Only squash-merge via the GitHub PR — then fast-forward pull.

---

## Key File Summary

| Stage | New / Modified Files |
|-------|----------------------|
| 0 | `CLAUDE.md`, `.gitignore` |
| 1 | `docs/epic-discover-engage.md` |
| 2 | `specs/001-bookmarks.md`, `specs/002-search.md` |
| 3 | `specs/001-bookmarks.plan.md`, `specs/002-search.plan.md` |
| 5 — Bookmarks | `src/models/User.js`, `src/services/bookmarkService.js`, `src/controllers/bookmarkController.js`, `src/routes/bookmarks.js`, `src/app.js`, `tests/integration/bookmark.test.js`, frontend slice + service + Profile/ThreadCard components |
| 5 — Search | `src/models/Thread.js`, `src/services/searchService.js`, `src/controllers/searchController.js`, `src/routes/search.js`, `src/app.js`, `tests/integration/search.test.js`, frontend slice + service + Header SearchBar component |

---

## Verification Checklist

- [ ] After Stage 5: `npm test` passes in each worktree (backend + frontend)
- [ ] After Stage 7: bookmark and search flows verified manually in the running app
- [ ] After Stage 9: `git pull` on main, run `npm test` again — no regressions

---

## Notes

- `.claude/settings.json` pre-approves `git *`, `gh *`, `npm test*`, `npm run *` — minimal permission prompts
- Stages 5–8 can run in parallel for both features (separate VS Code windows, separate Claude sessions per worktree)
- Search is independent of Bookmarks (no overlapping model changes) — safe to build concurrently
- Always squash-merge via the GitHub PR; never merge locally
