---
description: Agent OS Pre-Flight Rules (Agent/AI Standards)
globs:
alwaysApply: false
version: 1.1
encoding: UTF-8
---

# Pre-Flight Rules (All Agent OS Instructions)

**Before executing any process_flow:**

- **MANDATORY:** For every step with `subagent=""` defined, you MUST use that exact subagent to perform the instructions. If for any reason the subagent cannot be invoked, STOP and inform the user with a diagnostic message before attempting any workaround.
- **Execute process_flow steps strictly in sequence. No skipping or reordering.**
- **Read and execute each numbered step exactly as specified. Do not improvise or consolidate steps.**
- **If clarification is needed:**  
    1. STOP execution  
    2. Ask the user specific, numbered questions detailing missing context or ambiguity  
    3. RESUME only when you have a complete and unambiguous answer
- **Templates:** Use the exact provided templates for all file/content creation. Never alter structure or omit required template sections.
