# Development Best Practices (Agent OS & SaaS/AI Projects)

## Context

Global development guidelines—apply to all code, features, and infra in Agent OS projects.  
*Agents and humans: load “Core Principles” once per session/context; load “Dependencies” only when adding/managing libraries.*

---

<conditional-block context-check="core-principles">
IF this Core Principles section already read in current context:
  SKIP: Re-reading this section
  NOTE: "Using Core Principles already in context"
ELSE:
  READ: The following principles
</conditional-block>

## Core Principles

### 1. Keep It Simple
- Strive for fewest possible lines and clear logic
- Avoid over-abstraction/over-architecture
- Prioritize direct, maintainable solutions

### 2. Optimize for Readability
- Prefer clear, self-explanatory code to the “tricky” or “clever”
- Variable names should reveal intent; functions/components should do one understandable thing
- Comment “why” non-obvious choices were made—not “what”, which should be clear from code

### 3. DRY (Don't Repeat Yourself)
- Extract repeated logic/UI into:  
  - Utility/helper methods  
  - Shared UI components  
  - Custom hooks (React)
- Don’t duplicate business rules, DB logic, or config across files/modules

### 4. Single Responsibility & Structure
- Each file/folder/class/component = one clear job
- Related code is grouped together (feature/domain folders)
- Naming is consistent, explicit, and reveals role/purpose

### 5. Prefer Composition over Inheritance
- Favor composable functions/components over deep inheritance hierarchies

### 6. Document Edge Cases
- Note business or technical edge cases in code or docs; make failure modes/limit conditions clear for future devs/agents

---

<conditional-block context-check="dependencies" task-condition="choosing-external-library">
IF current task involves choosing an external library:
  IF Dependencies section already read in current context:
    SKIP: Re-reading this section
    NOTE: "Using Dependencies guidelines already in context"
  ELSE:
    READ: The following guidelines
ELSE:
  SKIP: Dependencies section not relevant to current task
</conditional-block>

## Dependencies

### 1. Choose Libraries Wisely (Musts)
- Add 3rd-party libraries *only* if no clean standard/library solution exists
- Prefer:
  - Most popular and actively maintained options
  - Well-documented (README/examples/typed exports)
  - Recent repo activity (commits/issues in last 6 months)
  - ≥ 500 GitHub stars or large NPM download counts

### 2. Evaluate for:
- Security issues (check advisories)
- Community usage (StackOverflow/issues)
- Needed features (no over-engineering or unnecessary bloat)

### 3. Remove Dead or Unused Dependencies
- Regularly audit and prune package.json/pnpm/requirements.txt

---

## Additional SaaS/AI Team Guidelines

- Use TDD/automated tests for all core logic and new features.
- Always type-check with strict settings (especially in TypeScript).
- Never merge code that fails ESLint, Prettier, or CI tests.
- Each PR/feature branch should be able to ship (be deployable) on its own when possible.
- Favor environment variables for secrets/config (never hardcode).
- All code reviewed by at least one peer or agent before production merge.

---

## Agent/AI Coding Notes

- Always load these best-practices at agent/session start or when context is unclear.
- If unsure between approaches, prefer simplicity/readability over premature optimization.
- Document any tricky implementation logic inline for future team and agent clarity.

---

**Strict adherence to these guidelines ensures fewer bugs, easier scaling, and rapid agent/human handoff on every project.**

