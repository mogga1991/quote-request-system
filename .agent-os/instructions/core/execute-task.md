---
description: Step-by-Step Task Execution Rules for Agent OS (Claude & Cursor Optimized)
globs:
alwaysApply: false
version: 2.0
encoding: UTF-8
---

# Task Execution Rules (AI/TDD Native)

## Overview

Use this rule set to reliably execute any task and its sub-tasks from tasks.md. Always run TDD, apply best practices, and make each agent or dev step atomic, reviewable, and traceable.

<pre_flight_check>
  EXECUTE: @.agent-os/instructions/meta/pre-flight.md
</pre_flight_check>

<process_flow>

<step number="1" name="task_understanding">

### Step 1: Task Understanding

Read and analyze the chosen parent task and all its subtasks (from tasks.md). Analyze dependencies, clarify “done,” and verify test requirements for each substep.

<instructions>
  - **ACTION:** Read both the parent and all nested subtasks
  - **ANALYZE:** Implementation boundaries and ordering
  - **UNDERSTAND:** Any dependency on earlier tasks or upstream components
  - **NOTE:** All testing expectations
</instructions>

</step>

<step number="2" name="technical_spec_review">

### Step 2: Review Related Technical Specs

Open technical-spec.md (for this spec folder). Select only the information relevant for the current task. Ignore unrelated details for rapid focus.

<instructions>
  - **ACTION:** Extract tech, integration, and UX details just for this task
  - **SKIP:** Ignore unrelated sections to reduce context bloat
  - **APPLY:** Implementation hints, dependency notes, integration points
</instructions>

</step>

<step number="3" name="review_best_practices_and_style">

### Step 3: Best Practices & Code Style Alignment

Query both best-practices.md and code-style.md for just what's relevant (tech stack, feature type, and language).  
- *Example:* “For a Next.js API endpoint that touches Supabase, what are the error handling/async and RLS/RBAC patterns required?”

<instructions>
  - **ACTION:** Extract and summarize only pertinent practices
  - **APPLY:** To this task’s code, tests, and file structure
</instructions>

</step>

<step number="4" name="task_execution_tdd_loop">

### Step 4: Execute Task with TDD (Test-Driven Development) Loop

Perform subtasks exactly in order. For most tasks:
- First: Write all relevant tests (unit/integration/E2E, as fits the scope)
- Middle: Implement or refactor; keep all tests passing
- Last: Verify all tests pass for only this scope

For each subtask:
- Complete, then mark `[x]` in tasks.md (immediately after finishing)
- If a blocking issue cannot be solved after 3 attempts, record as "⚠️" and mark incomplete

<typical_loop>
  - [ ] 1.1 Write/extend tests for [feature]
  - [ ] 1.2 Implement feature or sub-feature
  - [ ] 1.3 Refactor (if necessary, keep tests green)
  - [ ] 1.4 Verify all tests pass
</typical_loop>

<instructions>
  - **ACTION:** DO NOT move to next subtask until the previous is fully completed or blocked
  - **TDD:** Always run failed-first, then make green, then refactor if possible
  - **BLOCKS:** If blocked, attempt a max of 3 approaches, then stop + record the blocking reason
</instructions>

</step>

<step number="5" name="targeted_test_run">

### Step 5: Targeted Test Run

Trigger only the tests specifically covering this parent task/component. Ignore unrelated folders/files.

<instructions>
  - **RUN:** All new/updated tests related to this implementation
  - **DEBUG:** Fix any failures, iterate until green for this scope
  - **CONFIRM:** 100% pass rate before proceeding
</instructions>

</step>

<step number="6" name="status_and_completion_update">

### Step 6: Status, Completion, and Blocking

Immediately update tasks.md:
- `[x]` for completed steps
- `[ ]` with ⚠️ and explanation for blocked (after 3 failed efforts)
- Debrief summary:
  - What was achieved
  - Any partials/blockers (with fix suggestion if available)
  - Next task IDs to queue

<instructions>
  - **ACTION:** Always update in place after each step
  - **SUMMARY:** Provide in prompt (for both user and agent next steps)
</instructions>

</step>

</process_flow>

<post_flight_check>
  EXECUTE: @.agent-os/instructions/meta/post-flight.md
</post_flight_check>
