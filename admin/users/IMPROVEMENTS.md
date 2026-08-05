# IMPROVEMENTS — Marathon Digital Hub (Initial Recommendations)

This file lists immediate improvements and priorities discovered during planning. I will expand this with concrete file references and diffs after the repository inspection.

Priority 1 — Safety & Security
- Move any admin-only operations requiring Supabase service role into secure server-side endpoints (Edge Functions). Do NOT use service role keys in client JS.
- Ensure role-based checks in Supabase RLS policies for admin/moderator roles.
- Avoid changing users' Supabase Auth passwords directly from client scripts; provide admin API endpoints.

Priority 2 — Code quality & architecture
- Consolidate repeated Supabase query logic into a small service under `admin/services/supabase.js`.
- Create reusable UI components in `admin/components/` (modal, toast, table, skeleton, card).
- Replace inline onclick handlers with event listeners bound in JS to reduce coupling.

Priority 3 — Performance & UX
- Implement skeleton loaders for heavy views (users list, machines list, transactions table).
- Lazy-load heavy components and large images.
- Use compressed images and WebP where possible.

Priority 4 — DB & data integrity
- Audit tables `profiles`, `user_machines`, `transactions`, `investments`, `deposits`, `withdrawals` for missing indices and foreign key consistency.
- Normalize columns: prefer `wallet_balance` consistently in `profiles` and ensure transactions reference `user_id`.

Priority 5 — Design & assets
- Keep existing dark-green glassmorphism and network background.
- Provide high-res versions of the network background and AI robot head image; place under `assets/images/`.


Next steps
1. Run the repository scan and populate PROJECT_AUDIT.md with findings.
2. Update IMPLEMENTATION_PLAN.md with specific file mappings and task list.
3. Start implementing admin-users once audit is complete.

