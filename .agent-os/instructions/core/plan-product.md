---
description: Product Planning & AI Agent Readiness (Agent OS Modern Template)
globs:
alwaysApply: false
version: 5.0
encoding: UTF-8
---

# Product Planning Rules (AI Agent & SaaS Optimized)

## Overview

Generate all foundational product docs for new or existing projects, structured for AI/agent consumption and rapid product evolution. Emphasizes precision, auditability, and full-feature traceability across specs, tech stack, roadmap, and mission.

<pre_flight_check>
  EXECUTE: @.agent-os/instructions/meta/pre-flight.md
</pre_flight_check>

<process_flow>

<step number="1" subagent="context-fetcher" name="gather_user_input">

### Step 1: Gather ALL User/Product Inputs

Collect and validate, blocking forward progress if missing:
- **Main idea** (what the product is, for whom, and why)
- **3+ key features**
- **At least 1 target user/persona**
- **Tech stack** (minimum: framework, db, deploy/infra)
- **Inside initialized project folder?**

If any are missing, pause and prompt user using:

Please provide the following before we can continue:

Product main idea

Three or more key features

Target users/personas (at least 1)

Tech stack preferences

Confirm that the app directory is initialized


If ambiguous, fetch additional info from:
- `@.agent-os/standards/tech-stack.md`
- `@.claude/CLAUDE.md`
- Cursor user rules/environment

</step>

<step number="2" subagent="file-creator" name="setup_docs_structure">

### Step 2: Create Product Documentation Structure

- `.agent-os/product/`
  - `mission.md`          — Full product vision and detail
  - `mission-lite.md`     — One/three sentence AI-loadable summary
  - `tech-stack.md`       — Architecture and dependencies overview
  - `roadmap.md`          — Phased feature plan

Automatically validate write permissions, avoid overwrites, ensure skeleton is in place before populating sections.

</step>

<step number="3" subagent="file-creator" name="write_mission_md">

### Step 3: Write Rich Mission File (`mission.md`)

Template:

Product Mission
Pitch
[1-2 sentence elevator pitch]

Users
[Personas: summarized]

The Problem
[PROBLEM STATEMENT]
[What problem do you solve?]
[Quantify the impact; add pain metrics if possible.]
Our Solution: [How your product addresses this clearly]

Differentiators
[What’s unique?]
Unlike [alternative/competitor], we [advantage/benefit], resulting in [evidence or metric].
(Write 2–3, backed by facts/evidence.)

Key Features
Core:

[Feature Name]: [Short user-focused value statement]

...
Collaboration/Advanced:

[Feature Name]: [Short user-focused value statement]

(Total: 8–10 features, grouped into "Core" and optionally "Collaboration"/other categories.)

text

</step>

<step number="4" subagent="file-creator" name="write_tech_stack_md">

### Step 4: Document Tech Stack (`tech-stack.md`)

Template fields:
- **application_framework:** [Next.js 15, etc]
- **database_system:** [Supabase, Neon, etc]
- **frontend_framework:** [React, etc]
- **import_strategy:** [importmaps, node, etc]
- **css_framework:** [Tailwind 3.x, etc]
- **ui_component_library:** [e.g. shadcn-ui]
- **fonts_provider:** [Google Fonts, etc]
- **icon_library:** [Lucide, etc]
- **devops_tooling:** [Vercel, Railway]
- **hosting:** [Vercel, etc]
- **deployment_solution:** [Vercel, CI/CD, etc]
- **code_repository_url:** [repo link]

Resolve any unclear or missing values by checking project files, standards, or prompting the user before continuing.

</step>

<step number="5" subagent="file-creator" name="write_mission_lite_md">

### Step 5: Write Condensed Mission File (`mission-lite.md`)

Template:
Product Mission (Lite)
[Elevator Pitch]
[1–3 sentence summary: key value, primary user(s), main differentiator. Omit less critical detail for context bandwidth.]

text
**Purpose:** Fast-load context for agents (Claude, Cursor) and tools limited by token/context window.

</step>

<step number="6" subagent="file-creator" name="write_roadmap_md">

### Step 6: Phased Product Roadmap (`roadmap.md`)

Use ~3–7 features per phase. Add phase goals, names, criteria, and clear checkboxes for each feature.

Product Roadmap
Phase 1: MVP
Goal: [MVP success criteria]
Success Criteria: [Objective/measurable]

Features
 [Feature] - [Who/what it serves] [effort: XS/S/M/L/XL]

Dependencies
[Dependency or API needed]

Phase 2: Key Differentiators
...

Future/Expansion Phases
...

text
(Effort scale: XS=1d, S=2–3d, M=1w, L=2w, XL=3+w. More phases as needed.)

</step>

</process_flow>

<post_flight_check>
  EXECUTE: @.agent-os/instructions/meta/post-flight.md
</post_flight_check>
Improvements/Optimizations:

Each required product facet (vision, tech, users, features, roadmap) is mapped to a clear, agent-optimized file with validation for missing fields.

Mission-Lite ensures the AI agent always has an ultra-concise single-prompt context for reasoning and workflow.

Features, users, and stack are always broken out for seamless traceability and rapid onboarding—crucial for agent or new developer use.

Ready for the next file or further personalizations!Your product planning workflow is already highly optimized for agent/human collaboration, and the file structure enforces clear, incremental progress and context. Here’s a modernized, AI/agent-native version of plan-product.md tailored for SaaS, AI automation, and rich persona/use-case/technical granularity.

text
---
description: Product Planning & Spec Setup Rules (AI/Next.js/SaaS/Claude Optimized)
globs:
alwaysApply: false
version: 5.0
encoding: UTF-8
---

# Product Planning Rules (AI-Ready, Standards-Driven)

## Overview
Generate foundational product docs—mission, tech stack, roadmap—built for rapid agent onboarding (Claude, Cursor), robust SaaS/Next.js teams, and context-bounded reasoning.

<pre_flight_check>
  EXECUTE: @.agent-os/instructions/meta/pre-flight.md
</pre_flight_check>

<process_flow>

<step number="1" subagent="context-fetcher" name="get_user_input">
### Step 1: Collect Core Inputs (Block Forward if Missing)
Collect the following (block progress if missing):
- Product main idea (short)
- List of key features (3+ minimum)
- Target users/personas (at least 1, incl. business context)
- Tech stack preferences (framework, infra, db, etc)
- Project initialization state (confirm in correct dir)

If missing, prompt:
Please provide:

Product main idea

3 or more key features

1 or more user personas

Tech stack preferences

Confirm app project is initialized

text

<DATASOURCE_FALLBACK>
- @.agent-os/standards/tech-stack.md
- @.claude/CLAUDE.md
- Cursor user config
</DATASOURCE_FALLBACK>
</step>

<step number="2" subagent="file-creator" name="init_docs_structure">
### Step 2: Create `.agent-os/product/` Docs Skeleton

Create:
- `mission.md` (full product narrative: who/why/problem/solution/value/users/personas/problem/alternatives)
- `mission-lite.md` (fast context—pitch + 1-3 sentence summary)
- `tech-stack.md`: All tech, framework versions, db, infra, deploy, repo, artifact links
- `roadmap.md`: Phased, effort-labeled, user-impactful feature plan

Validate: never overwrite; ensure write perms; skeleton in place before populating.
</step>

<step number="3" subagent="file-creator" name="write_mission_md">
### Step 3: Write Full `mission.md`

Template:
Product Mission
Pitch
[short—what, for whom, why]

Users & Personas
[Persona Name] ([role/context]): pain points/goals/behaviors

The Problem
Title + 1-2 sentences. Add data if possible.

Our Solution: 1 line

Differentiators
[Alternative], We: [unique property], [benefit].

Key Features
Core: [short, 6-8]

Advanced/Collaboration: [2-4]

text
</step>

<step number="4" subagent="file-creator" name="write_tech_stack_md">
### Step 4: Write `tech-stack.md`
Fields:
- Framework [Next.js vX]
- Database [type, version]
- Auth/infra [Supabase, Vercel, etc]
- UI kit [Shadcn, Tailwind]
- Repo, deployment, APIs, etc.

Prompt for gaps.
</step>

<step number="5" subagent="file-creator" name="write_mission_lite_md">
### Step 5: Write `mission-lite.md`
Single-sentence pitch plus concise summary of value, target, differentiator (1-3 sentences).
</step>

<step number="6" subagent="file-creator" name="write_roadmap_md">
### Step 6: Write `roadmap.md`
- At least 3 phases, 3–7 features per phase
- Feature: [Checkbox] [What/Who/Why] `[Effort: XS, S, M, L, XL]`
- Dependencies per phase, measurable success criteria, phase goal
</step>

</process_flow>

<post_flight_check>
  EXECUTE: @.agent-os/instructions/meta/post-flight.md
</post_flight_check>