# Tech Stack Defaults (Agent OS / SaaS & AI Projects)

## Context

These are global defaults for Agent OS projects.
_All items can and should be overridden in `.agent-os/product/tech-stack.md` per project or environment as needed._

---

### Core Application Frameworks

- **App Framework:** Next.js 15+ (App Router, React 19+)
- **Language(s):** TypeScript (strict), JavaScript (ES2022+)
- **Primary Database:** PostgreSQL 16+/Neon/Supabase Hosted
- **ORM/Client:** Drizzle ORM, Prisma (as fallback/legacy)
- **API Layer:** Next.js API routes, FastAPI for service APIs, Edge runtime where possible

---

### Frontend

- **JS Framework:** React 19+
- **Build Tool:** Vite or Next.js built-in build
- **Import Strategy:** Node.js native modules
- **Package Manager:** pnpm (preferred), npm (fallback), yarn (legacy)
- **CSS Framework:** TailwindCSS 4.0+
- **UI Components:** shadcn/ui or custom, modular atomic components
- **Font Provider:** Google Fonts (self-hosted preferred for perf)
- **Icon Library:** Lucide React, Heroicons
- **SVGs:** Inline import + externalization for large sets

---

### Infrastructure & DevOps

- **App Hosting:** Vercel (Prod/Preview), DigitalOcean/Railway optional for staging/dev
- **Database Hosting:** Neon, Supabase, or DigitalOcean Managed PostgreSQL
- **Database Backups:** Automated, daily minimum, retained 7–30 days
- **Asset Storage:** Amazon S3 (or Supabase storage for dev), with private/signed URLs
- **CDN:** Vercel Edge, CloudFront optional extension
- **CI/CD:** GitHub Actions, Vercel previews, auto PR deploys
- **CI Triggers:** All pushes/PRs for preview, main for prod
- **Tests:** All unit, integration, and E2E tests run on PR and main

---

### Branching & Environments

- **Production:** main branch
- **Staging:** staging branch
- **Preview:** Vercel preview per PR

---

### Deployment & Environment

- **Deploy Target:** Vercel auto deploy (preferred)
- **Fallback:** Docker Compose for local/dev parity
- **Environment Management:** `.env` files, Vercel secrets

---

### Security & Compliance

- **Secrets:** Environment variables only, never in source
- **Data Security:** SSL enforced, Postgres RLS for all sensitive data
- **SOC2/GDPR:** Prepare support for enterprise projects

---

### Monitoring, Analytics, & Misc

- **Error/Performance:** Sentry (primary), custom logging as needed
- **Analytics:** Google Analytics 4, Posthog for product analytics

---

### Agent/AI/Integration Notes

- For agent workflows (Claude, n8n, Copilot, etc), always honor project overrides before falling back to these defaults.
- If tool/language/framework not specified in the project’s `tech-stack.md` or `.env`, prompt user for explicit selection before proceeding.

---

**Use these settings as a base—always override in each project's `.agent-os/product/tech-stack.md` as needed for stack changes, experimental tools, legacy projects, or compliance requirements.**

# Tech Stack Defaults (Agent OS / Modern SaaS)

## Context

These are **default technologies** for new Agent OS projects.  
Override at per-project level in `.agent-os/product/tech-stack.md` as needed.

---

### Core Application Frameworks  
- **App Framework:** Next.js 15+ (App Router enabled)
- **Language:** TypeScript (strict mode), ES2022 Javascript
- **Database:** PostgreSQL 16+ (Neon/Supabase managed preferred)
- **ORM:** Drizzle ORM (primary), Prisma (legacy)
- **API Layer:** Next.js API routes, FastAPI (Python microservices as needed)

---

### Frontend/UI  
- **React:** 19+  
- **Build Tool:** Next.js (built-in), Vite (optional for SPA/tools)
- **CSS:** TailwindCSS 4.0+
- **UI Components:** shadcn/ui, custom atomic components
- **Fonts:** Google Fonts (self-host, performance tuned)
- **Icons:** Lucide React, Heroicons

---

### Infrastructure & DevOps  
- **Hosting:** Vercel (production), Railway/DigitalOcean for staging/dev (optional)
- **Deployment:** Auto deploy via Vercel, with CI via GitHub Actions
- **Environments:** main (prod), staging (pre-prod), preview (on PR)
- **Database Hosting:** Neon/Supabase managed Postgres
- **Assets:** Amazon S3 or Supabase Storage, signed URLs
- **CDN:** Vercel Edge CDN; CloudFront as secondary

---

### Tooling  
- **Package Manager:** pnpm (preferred), npm (compatibility)
- **Node Version:** 20+ LTS
- **Lint/Format:** ESLint (airbnb/next/ts), Prettier
- **Testing:** Jest/Testing Library, Playwright (E2E)

---

### Security & Monitoring  
- **Secrets:** Env vars only, never commit to source
- **Monitoring:** Sentry
- **Analytics:** Posthog, Google Analytics 4

---

### Agent/AI Integration  
- Claude/Apollo/Cursor agent workflows supported  
- n8n for automations  
- All per-project overrides in `.agent-os/product/tech-stack.md` take precedence

---

**Note:**  
If your project is not Next.js or has bespoke requirements (Rails, Python, etc.), update your `.agent-os/product/tech-stack.md` with exact versions/stacks!  

What to Do for Maximum Consistency and Low-Error Deployments
1. Ruthlessly Standardize Your Tech Stack
Pick “one default stack” (e.g., Next.js 15 + TypeScript + Tailwind + Supabase/Neon + Vercel). If a project needs a deviation, make it explicit in .agent-os/product/tech-stack.md so agents/teammates are never guessing.

Always use the same package manager (e.g., pnpm). Never mix with npm or yarn in the same codebase.

One linter/formatter setup: ESLint (Next.js config + Prettier).

2. Lock All Versions
Pin all project dependencies in package.json, pnpm-lock.yaml.

For all core SAAS infrastructure (DB, build, etc.), document exact versions in your tech-stack.md so every deploy is repeatable.

3. Enforce All Style/Lint/Test Rules Pre-Commit and in CI
Use lint-staged or Husky to automatically lint, type-check, and format before any commit.

Block PRs if any tests, lints, or type checks fail in GitHub Actions and Vercel deploy previews.

4. Use a Written (Agent-Consumable) Release/Deploy Checklist
From “final merge to main” through production deploy, have a simple, clear checklist agents or humans must follow:

Full test suite pass

Lint & type-check pass

Docs and .env files up to date

All database/schema migrations run and idempotent

Verify staging deploy before merging to main

5. All Secrets/Config as Environment Variables
Absolutely no hardcoded API keys, database URLs, etc.

Always update .env.example and reference in your docs/onboarding.

6. Auto Deploy + Rollback via Vercel
Use Vercel for all deploys so you have build logs, atomic rollbacks, and preview URLs.

Every PR should have its own deploy preview.

7. Single Source of Truth for Tech/Infra
Keep your standards/tech-stack.md as your true default, always referenced and overridden as needed in each project.

Agents always load this first (unless overridden).

8. Never Skip or “Quickfix” Checklist/Standards
Avoid “oh this one file didn’t pass lint but let’s merge anyway for speed.” Enforce that all team members and AI agents must respect all checklist steps—no exceptions, not even for “quick hotfixes”.

What to Avoid
Don’t “mix and match” different frameworks, build tools, or deployment providers unless you explicitly document + automate the variations.

Avoid “snowflake” code styling or one-off patterns.

Don’t push code with eslint-disable or test skips unless there is an explicit documented reason/review.