---
description: Create Step-by-Step Agent OS Task List from Approved Spec (Claude & Cursor Optimized)
globs:
alwaysApply: false
version: 2.0
encoding: UTF-8
---

# Task List Creation Rules (AI First, TDD/Modern SaaS)

## Overview

With user approval, convert an approved feature spec into a step-by-step, grouped checklist for implementation. Follows a test-driven, incremental build philosophy, and is always ready for Claude or other agent execution—ensuring focus and clarity at each Task 1/step.

<pre_flight_check>
  EXECUTE: @.agent-os/instructions/meta/pre-flight.md
</pre_flight_check>

<process_flow>

<step number="1" subagent="file-creator" name="create_tasks">

### Step 1: Generate tasks.md in Feature Folder

Create a `tasks.md` in the current feature's spec folder.

**Checklist format:**
- 1–5 major tasks, one per high-level goal/component
- Each major task has up to 8 subtasks (1.1, 1.2, …)
- First subtask is always “Write/extend tests” (unit/integration/E2E as relevant)
- Last subtask is always “Verify all tests pass for this scope”

<task_template>
## Tasks

- [ ] 1. [Major Task: summary, e.g., "Implement RFQ Search API"]
  - [ ] 1.1 Write/extend tests for [component/feature]
  - [ ] 1.2 [Implementation step, e.g., "Add endpoint to Next.js API"]
  - [ ] 1.3 [Database/model changes, if needed]
  - [ ] 1.4 [UI/UX changes, if relevant]
  - [ ] 1.5 [Integration test/E2E setup]
  - [ ] 1.6 Verify all tests pass

- [ ] 2. [Next Major Task…]
  - [ ] 2.1 Write/extend tests for [component/feature]
</task_template>

**Grouping/order:**  
- Group by component/domain/vertical slice (API, UI, DB, automation)
- Order by dependency and logical build/test order
- ALWAYS TDD-first—never skip the test writing step for agent or human dev

<ordering_principles>
- Build incrementally, always be able to ship at end of a major step
- Encourage, but do not require, code reviews or pair agent/human check-ins at major task completion
</ordering_principles>

</step>

<step number="2" name="execution_readiness">

### Step 2: Execution Readiness Review

Present user with:
- Feature/spec name and high-level goal
- The checklist for Task 1 (major task and subtasks)
- Estimated complexity of Task 1
- Key deliverable(s) for Task 1

Prompt the user:

**Execution Prompt:**  
"The spec planning is complete. Here’s Task 1:  
**[Task 1 Title]**  
[Brief desc + its subtasks]

Proceed with Task 1 and its subtasks? (Type 'yes' to start, or 'review' or 'modify' to adjust.)"

**Flow:**
- Only continue with Task 1 on explicit 'yes'
- Queue up other tasks for later—never proceed beyond user instruction (ensures tight iterative cycle)
</step>

</process_flow>

<post_flight_check>
  EXECUTE: @.agent-os/instructions/meta/post-flight.md
</post_flight_check>
