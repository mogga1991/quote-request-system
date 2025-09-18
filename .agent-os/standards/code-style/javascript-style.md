# JavaScript (and TypeScript) Style Guide (Modern SaaS/AI Team Standard)

---

## General

- Prefer **TypeScript** (`.ts`, `.tsx`) for all new code—use strict mode by default.
- Always use **ES Modules** (`import`/`export`).
- Write all files as **modules** (`export default` or named exports).

---

## Formatting
- **Indentation:** 2 spaces (never tabs).
- **Line length:** 100 characters max (soft, for readability).
- **Semicolons:** Always use them (consistent with most major codebases and easier for agents).
- **Quotes:** Use single `' '` for JS, double `" "` for JSX/HTML/XML.
- **Trailing commas:** Always in arrays/objects/multiline params.
- **Object/array braces:** Always multiline for long or nested content.

---

## Structure

- **Variables:**
  - Always use `const` when possible; use `let` only if reassignment is required.
  - Never use `var`.
  - Use **destructuring** for objects and arrays when possible.
- **Functions:**
  - Prefer **arrow functions** for all anonymous and inline functions.
  - Use named function declarations for exports or shared logic.
- **Async/Await:**
  - Prefer `async/await` over `.then()`/`.catch()`.
  - Always handle errors (with try/catch or error boundaries).
- **Imports:**
  - Always put external imports first, then internal modules, then styles/assets.
  - Group types separately (`import type ...`).

---

## Naming

- **camelCase** for variables and regular functions.
- **PascalCase** for React components, classes, types, enums.
- **UPPER_CASE** for constants only (true constants).
- Use meaningful, explicit names for all variables/functions.

---

## React/Next.js

- Functional components only (never class components).
- Component props: always typed using TypeScript interfaces or `type`.
- Default to arrow function components:  
  `const MyComponent: React.FC<Props> = ({ ... }) => { ... }`
- **Hooks:** Use only top-level (never in conditionals or loops).
- **State/side effects:** Use appropriate hooks (`useState`, `useEffect`, custom).
- Always name custom hooks as `useSomething`.

---

## Error Handling

- Never catch errors silently.
- For async functions:  
  - Always use `try/catch`  
  - Bubble or log errors appropriately.
- In React UI: use error boundaries or surface user-facing errors when needed.

---

## Comments & Docs

- Use inline comments only when logic is non-obvious.
- Add JSDoc-style comments for exported functions/components and agent/AI workflows.

---

## Linting & Prettier

- Enforce all of the above using ESLint (airbnb, next, typescript plugins) and Prettier integrations.
- **Never commit files with lint/prettier errors.**

---

## AI/Agent Coding Instructions

- Always keep functions, variables, and files as small and logical as possible.
- One export per file unless strongly related.
- If adding/altering logic, write related tests/usage examples.
- Avoid deeply nested logic; break into helpers/utilities as needed.

---

## Example

import { useState } from "react";

interface ExampleProps {
title: string
items: string[]
}

export const ExampleComponent: React.FC<ExampleProps> = ({ title, items }) => {
const [count, setCount] = useState(0);

const handleClick = () => setCount((c) => c + 1);

return (
<section>
<h1>{title}</h1>
<button onClick={handleClick}>Increment: {count}</button>
<ul>
{items.map((item) => <li key={item}>{item}</li>)}
</ul>
</section>
);
};