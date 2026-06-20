---
description: Push the current branch and open a GitHub pull request
allowed-tools: Bash(git status), Bash(git push:*), Bash(gh pr create:*), Read
---
Push the current branch to origin and open a pull request with `gh pr create`.

Write a PR body containing:
- ## Summary — what changed and why (link the spec under `specs/`)
- ## Changes — bullets grouped by backend / frontend
- ## Test plan — unit, integration, and manual verification performed
- ## Screenshots — placeholder if applicable

Use a conventional title, e.g. `feat: saved threads (bookmarks)`.