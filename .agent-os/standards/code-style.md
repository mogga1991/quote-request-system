# Code Style Guide (Agent OS / Modern SaaS, AI Team)

## Context

Universal formatting and naming rules for all code (backend, frontend, scripts) in Agent OS projects.
*Agents and humans: always load "General Formatting" once per session/context, then refer dynamically to specific file-type/tech guides below as needed.*

---

<conditional-block context-check="general-formatting">
IF this General Formatting section already read in current context:
  SKIP: Re-reading this section
  NOTE: "Using General Formatting rules already in context"
ELSE:
  READ: The following formatting rules
</conditional-block>

## General Formatting

### Indentation & Structure
- **2 spaces** for indentation (never tabs)
- Keep whitespace and line breaks clean and consistent
- Nested blocks/objects aligned for scan/read clarity

### Naming Conventions
- **Variables & Functions:** Use **camelCase** (JavaScript/TypeScript/React/Next) or **snake_case** (Python, configs, legacy). Never f1_var or all-caps unless constant.
- **Classes, Enums, Modules:** Use **PascalCase** (e.g. `UserController`, `OrderBatch`)
- **Constants:** **UPPER_SNAKE_CASE** (e.g. `MAX_FETCH_RETRIES`)
- **React Components:** `PascalCase` filenames, one per file
- **Files/Folders:** Use kebab-case (`user-profile-card.tsx`) except in frameworks that require PascalCase by convention

### String & Template Formatting
- Always use **single quotes** (`' '`) for string literals in JS/TS; double quotes (`" "`) only for HTML, JSX, GraphQL, or if interpolating.
- Use **template literals** for multi-line or interpolated strings.
- **No inline SQL/HTML unless in test, migration, or template context**.

### Code Comments & Documentation
- Document “why” above any non-obvious business, technical, or workaround code (never just “what” if code says it)
- Always update or remove stale comments alongside code changes.
- Use JSDoc or docstring comments for all exported/public functions, components, models, or agent workflows.
- **Never remove existing comments unless removing the actual code block.**

---

<conditional-block task-condition="html-css-tailwind" context-check="html-css-style">
IF current task involves writing or updating HTML, CSS, or TailwindCSS:
  IF html-style.md AND css-style.md already in context:
    SKIP: Re-reading these files
    NOTE: "Using HTML/CSS style guides already in context"
  ELSE:
    <context_fetcher_strategy>
      IF current agent is Claude Code AND context-fetcher agent exists:
        USE: @agent:context-fetcher
        REQUEST: "Get HTML formatting rules from code-style/html-style.md"
        REQUEST: "Get CSS and TailwindCSS rules from code-style/css-style.md"
        PROCESS: Returned style rules
      ELSE:
        READ the following style guides (only if not already in context):
        - @.agent-os/standards/code-style/html-style.md (if not in context)
        - @.agent-os/standards/code-style/css-style.md (if not in context)
    </context_fetcher_strategy>
ELSE:
  SKIP: HTML/CSS style guides not relevant to current task
</conditional-block>

<conditional-block task-condition="javascript" context-check="javascript-style">
IF current task involves writing or updating JavaScript/TypeScript:
  IF javascript-style.md already in context:
    SKIP: Re-reading this file
    NOTE: "Using JavaScript style guide already in context"
  ELSE:
    <context_fetcher_strategy>
      IF current agent is Claude Code AND context-fetcher agent exists:
        USE: @agent:context-fetcher
        REQUEST: "Get JavaScript style rules from code-style/javascript-style.md"
        PROCESS: Returned style rules
      ELSE:
        READ: @.agent-os/standards/code-style/javascript-style.md
    </context_fetcher_strategy>
ELSE:
  SKIP: JavaScript style guide not relevant to current task
</conditional-block>

---

## Agent/AI-Specific Rules

- At the start of each context/session, **load only the sections relevant to current file or implementation type** (avoid context overload).
- If unsure, **default to strictest discipline (e.g. always format, always comment why, always test)**
- When in doubt, ask for clarification or provide options, never guess at code style.

---

**Strict following of these patterns ensures clarity, consistency, and zero merge confusion for all agent/human contributors.**
