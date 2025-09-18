---
description: Agent OS Post-Flight QA & Audit Rules (Agent/AI Standards)
globs:
alwaysApply: false
version: 1.1
encoding: UTF-8
---

# Post-Flight Rules (QA & Completion Audit)

**After completing all steps in a process_flow:**

- **QA Checklist:**
    - For each numbered step, confirm it has been fully read, executed, and delivered per its instructions.
    - For all steps specifying a subagent, confirm that:
        - The subagent was actually used to perform the action, **not bypassed or simulated**.
        - If the subagent was not used, *explicitly explain* to the user the reason for non-invocation.
    - If any step or part of a step was not executed exactly according to its instructions:
        - List each omission or deviation, specifying which part of the step was skipped, misread, or only partially fulfilled.
        - *Briefly explain* why this deviation occurred (missing data, internal error, unclear instruction).
- **Self-report:** Always report these findings immediately to the user in audit-friendly format before declaring completion.
- **Only after all findings are reported and acknowledged may the process be considered fully complete.**
