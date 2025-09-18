---
description: Analyze Current Product & Install Agent OS (Claude/Cursor optimized)
globs:
alwaysApply: false
version: 1.1
encoding: UTF-8
---

# Analyze Current Product & Install Agent OS (Claude/Cursor)

## Overview

Install Agent OS into an existing codebase, analyze current product state, gather deep business and technical context. This process ensures Claude (in Cursor or other AI tools) can always generate specs/tasks in sync with your actual architecture and roadmap.

<pre_flight_check>
  EXECUTE: @.agent-os/instructions/meta/pre-flight.md
</pre_flight_check>

<process_flow>

<step number="1" name="analyze_existing_codebase">

### Step 1: Analyze Existing Codebase (AI/Claude-First)

Run a full codebase scan and context assessment, with extra attention to:
  - SaaS conventions, .agent-os usage, code style, and Next.js/Supabase idioms
  - Directory patterns (App Router, lib/hooks/db separation)
  - Modern infra (Neon, Vercel, API keys, Cursor automation hooks if present)

<analysis_areas>
  <project_structure>
    - Directory and file structure (incl. .agent-os, app, db, hooks)
    - App/feature boundaries
    - Build and deployment configuration (Vercel, .env, etc.)
  </project_structure>
  <technology_stack>
    - Frameworks (Next.js version, React version, Supabase/Drizzle/Neon presence)
    - All dependencies (from package manager lockfiles)
    - Auth/payment providers (e.g., Supabase, Stripe)
    - Infra setup and integration points (Vercel, workflow automations)
  </technology_stack>
  <implementation_progress>
    - Completed vs. in-progress features
    - Authz state, API endpoints, and 3rd-party integrations
    - Database schema and migrations
  </implementation_progress>
  <code_patterns>
    - Coding style: indicate if .agent-os/standards used (else infer from code)
    - Naming and organization conventions, test integration (if any)
    - Any AI agent custom workflows or folders (for Claude/Cursor compatibility)
  </code_patterns>
</analysis_areas>

<instructions>
  ACTION: Claude, run a deep analysis (favor SaaS/AI idioms). Note anything agent-specific (e.g., Cursor hooks).
  DOCUMENT: Detected tech stack, patterns, folder structure, and feature coverage.
  IDENTIFY: Work completed, major decisions, and where AI can plug in for automation.
  NOTE: Custom AI-related plumbing/workflows, if present.
</instructions>

</step>

<step number="2" subagent="context-fetcher" name="gather_product_context">

### Step 2: Confirm/Collect Product Context

Prompt the user for any missing high-level details or team preferences. Always prefer explicit user vision if provided.

<context_questions>
  Based on code analysis, I recognize an AI-enabled procurement/contracting platform.

  Please clarify or confirm:
  1. **Product Vision**: (summarize, or ask: "What procurement pain do you solve? Who uses the product?")
  2. **Integrations**: Any APIs to include (SAM.gov, LoopNet, etc) that aren't obvious in codebase?
  3. **Roadmap**: Major features planned, or refactor goals.
  4. **Team/AI Agent Preferences**: Coding standards, review process, or AI plugin needs (e.g., Cursor custom commands)?
</context_questions>

<instructions>
  ACTION: Claude, prompt user directly and merge their answers with findings above.
  INTEGRATE: Blend user-provided context, code findings, and roadmap.
  PREPARE: Unified summary for phase 3.
</instructions>

</step>

<step number="3" name="execute_plan_product">

### Step 3: Generate/Update Product Layer

Feed all technical and product context into `plan-product.md` flow. This ensures `.agent-os/product/` always matches reality—critical for accurate AI-driven workflows.

<execution_parameters>
  <main_idea>[USER CONFIRMED VISION + CODE ANALYSIS]</main_idea>
  <key_features>[IMPL + PLANNED FROM ANALYSIS AND USER]</key_features>
  <target_users>[AS CONFIRMED/UPDATED BY USER]</target_users>
  <tech_stack>[FULL, WITH VERSIONS/DEPLOYMENT]</tech_stack>
</execution_parameters>

<execution_prompt>
  @.agent-os/instructions/core/plan-product.md

  Installing Agent OS into existing AI Sourcing Platform.

  Product vision: [as above]
  Key features completed: [list]
  Up next / roadmap: [list]
  Tech stack: [detailed]
  User/team custom preferences: [notes]
</execution_prompt>

<instructions>
  ACTION: Run plan-product.md using unified summary/context.
  VERIFY: `.agent-os/product/` aligns to codebase and roadmap.
</instructions>

</step>

<step number="4" name="customize_generated_files">

### Step 4: Finalize Product/Roadmap Layer

Validate/adjust the generated docs to reflect actual implementation details and agent automation hooks.

<customization_tasks>
  <roadmap_adjustment>
    - Add done features to Phase 0
    - Move what's shipping/-WIP to Current
    - Document future phases by actual product direction
  </roadmap_adjustment>
  <tech_stack_verification>
    - Detail stack (frameworks, DB, auth, infra)
    - Flag any missing API or workflow integrations
    - Note dev vs. prod tooling differences
  </tech_stack_verification>
</customization_tasks>

<roadmap_template>
  ## Phase 0: Done
  - [x] [COMPLETE_1]
  - [x] [COMPLETE_2]

  ## Phase 1: WIP
  - [ ] [IN_PROGRESS_1]

  ## Future
  - [ ] [FUTURE_FEATURE]
</roadmap_template>

</step>

<step number="5" name="final_verification">

### Step 5: Completion & Agent OS Ready Check

Confirm readiness of Agent OS and product instructions for AI agent workflows. Output checklist and next actions for the user.

<verification_checklist>
  - [ ] `.agent-os/product/` exists and matches codebase
  - [ ] Docs show real stack, features, and user goals
  - [ ] Roadmap and phases up to date
  - [ ] Standards and custom AI patterns present if needed
</verification_checklist>

<summary_template>
  ## ✅ Agent OS Initialized (Claude/Cursor Ready)

  Your codebase and context are now fully documented for Claude/AI workflows.

  What’s ready:
  - `.agent-os/product/` layer (architecture, vision, and real roadmap)
  - Tech stack, key patterns, coding and review conventions
  - Next: Review, tune docs, then run your next Agent OS spec:
    ```
    @.agent-os/instructions/core/create-spec.md
    ```
  For full usage: [Agent OS README](https://github.com/buildermethods/agent-os)
</summary_template>

</step>

</process_flow>

<post_flight_check>
  EXECUTE: @.agent-os/instructions/meta/post-flight.md
</post_flight_check>
