---
description: Draft a feature specification from a short description
argument-hint: <feature-name> — <one-line description>
allowed-tools: Read, Glob, Grep, Write
---
You are writing a feature specification for the ThreadHive project.

Feature request: $ARGUMENTS

First explore the relevant parts of the codebase so the spec is grounded in our
actual architecture and conventions. Ask any clarifying questions using the 
AskUserQuestion tool. Once all questions are answered, write a spec to `specs/` using a
numbered kebab-case filename (e.g. `specs/001-bookmarks.md`) with these sections:

- Problem / motivation
- User stories
- Acceptance criteria (each one testable)
- API contract (endpoints, request/response shapes, status codes, auth)
- Data model changes (exact Mongoose schema deltas)
- UI changes (components, Redux slices, routes)
- Edge cases & error handling
- Out of scope
- Test plan (unit + integration)

Do NOT write any implementation code — only the specification.