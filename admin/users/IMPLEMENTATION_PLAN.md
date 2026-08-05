# IMPLEMENTATION_PLAN — Marathon Digital Hub (Admin Users)

Purpose
- Provide an actionable plan to finish Milestone 1: Admin Users (full implementation, testing, and PR into marathon/v2-rebuild).

Integration branch
- marathon/v2-rebuild

Feature branch for this milestone
- marathon/users

Deliverables
- Fully working Admin Users module placed under admin/users/
  - admin-users.html (or reuse existing page if present)
  - admin-users.css (re-use global styles; only add module-specific rules)
  - admin-users.js (complete Supabase handlers and UI bindings)
  - components used: toast, modal, skeleton, card, table, pagination
  - QA checklist (admin/users/QA.md)

High-level tasks
1. Repo inspection & schema verification (no code changes) — produce PROJECT_AUDIT.md
2. Map UI elements and IDs in existing admin pages to avoid breaking HTML
3. Implement admin-users.js using existing utilities and consistent style
4. Implement module pages or integrate into existing admin page as required
5. Add skeleton loaders, empty and error states
6. Wire all actions to Supabase with error handling, confirmation dialogs, and toasts
7. Test every action end-to-end against Supabase (read/write) in a staging/testing environment
8. Create QA.md and run manual tests (buttons, forms, responsive, error cases)
9. Commit only after all tests pass; open PR into marathon/v2-rebuild

Estimated timeline (workdays)
- Repo inspection & schema mapping: 1 day
- Implementation & local testing: 1–3 days
- QA & PR prep: 0.5 day

Testing strategy
- Use a staging Supabase project or the existing project's test data
- Validate every Supabase call's success and error flows
- Validate UI on mobile, tablet, desktop
- Validate skeletons and empty states

Rollback & safety
- Do not overwrite existing files. Create new module files under admin/users/ where possible.
- If existing admin pages must be updated, keep backups and minimal diffs

Merge policy
- Open PR marathon/users -> marathon/v2-rebuild with a comprehensive checklist
- Only merge after automated/manual QA signoff


