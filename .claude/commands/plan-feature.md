---
description: Produce an ordered implementation plan and task checklist from a spec
argument-hint: <path-to-spec>
allowed-tools: Read, Glob, Grep, Write
---
Read the spec at $ARGUMENTS and produce an implementation plan saved next to it
as `<spec>.plan.md`.

Sequence the work bottom-up: model → service → controller → route → backend
tests → Redux slice → frontend service → component → wire-up → frontend tests.
For each task name the exact files to create or edit and the key functions.
End with a checklist of tasks suitable for tracking. Do NOT write code yet.