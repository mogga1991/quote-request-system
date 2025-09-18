# HTML Style Guide (Modern SaaS/AI Team Standard)

---

## General Structure

- **Indent with 2 spaces** (never tabs).
- **Each nested element** starts on a new line, properly indented, for maximum readability.
- If child elements/content span multiple lines, **place content between tags on its own indented line**.
- Always **close tags** (`>`) at the end of the last attribute line (not a separate line).

---

## Attribute Formatting

- **Each attribute** should appear on its own line.
- **Align all attributes vertically** beneath the opening tag for a uniform look.
- **Keep the closing `>`** directly after the last attribute—never on a new, separate line.
- **Boolean attributes** (like `disabled`, `checked`) do not require a value.
- **Event handlers** (`onclick`, etc.) if present, should come after static/layout attributes.

---

## Class and Style Conventions

- **Apply the multi-line Tailwind class convention** from the CSS guide.
- If using React/JSX: `className` follows all formatting above.
- **Order attributes** as: id, class, data-attr, style, ARIA, src/href, role, others, event handlers.

---

## Example: Recommended HTML Structure

<div class="container"> <header class="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4"> <h1 class="text-primary dark:text-primary-300"> Page Title </h1> <nav class="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4"> <a href="/" class="btn-ghost"> Home </a> <a href="/about" class="btn-ghost"> About </a> </nav> </header> </div> ```
Accessibility & Semantic Best Practices
Use semantic tags: <header>, <main>, <nav>, <section>, <footer>.

Always provide alt="" for all <img> tags—even if decorative.

Use ARIA attributes only when necessary (never as a substitute for semantic HTML).

Interactive elements must be navigable by keyboard (tabindex, etc.) when applicable.

