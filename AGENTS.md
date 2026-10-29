<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Ruseè Kimono project rules

## Product intent

Build a production-ready, editorial e-shop for one kimono product family with multiple design, colour, and size variants. The storefront should feel elegant and tactile without making checkout, accessibility, or performance secondary to animation.

## Required reading

Before changing implementation:

1. Read `ARCHITECTURE.md` for boundaries, data ownership, and payment rules.
2. Read `TODO.md` and work from the first unblocked task in the current phase.
3. For Next.js behavior, read the relevant local guide under `node_modules/next/dist/docs/` as required above.
4. Use `../prev_src_animation_project_with_admin` only as a reference. Do not modify it or copy it wholesale.

## Command ownership

- Codex implements code and command scripts; the user runs every PowerShell, npm, Node.js, Git, database, build, test, migration, deployment, and development-server command.
- Put repeatable command workflows in reviewed PowerShell scripts under `scripts/` and give the user the single command to run.
- Use the project-local RTK CLI for compact supported output where appropriate. RTK refers to the `rtk-ai` command-output tool, not Redux Toolkit.
- Track the active execution phase and verification status in `sprints.md`.

## Non-negotiable engineering rules

- Use the App Router, TypeScript strict mode, Server Components by default, and Client Components only at interaction boundaries.
- Use MySQL database `next_kimono` for products, variants, stock, customers, orders, payments, and admin sessions. Never store commerce records in JSON files.
- phpMyAdmin is an operator interface only. Application code connects directly to MySQL.
- Never store card data, CVV, bank passwords, payment API secrets, or raw authorization headers in the database or logs.
- Never mark an order paid from a browser success URL. Verify it through a signed webhook or a server-to-server provider query.
- Every payment webhook must be authenticated, idempotent, persisted, and safe to replay.
- Price and stock are authoritative on the server. Never trust totals, discounts, SKU data, or payment status sent by the browser.
- Store money as integer minor units (`amount_minor`, euros in cents), never floating-point values.
- Place secrets only in local/hosting environment variables. Commit only placeholders in `.env.example`.
- Do not expose generic `USERNAME` or `PASSWORD` variables to browser code. Use purpose-specific names and never prefix secrets with `NEXT_PUBLIC_`.
- Preserve order and payment history. Prefer status transitions and audit events over destructive edits.
- Database changes require repeatable migrations. Do not make an unrecorded production-only schema change in phpMyAdmin.

## Reference-project policy

Patterns that may be adapted from `../prev_src_animation_project_with_admin`:

- GSAP registration and cleanup conventions.
- Lenis/ScrollTrigger synchronization.
- Central animation timing constants.
- Reduced-motion behavior.
- CSS design tokens and responsive spacing.
- Editorial admin navigation and server-action forms.
- `server-only` boundaries for sensitive modules.

Patterns that must not be reused for commerce:

- `src/data/*.json` as mutable storage.
- Filesystem writes for orders, inventory, payments, or sessions.
- A deterministic hash used directly as the admin session cookie.
- Global smooth scrolling or animated transitions on checkout, payment return, or admin data-entry pages.
- Random transition styling that makes the brand or navigation behavior inconsistent.

## Frontend and animation rules

- Tailwind CSS v4 and CSS custom properties define the design system.
- Prefer `next/font/local` for licensed local fonts; document font licensing before committing font files.
- Use CSS for simple state changes, Motion for component/layout interaction, and GSAP for orchestrated editorial or scroll sequences.
- One feature should have one animation owner. Do not make Motion and GSAP control the same property on the same element.
- All GSAP effects must use scoped selectors/refs and clean up timelines, triggers, and listeners.
- Honor `prefers-reduced-motion`; core content and commerce actions must work with animation disabled.
- Keep product selection, cart, checkout, payment-return, and admin workflows immediate and predictable.
- Use semantic controls, visible focus states, keyboard support, and descriptive image alternative text.

## Definition of done

A task is complete only when its relevant type checks, linting, tests, and production build pass; error/loading/empty states are handled; mobile and keyboard behavior are checked; and `TODO.md` is updated. Payment work additionally requires duplicate-webhook and failed-verification tests.
