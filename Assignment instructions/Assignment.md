Week 11 : Building Features with Claude Code — An Agentic Development
Workflow
In previous weeks we explored different features of Claude Code and also used it to enhance our
application one prompt at a time. This week we go a level higher: we will build a complete, professional
software-development workflow around Claude Code and then run real product work through that
workflow.
The workflow mirrors how a strong engineering team actually ships software and comprises of the
following stages:
1. Brainstorm — explore the codebase and propose a set of features to build
2. Spec — write a precise, testable specification for each feature
3. Plan — break down each spec into an ordered implementation plan and task list
4. Branch — create a git branch and isolated worktree per feature
5. Implement — build the feature, preferably tests-first
6. Review — understand the generated code, and run automated code reviews
7. Test & verify — run the full test suite and manually verify the feature in the running app
8. Pull request — open a PR, review the diff, and address any comments
9. Merge & integrate — squash-merge the PR, resolve any conflicts, and re-verify the main branch
There will be some back-and-forth between stages, but the key idea is that every stage produces a
concrete artifact that you review before moving on — a spec document, a markdown plan, a git diff, a
PR. The agent does the mechanical work of generating these artifacts, and you spend your attention
where it matters most — on the spec and the code.
We will run a epic of two Discover and Engage product features — through this pipeline on our
ThreadHive application, using real GitHub pull requests.
The session is structured in two parts:
Part 1: Review and set up an agentic development workflow (the reusable .claude/ toolkit, the gh
CLI, and the pipeline itself)
Part 2: Build the two product features with the workflow above. The focus here is "how do I drive an
agent through a disciplined, reviewable, team-grade process?" We will lean on everything from
previous weeks, but the emphasis here is on the review — of brainstorms, specs, plans, diffs, and
PRs. The agent does the typing; you own the judgment.
Project Setup and Structure
This week's starter code is the Week 9 ThreadHive solution — the full-stack Reddit-style app
(subreddits, threads, comments, votes, JWT auth) including the AI summary/rephrase features. We will
add two new product features to it.
Proprietary content. © Great Learning. All Rights Reserved. Unauthorized use or distribution is prohibited.
Page 1 of 10
jessicawitcher06@gmail.com
RYZ4NQ7KHB
This file is meant for personal use by jessicawitcher06@gmail.com only.
Sharing or publishing the contents in part or full is liable for legal action.
1. Download and extract the assignment starter code from the zip file provided on Olympus, and open
the entire project folder in VS Code so Claude Code can see both threadhive-backend and
threadhive-frontend.
2. Get the backend running:
cd threadhive-backend
Set up the .env file (the usual backend variables, plus GEMINI_API_KEY if you want the
Week 9 AI features to keep working — though they are not required for this week's features).
npm install
npm run populate
npm run dev
3. Get the frontend running in a new terminal:
cd threadhive-frontend
npm install
npm run dev
4. Confirm the app loads and threads display before continuing.
Set up the GitHub CLI
This week we use pull requests, so we drive GitHub from the terminal with the gh CLI.
1. Install the GitHub CLI from cli.github.com (or winget install GitHub.cli on Windows / brew
install gh on macOS).
2. Authenticate:
gh auth login
Choose GitHub.com → HTTPS → authenticate via browser.
3. Verify:
gh auth status
We will create the remote repository later, from inside a Claude Code session.
Part 1 : An Agentic Development Workflow
The Pipeline
Everything we do this week flows through nine stages. Each stage maps to a Claude Code capability you
already know, and produces a concrete artifact you can review before moving on.
Proprietary content. © Great Learning. All Rights Reserved. Unauthorized use or distribution is prohibited.
Page 2 of 10
jessicawitcher06@gmail.com
RYZ4NQ7KHB
This file is meant for personal use by jessicawitcher06@gmail.com only.
Sharing or publishing the contents in part or full is liable for legal action.
# Stage What the agent does Claude Code primitive Artifact / git action
0 Setup
Init repo, generate
project memory, build
and understand the
workflow toolkit
/init, custom
commands, permission
modes, gh
CLAUDE.md, .claude/,
baseline pushed to main
1 Brainstorm
Diverge on ideas,
score against the real
codebase, converge
Plan Mode + Explore
agent
docs/epic-discoverengage.md
2 Spec
Write a precise,
testable spec per
feature
/spec custom command
specs/001-
bookmarks.md, …
3 Plan & tasks
Turn a spec into an
ordered build plan +
checklist
/plan-feature custom
command
specs/00X.plan.md
4
Branch +
worktree
One isolated working
copy per feature
git worktree feature/bookmarks, …
5 Implement
Build to spec, testsfirst
acceptEdits/auto
mode
Commits on the branch
6 Review
Automated code
review
/code-review or
/security-review
Findings noted
7
Test &
verify
Full suite + run the
app end-to-end
/verify, Playwright
MCP
Green tests + screenshots
8 Pull request Open the PR gh pr create Open PR per feature
9
Merge &
integrate
Squash-merge,
resolve conflicts (if
any)
gh pr merge
main updated, branch
cleaned
The loop from stage 4 to stage 9 repeats once per feature.
The Reusable .claude/ Workflow Toolkit
The distinctive idea of this week is that you configure Claude Code into a workflow, then commit that
configuration so your whole team inherits it. We will assemble four things inside .claude/.
1. Project memory — CLAUDE.md
Run /init once. Then review and tighten the generated CLAUDE.md so every agent (and every
subagent) stays on-pattern. For ThreadHive, make sure it captures:
Proprietary content. © Great Learning. All Rights Reserved. Unauthorized use or distribution is prohibited.
Page 3 of 10
jessicawitcher06@gmail.com
RYZ4NQ7KHB
This file is meant for personal use by jessicawitcher06@gmail.com only.
Sharing or publishing the contents in part or full is liable for legal action.
ES modules throughout; backend is layered controller → service → model with errors
created via createAppError.
Mongoose models live in src/models; routes are mounted in src/app.js.
Frontend uses React + Vite + Redux Toolkit; one slice per domain in src/reducers, API calls in
src/services.
Tests use Vitest (backend integration tests with Supertest); run with npm test.
A new feature is a vertical slice: model → service → controller → route → tests → Redux slice →
service → component.
Why this matters: Stage 5 launches multiple agents in parallel. CLAUDE.md is the shared rulebook
that keeps their output consistent without you repeating yourself in every prompt.
2. Custom slash commands — encode the pipeline
A custom slash command is just a markdown file in .claude/commands/. The filename becomes the
command name (.claude/commands/spec.md → /spec). The body is a prompt template; $ARGUMENTS
is replaced with whatever you type after the command, and !`cmd` runs a shell command and injects its
output.
You can also author these as Skills if you want Claude to invoke them automatically. We use plain
commands here because we want to trigger each pipeline step explicitly.
Review the following three commands corresponding to stages in the pipeline:
1. .claude/commands/spec.md : To draft a detailed spec from a feature description.
2. .claude/commands/plan-feature.md: To break down a spec into an ordered implementation
plan and task checklist.
3. .claude/commands/open-pr.md: To push the current branch and open a GitHub pull request.
3. Settings
Review the deterministic guardrails in .claude/settings.json:
Permission allowlist — pre-approve the safe, repetitive commands this workflow uses so you are
not prompted constantly:
{
 "permissions": {
 "allow": ["Bash(git *)", "Bash(gh *)", "Bash(npm test*)",
"Bash(npm run *)"],
 "deny": ["Read(./threadhive-backend/.env)"],
 "defaultMode": "acceptEdits"
 }
}
Proprietary content. © Great Learning. All Rights Reserved. Unauthorized use or distribution is prohibited.
Page 4 of 10
jessicawitcher06@gmail.com
RYZ4NQ7KHB
This file is meant for personal use by jessicawitcher06@gmail.com only.
Sharing or publishing the contents in part or full is liable for legal action.
Model — set the powerful Opus as the default for better code understanding and generation using
the /model command. We will also run the /effort command to set the effort level to xhigh for
these tasks.
Once the toolkit exists, commit it and push the baseline. Enter the following prompt in Claude:
Initialize a git repo, and commit the current state including the .claude
toolkit. Create a private GitHub repo called "threadhive-cc" and push the
main branch to this remote repo.
The agent will initialize a git repo and create an appropriate .gitignore file before the commit. Verify that
the repo is created on GitHub with the initial commit containing the .claude/ folder and the CLAUDE.md
file along with the rest of the codebase.
Part 2 : Running the "Discover & Engage" Epic
An epic is a large body of work that delivers a significant business outcome, that is typically broken down
into multiple features. The "Discover & Engage" epic is a set of features that help users find and return to
content they care about.
The Epic
We will focus on two classic, genuinely useful features that help users find and return to content. Each is
an independent vertical slice — its own branch and its own PR.
Feature What it adds
1. Saved Threads (Bookmarks) Bookmark a thread for later; view saved list on profile
2. Search Full-text search of threads from the header
For each of these features, we will walk through the entire pipeline, stage by stage. Given that some
stages are time-consuming (especially implementation), you can choose to run them in parallel. We will
run the brainstorming and spec stages sequentially so we have a clear spec for each before
implementation, but you could run the implementation of Search and Bookmarks concurrently in separate
worktrees.
Stage 1 — Brainstorm the Epic
Let us start by brainstorming a set of features for the "Discover & Engage" epic. Enter the following
prompt in Claude:
Proprietary content. © Great Learning. All Rights Reserved. Unauthorized use or distribution is prohibited.
Page 5 of 10
jessicawitcher06@gmail.com
RYZ4NQ7KHB
This file is meant for personal use by jessicawitcher06@gmail.com only.
Sharing or publishing the contents in part or full is liable for legal action.
I want to add an epic focused on content discovery and engagement to this
existing application. Explore the codebase, then propose 5 independent,
full-stack features for this epic that fit our existing architecture. For
each feature, give a one-line value proposition, the data-model changes,
the endpoints, the frontend touch points, and a rough complexity estimate.
Flag any features that would touch the same files. Save the result to
docs/epic-discover-engage.md
Review the proposal. It should propose Saved Threads and Search, among other features. We will build
those two here, but feel free to pick up others as additional practice.
Stage 2 — Write the Specification (Spec)
Spec-Driven Development
The single biggest lever on agent output quality is the spec. A vague prompt produces vague code; a
precise spec produces reviewable code. A good spec is clear and unambiguous, and focused on
outcomes (the 'what' over the 'how'). It should list testable acceptance criteria, cover edge cases and
explicitly mention what is out of scope. It can also contain non-functional requirements related to
performance, security, usability, etc.
We generate the first draft with the /spec command, then you review and edit it if needed — the spec is
where human intent is cheapest to inject and most expensive to omit. Run the following command with
the feature description as the argument:
/spec bookmarks — let a logged-in user save/unsave a thread and see their
saved threads on their profile
Open the generated specs/001-bookmarks.md and carefully review it as if a teammate wrote it.
Check specifically for things like:
Are the acceptance criteria testable (e.g., "saving an already-saved thread is idempotent")?
Is the API contract precise (status codes, auth required, response shape)?
Does the data-model delta match our schema ?
Any missing edge cases
If necessary, edit the spec, or prompt Claude for changes. This is an extremely important step for the
quality of the final implementation, so spend time here. A good spec makes implementation almost
mechanical; a bad one can doom you to multiple rounds of rework and review.
Once approved, you can commit the spec.
Proprietary content. © Great Learning. All Rights Reserved. Unauthorized use or distribution is prohibited.
Page 6 of 10
jessicawitcher06@gmail.com
RYZ4NQ7KHB
This file is meant for personal use by jessicawitcher06@gmail.com only.
Sharing or publishing the contents in part or full is liable for legal action.
Optional Task — a visual spec for review. A markdown spec is great for editing but not for sharing. You
can have Claude render it as a presentable document for a wider audience (engineers, PMs,
stakeholders):
Read specs/001-bookmarks.md and generate a single self-contained HTML
document at specs/001-bookmarks-review.html suitable for presenting to
engineers, product managers, and other stakeholders. Preserve all the key
requirements in a clean, readable layout, and include one or more
architecture diagrams showing how the new components integrate into the
existing application.
Open the HTML file in a browser to review the spec and the proposed architecture at a glance.
Stage 3 — Plan & Tasks
/plan-feature specs/001-bookmarks.md
This produces specs/001-bookmarks.plan.md, an ordered, bottom-up task list naming the exact files.
Review the sequence — model and service first, UI last — and the file list. If the plan is solid and
detailed, implementation is mostly a matter of following the plan and ticking off tasks. If the plan is highlevel or missing steps, you will have to make more decisions during implementation, which increases the
chances of going off-pattern.
Stage 4 — Branch & Worktree
Each feature gets its own branch and its own working directory via git worktree, so parallel agents
never trip over each other and your main checkout stays clean. We will commit the spec and plan so they
are part of the branch history, and then create the worktree.
Commit the changes on main. Create a feature branch `feature/bookmarks` in
a new git worktree at ../th-bookmarks.
This runs something like git worktree add -b feature/bookmarks ../th-bookmarks. It will
create a new folder th-bookmarks at the parent level (same level as the main repo) with a fresh
checkout of the repo on the feature/bookmarks branch.
Open this folder in a new VS Code window. You now have two VS Code windows open — one with main
and one with feature/bookmarks. The worktree is an isolated copy of the repo, so you can run the dev
server, tests, and git commands in it without affecting the main checkout. Because a worktree is a fresh
Proprietary content. © Great Learning. All Rights Reserved. Unauthorized use or distribution is prohibited.
Page 7 of 10
jessicawitcher06@gmail.com
RYZ4NQ7KHB
This file is meant for personal use by jessicawitcher06@gmail.com only.
Sharing or publishing the contents in part or full is liable for legal action.
checkout, install dependencies in it (npm install in each backend/frontend folder) before running
anything. (Stop the dev servers in the main window before running them in the worktree to avoid port
conflicts.)
Claude-native option: Claude Code can manage worktrees for you with claude --worktree
bookmarks, and a subagent can run in an isolated worktree via isolation: worktree in its
frontmatter. Plain git worktree is shown here because it is a transferable git skill.
Stage 5 — Implement (tests-first)
Start a Claude session in the worktree, switch to acceptEdits mode (or auto for a longer hands-off
run), and drive the implementation from the plan. Prefer a tests-first rhythm so the agent has a target:
Implement specs/001-bookmarks.md following specs/001-bookmarks.plan.md.
Follow the conventions in CLAUDE.md.
Note: since the implementation might take a while, work on the search feature parallelly. Refer to this
section at the end of this document for details.
Once the implementation is done, commit the changes in the worktree. Give the following command to
the agent:
Commit the changes with a descriptive message.
Stage 6 — Review
Now run automated review on the branch's diff. Claude's inbuilt code-review skill automates pull request
reviews by launching multiple agents in parallel. These agents independently analyze the changes from
different perspectives, looking for correctness, bugs, and cleanup opportunities. Run the skill with the
/code-review command:
/code-review
This will take a few moments. Once complete, read its findings and decide next steps — accept, push
back, or fix.
For now, you can just save the suggested fixes for the next implementation iteration. You could also get
the agent to create GitHub issues from these findings that you will address in the future.
Proprietary content. © Great Learning. All Rights Reserved. Unauthorized use or distribution is prohibited.
Page 8 of 10
jessicawitcher06@gmail.com
RYZ4NQ7KHB
This file is meant for personal use by jessicawitcher06@gmail.com only.
Sharing or publishing the contents in part or full is liable for legal action.
Stage 7 — Test & Verify [Optional]
Tests passing is necessary but not sufficient — verify the behaviour in the running app. You can
manually click through the app to confirm the feature works end-to-end, or also have the agent do this
for you with a prompt like:
/verify the bookmarks feature works: a logged-in user can save a thread
from a
thread card, see it under the Saved tab on their profile, and unsave it
This launches the app and exercises the feature. If you set up the Playwright MCP, the agent can click
through the flow in a real browser and capture screenshots for the PR. Confirm the loading and empty
states behave, and that an unauthenticated user is handled gracefully.
Stage 8 — Open the Pull Request
Once the feature is green and manually verified, let's commit our work and open a PR.
Commit the changes with a descriptive message
and then, run the /open-pr command:
/open-pr
This pushes feature/bookmarks and opens a PR with a generated summary, change list, and test plan.
Open the PR in the browser (or gh pr view --web) and review the full diff one more time.
Stage 9 — Merge & Integrate
When the PR is green and reviewed, merge it on the remote — that one squash-merge is the source of
truth. Don't also merge the branch locally.
Merge the PR with a squash merge and delete the remote branch.
Because we squashed, GitHub collapses the branch into a single new commit on origin/main. Your
local main has no commits of its own (all the feature work lived on the branch/worktree), so syncing it
later is a clean fast-forward — not a merge.
Proprietary content. © Great Learning. All Rights Reserved. Unauthorized use or distribution is prohibited.
Page 9 of 10
jessicawitcher06@gmail.com
RYZ4NQ7KHB
This file is meant for personal use by jessicawitcher06@gmail.com only.
Sharing or publishing the contents in part or full is liable for legal action.
Repeat the Workflow for the Search Feature
Run the Search epic through the identical nine-stage pipeline:
1. /spec search — full-text search of thread titles and content from a header
search bar
2. /plan-feature the spec, create a worktree per feature, implement tests-first, review, verify, and
open a PR.
Try the parallel workflow. Search is independent (it does not change the models and other files that
Bookmark does), so you can build it in one worktree while Bookmarks builds in another — kick off both
from the main session and let them run concurrently. As and when they finish, review and test the code,
open the PR, and merge.
After Both Branches are Merged
Once both PRs are merged on GitHub, close the feature-branch VS Code windows and switch to the
main window. Bring main in sync and clean up:
On main, pull the latest from origin. Then remove the bookmarks and search
worktrees and force-delete their local feature branches.
Note: merge in exactly one place (the remote PR) and let local main only ever fast-forward-pull the result
with a sync — never git merge a feature branch into main yourself.
Retrospective
Close the session with a short reflection — this is where the learning consolidates:
Where did the agent excel? Boilerplate-heavy vertical slices, test scaffolding, PR descriptions,
conflict resolutions (if any).
Where was human judgment essential? Choosing the epic, tightening the spec, reading the
auth-sensitive diff, deciding what not to build.
What would you put in CLAUDE.md or a command so the next feature is even smoother?
The takeaway of Week 11: a great agentic workflow is not "let the AI write everything." It is a disciplined
pipeline with review gates at every stage, where the agent does the mechanical work and you spend
your attention where it matters most — the spec and the diff.
Proprietary content. © Great Learning. All Rights Reserved. Unauthorized use or distribution is prohibited.
Page 10 of 10
jessicawitcher06@gmail.com
RYZ4NQ7KHB
This file is meant for personal use by jessicawitcher06@gmail.com only.
Sharing or publishing the contents in part or full is liable for legal action.