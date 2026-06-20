## Part 1

```
Initialize a git repo, and commit the current state including the .claude toolkit. Create a private GitHub repo called "threadhive-cc" and push the main branch to this remote repo.
```

## Part 2


### Stage 1 — Brainstorm the Epic

```
I want to add an epic focused on content discovery and engagement to this existing application. Explore the codebase, then propose 5 independent, full-stack features for this epic that fit our existing architecture. For each feature, give a one-line value proposition, the data-model changes, the endpoints, the frontend touch points, and a rough complexity estimate. Flag any features that would touch the same files. Save the result to docs/epic-discover-engage.md.
```

### Stage 2 — Write the Specification (Spec)

The prompt for the optional task:

```
Read specs/001-bookmarks.md and generate a single self-contained HTML document at specs/001-bookmarks-review.html suitable for presenting to engineers, product managers, and other stakeholders. Preserve all the key requirements in a clean, readable layout, and include one or more architecture diagrams showing how the new components integrate into the existing application.
```

### Stage 4 — Branch & Worktree

```
Commit the changes on main. Create a feature branch `feature/bookmarks` in a new git worktree at
../th-bookmarks.
```

For the search feature, replace `bookmarks` with `search` in the above prompt and the branch name.

### Stage 5 - Implement (tests-first)

```
Implement specs/001-bookmarks.md following specs/001-bookmarks.plan.md. Follow the conventions in CLAUDE.md.
```

For the search feature, replace `bookmarks` with `search` in the above prompt and the filename.

### Stage 7 — Test & Verify

```
/verify the bookmarks feature works: a logged-in user can save a thread from a thread card, see it under the Saved tab on their profile, and unsave it
```

For the search feature,

```
/verify the search feature works: a user can enter a query in the search bar, see relevant threads, and click into a thread from the results.
```

### Stage 9 - Merge & Integrate

```
Pull in the changes, delete the remote and local feature branch, and remove the corresponding worktree.
```
