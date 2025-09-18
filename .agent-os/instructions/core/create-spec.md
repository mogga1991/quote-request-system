---
description: AI-Ready Spec Creation Rules for Agent OS (Claude + Cursor Optimized)
globs:
alwaysApply: false
version: 2.0
encoding: UTF-8
---

# Spec Creation Rules (AI Native, Procurement Platform)

## Overview

Generate feature specs in a structure perfect for both human and AI (Claude, Cursor) workflows. Each spec is tightly mapped to the roadmap and product vision, enabling full AI automation of design, coding, and integration steps.

<pre_flight_check>
  EXECUTE: @.agent-os/instructions/meta/pre-flight.md
</pre_flight_check>

<process_flow>

<step number="1" subagent="context-fetcher" name="spec_initiation">

### Step 1: Initiate Spec Creation

Trigger by either:
- User asks "what's next?" → fetches next incomplete roadmap item.
- User provides a detailed or short feature idea.

<actions>
  - For "what's next?" fetch from `.agent-os/product/roadmap.md`, ask for user confirmation before proceeding.
  - For new ideas, process any length/format and move to context gathering.
</actions>
</step>

<step number="2" subagent="context-fetcher" name="context_alignment">

### Step 2: Align Context with Product/Tech Stack

Automatically pull in the latest `.agent-os/product/mission-lite.md` and `.agent-os/product/tech-stack.md` as background knowledge unless already known. This ensures all specs and requirements reflect actual business and architectural constraints.
</step>

<step number="3" subagent="context-fetcher" name="requirements_interview">

### Step 3: Clarify Requirements & Boundaries

Ask specific, numbered questions if needed:
- What’s in/out of scope?
- Any explicit technical/UX/integration needs?
- For procurement: Does this require external API (SAM.gov, LoopNet), RBAC, government compliance, or custom notifications?

If unclear, pause and request clarification.
</step>

<step number="4" subagent="date-checker" name="date_determination">

### Step 4: Date Calculation

Get today’s date (YYYY-MM-DD); used for organizing the spec folder and maintaining clear history.
</step>

<step number="5" subagent="file-creator" name="spec_folder_creation">

### Step 5: Create Spec Folder

Create `.agent-os/specs/YYYY-MM-DD-spec-name/`  
- Spec name = max 5 words, kebab-case, must reflect functional intent (e.g., `supplier-api-bulk-import`)
</step>

<step number="6" subagent="file-creator" name="spec_md_creation">

### Step 6: Generate Main Spec Document (spec.md)

Use this template:

Spec Requirements Document
Spec: [SPEC_NAME]
Created: [CURRENT_DATE]

Overview
[2-3 sentence summary: What problem? For who? Expected outcome.]

User Stories
[USER_TYPE] [Goal]
As a [USER_TYPE], I want to [DO ACTION], so that [BENEFIT].
Workflow: [step by step, if needed]

In Scope
[Feature] – [one sentence]

...

Out of Scope
[Functionalities to exclude (for clarity and agent accuracy)]

Acceptance Criteria
[Browser-testable or deployable outcome]

[API or data contract verification]

text
</step>

<step number="7" subagent="file-creator" name="spec_lite_md">

### Step 7: Generate Spec Lite (spec-lite.md)

Create a 1-3 sentence ultra-condensed summary for AI agents to load as fast context before coding.
</step>

<step number="8" subagent="file-creator" name="technical_spec_md">

### Step 8: Generate Technical Specification (sub-specs/technical-spec.md)

Sections:
- **Technical Requirements**: Exact tech/infra details, UX/UI, and implementation hints (e.g., "must use Next.js app router", or "Supabase RLS for RBAC").
- **External Dependencies**: Only if new dependencies; always justify with reason and version requirement.
</step>

<step number="9" subagent="file-creator" name="database_schema_md">

### Step 9: (Conditional) Generate Database Schema (sub-specs/database-schema.md)

- ONLY if schema/migrations/db changes needed.
- Direct SQL, ORM, or migration scripts plus explanation.
</step>

<step number="10" subagent="file-creator" name="api_spec_md">

### Step 10: (Conditional) Generate API Specification (sub-specs/api-spec.md)

- ONLY if new APIs/endpoints/controllers are needed.
- List each: method, path, body, params, response logic, error handling.
</step>

<step number="11" name="user_review">

### Step 11: User Review

Summarize in chat:
- Full path to all generated spec files
- Quick summary of what was specified
Ask user to review and confirm before moving on to task breakdown.

_Next step: Run `/create-tasks` after approval to convert this spec into a concrete build checklist._
</step>

</process_flow>

<post_flight_check>
  EXECUTE: @.agent-os/instructions/meta/post-flight.md
</post_flight_check>