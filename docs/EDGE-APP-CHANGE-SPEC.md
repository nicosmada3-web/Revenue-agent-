# Edge App — Client Onboarding, Data Isolation & Command-Centre Notifications

**Change specification + access request.**
_Author: lead engineer (Claude). Date: 2026-06-28. Branch: `claude/edge-app-client-onboarding-ep8hlr`._

> **Read this first.** This document lives in the Solihull repo only because that is the
> single repository this session can reach. **None of the work below is a change to the
> Solihull School app.** It is the spec for the **Edge app** (`Jeevesbot-work/edge-app`),
> its **Supabase** backend, and the **command centre** (`b2s-command-center`). Keeping the
> spec here, and the Solihull app code untouched, _is_ the separation you asked for.

---

## 0. Why nothing is built yet (the blocker)

Per `INFRASTRUCTURE-MAP.md`, three access blockers were raised on 2026-06-17 and are still
open. Until they are closed, the Edge changes cannot be executed or even verified:

| # | I need access to | So I can | Today |
|---|---|---|---|
| 1 | `Jeevesbot-work/edge-app` repo | Read the real schema, auth, and onboarding flow | **No access** |
| 2 | Supabase project (dashboard or URL + keys) | Prove + enforce per-client data isolation (RLS) | **No access** |
| 3 | `b2s-command-center` source repo | Wire session / food-shot notifications into the dashboard | **Source unknown** |

**Founder action to unblock — see §5.** Everything below is ready to run the moment access lands.

---

## 1. Workstream A — Per-client data isolation (RLS) `CRITICAL`

**Goal:** a guarantee that Client A can _never_ load Client B's programme, sessions, or food
shots — enforced at the database, not just hidden in the UI.

**Why it matters to an investor:** this is the one failure that ends the business. "Hidden
in the app" is not a privacy guarantee; "Row-Level Security denies the query at the database"
is. This is the difference between a demo and a product you can sell on a privacy promise.

### A1. Confirm the data model
Every client-owned table must carry an owner column tied to Supabase Auth:
`programmes`, `programme_days`, `sessions`, `session_logs`, `food_shots`, `clients`.
Each needs `client_id uuid references auth.users(id)` (or a `clients.user_id` join).

### A2. Turn RLS on for every client-owned table
```sql
alter table public.programmes    enable row level security;
alter table public.sessions      enable row level security;
alter table public.session_logs  enable row level security;
alter table public.food_shots    enable row level security;
-- ...repeat for every client-owned table
```

### A3. Client can only see / write their own rows
```sql
create policy "client reads own rows" on public.food_shots
  for select using (auth.uid() = client_id);

create policy "client writes own rows" on public.food_shots
  for insert with check (auth.uid() = client_id);
-- repeat select/insert/update/delete per table
```

### A4. Coaches see their clients — without the browser anon key
Coaches read across clients **only** from the command-centre server using the Supabase
**service-role key** (server-side, never shipped to the browser), or via a `coach_clients`
mapping table with a dedicated policy. The service-role key must never appear in any
`NEXT_PUBLIC_*` variable.

### A5. Prove it (the deliverable that convinces diligence)
Automated test: sign in as Client A, attempt to read Client B's `food_shots` / `sessions`
by id → must return **zero rows**. Repeat for insert/update/delete. Output a short
pass/fail privacy report. **This report is what you hand an investor**, not a verbal assurance.

---

## 2. Workstream B — Session & food-shot notifications

**Goal:** the command centre tells you, per client, what **has** and **has not** happened —
completed sessions, missed sessions, and food shots submitted.

There are two fundamentally different signals, and the "haven't" one is the part most apps
get wrong:

### B1. "Has happened" — event-driven (easy, reliable)
A completed session or a submitted food shot is a **row insert** in Supabase. Hook it:
- **Supabase Database Webhook** on `insert` to `food_shots` / `session_logs` →
- calls a command-centre endpoint (e.g. `/api/events`) and/or a Supabase Edge Function →
- fans out to the chosen channels (see B3).

This is the proven pattern you already ship in Solihull: `netlify/functions/coach-data.js`
pulls submissions and **aggregates them by person** (`student||squad`, sorted by `lastSeen`).
The Edge command centre does the same against Supabase tables instead of Netlify Forms.

### B2. "Has NOT happened" — scheduled gap-check (the important one)
Absence is not an event — no row is inserted when a client _skips_. So you need a scheduled
sweep:
- A daily/▾hourly job (**Supabase `pg_cron`** or **Vercel Cron** hitting a command-centre route)
- For each active client, compare **expected** sessions for the window (from their programme)
  against **logged** sessions → anything missing is flagged "missed".
- Same logic for food shots vs. the client's expected meals/day.

Without B2 you can only ever be notified about activity, never inactivity — which is exactly
the "they haven't done it" alert you asked for.

### B3. Delivery channels (pick per urgency)
| Channel | Use for | Tech |
|---|---|---|
| Command-centre live badge | Always-on "who's on track" board | Supabase Realtime subscription |
| Push notification | "Barry missed today's session" | Web Push / FCM |
| Email / SMS | Daily digest or red-flag escalation | Resend / Postmark / Twilio |

Recommended v1: **Realtime board + one daily digest email**, then add push for red-flags.
(Note: the website's own form-submit email alerts are logged as _"NOT yet confirmed set up"_ —
so assume email delivery needs configuring from scratch, not reusing.)

### B4. Onboarding tie-in (so notifications are meaningful)
A "missed session" alert is only correct if the client has a programme loaded. So onboarding
must, atomically, on new-client creation:
1. Create the `auth.users` record + send the app invite.
2. Assign a **programme template** and clone it into that client's own rows (their bespoke copy).
3. Stamp the expected session/meal schedule that B2 checks against.

If step 2/3 is skipped, the gap-check has nothing to compare to — this is the most likely
"new client onboarded but dashboard shows nothing" bug, and the spec closes it.

---

## 3. Workstream C — Account / host consolidation

**Goal:** remove the failure points and handover risk in the current sprawl (2 GitHub
accounts, 2 Vercel projects, 7 Netlify sites).

| Area | Now | Target |
|---|---|---|
| GitHub | `nicosmada3-web` + `Jeevesbot-work` | One org; Edge + command-centre + Solihull as repos under it |
| Vercel | `edge-app`, `b2s-command-center` | Keep both projects, one team, shared env-var groups |
| Netlify | 7 sites (`back2strongonline`, `solihull-rugby` + 5 dupes/orphans) | Keep the 2 live; retire `inspiring-sawine-c9937d`, `solihull`, `back2strong-drift-check`, `steady-fudge-2b8978` **after** confirming no live traffic |
| Secrets | Supabase keys location unconfirmed | Service-role key server-only; anon key client-only; audited |

**Hard rule:** nothing is deleted without an explicit, per-item go-ahead. Consolidation is
mostly dashboard work (access transfers, DNS, env vars) — little of it is code in any repo.

---

## 4. Sequencing

1. **Close the blockers (§5).** Nothing else can start.
2. **Workstream A (RLS) + the proof report.** Highest stakes, days not weeks.
3. **Workstream B1** (has-happened events) — fast, reuses the Solihull pattern.
4. **Workstream B2** (gap-check) + **B4** (onboarding stamp) — delivers the "haven't done it" alert.
5. **B3** delivery polish (push for red-flags).
6. **Workstream C** consolidation, item by item with go-aheads.

---

## 5. Access request — founder action to unblock

To execute the above I need, in order of priority:

1. **Edge app repo** — add `Jeevesbot-work/edge-app` to this session's allowed repos
   (or move it under the `nicosmada3-web` org).
2. **Supabase** — invite `nicosmada3@googlemail.com` to the Supabase project as a member,
   **or** provide `NEXT_PUBLIC_SUPABASE_URL`, the **anon** key, and the **service-role** key
   (service-role shared securely, never pasted into a repo).
3. **Command-centre source** — tell me which repo `b2s-command-center` deploys from and add it.
4. **Vercel** — read access to the `edge-app` and `b2s-command-center` projects (env-var names).

The moment #1 and #2 land, I will run the Workstream A privacy test and send you the pass/fail
report — the evidence-based version of "how foolproof is it," instead of an assurance.
