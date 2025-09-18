---
description: Complete Feature Delivery & Finalization Rules (Agent OS AI/SaaS)
globs:
alwaysApply: false
version: 2.0
encoding: UTF-8
---

# Post-Execution Rules: Feature Delivery, Recap & Notification

## Overview

Run these steps as a **required final phase** after completing a feature/spec. Guarantees quality, auditability, and agent/team hand-off with zero missed details.

<pre_flight_check>
  EXECUTE: @.agent-os/instructions/meta/pre-flight.md
</pre_flight_check>

<process_flow>

<step number="1" subagent="test-runner" name="run_full_test_suite">

### Step 1: Run Full Test Suite (Regression Gate)

- ACTION: Use test-runner subagent, run *all* tests in repo (not just current feature)
- WAIT: For results, fix test failures until **100% pass**
- BLOCK: Do not proceed to commit/PR with any unaddressed failures

</step>

<step number="2" subagent="git-workflow" name="commit_and_pr">

### Step 2: Complete Git Workflow

- COMMIT: All relevant changes using clear, conventional commit messages
- PUSH: To dedicated feature/spec branch (never directly to main)
- PR: Create/assign pull request, describe changes, link to spec/recap
- RECORD: Save PR URL, note reviewers if applicable

</step>

<step number="3" subagent="project-manager" name="tasks_verification">

### Step 3: Verify All Tasks Complete/Documented

- CHECK: `tasks.md` is fully up-to-date for this feature/spec
- REQUIRE: All items `[x]` (complete) or `⚠️` (documented block; with brief reason)
- REPAIR: If discrepancies, prompt for immediate correction or schedule fix followup

</step>

<step number="4" subagent="project-manager" name="roadmap_check_and_update">

### Step 4: Mark Roadmap Progress (if applicable)

- REVIEW: If a spec matches/completes a roadmap item, mark it `[x]` in `roadmap.md`
- NOTE: Only update for complete, shipped features—partial/incomplete tasks are not advanced

</step>

<step number="5" subagent="project-manager" name="recap_document">

### Step 5: Create/Update Recap Summary

- GENERATE: `.agent-os/recaps/[spec-folder-name].md` using template:
  - 1 paragraph summary of what was built
  - Short bullet list of completed work
  - Paste concise context from `spec-lite.md`
  - Reference all original docs/spec location(s)

**Why:** Complete audit/history for team, agent retrain, or future onboarding.

</step>

<step number="6" subagent="project-manager" name="completion_summary_pm">

### Step 6: Final Completion Summary & UX Handoff

Produce a structured, scannable summary for user/team:
- WHAT: Summary of feature(s) shipped
- HOW TO TEST: Step-by-step (if browser-testable)
- ISSUES: Brief, with emoji ⚠️ if encounterd
- PULL REQUEST: PR URL, assigned reviewers
- FORMAT: Use emoji-section headers for clarity

Example:
✅ Features Delivered
[Short name] - [One sentence]
...

👀 Ready for Browser Testing
[Test step]
...

⚠️ Issues
[if any]

📦 PR
View Pull Request: [URL]

text
</step>

<step number="7" subagent="project-manager" name="notify_user">

### Step 7: Audible/Notification Alert

- Action: After ALL steps, play system sound or send notification to signal completion and prompt team/user attention.

</step>

</process_flow>

<post_flight_check>
  EXECUTE: @.agent-os/instructions/meta/post-flight.md
</post_flight_check>