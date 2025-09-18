# CSS / Tailwind Style Guide (AI/Team Standard)

**Always use the latest version of Tailwind CSS for all styling.**  
Custom utilities/components should be minimized except where reusability or cross-framework consistency is required.

---

## Multi-line Tailwind CSS Class Formatting (Universal Standard)

- Write Tailwind classes in multi-line format for all HTML/JSX/TSX/ERB markup.
- **Order lines by breakpoint (smallest at top):**
  - Line 1: no breakpoint (default/mobile).
  - Next lines: ascending (xs, sm, md, lg, xl, 2xl).
- **One line per breakpoint**:  
  - e.g. `xs:`, `sm:`, `md:`, etc.
  - Use the custom `xs` breakpoint (400px) as standard across-browser minimum width.
- **State classes (hover, focus):**
  - Always on **dedicated line(s) below responsive lines** for clarity.
- **Include any custom CSS classes at the very start of the first line**.
- **Align all lines vertically** for scan/readability (even in long tag blocks).
- **Dark mode:** Always group `dark:` variants with their respective base classes, at the same breakpoint line.

---

### Example (recommended structure)

<div class=" custom-cta bg-gray-50 dark:bg-gray-900 p-4 rounded cursor-pointer w-full hover:bg-gray-100 dark:hover:bg-gray-800 xs:p-6 sm:p-8 sm:font-medium md:p-10 md:text-lg lg:p-12 lg:text-xl lg:font-semibold lg:2-3/5 xl:p-14 xl:text-2xl 2xl:p-16 2xl:text-3xl 2xl:font-bold 2xl:w-3/4 "> I'm a call-to-action! </div> ```