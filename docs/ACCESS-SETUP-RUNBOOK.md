# Access Setup Runbook — fastest path to "give a command, it gets done"

_Author: lead engineer (Claude). Date: 2026-06-28._

> **Chosen path: collaborator invite (not repo transfer).** It's the easiest, safest,
> reversible option and it doesn't break the live Vercel deploy links. Do Step 1 first —
> that alone unblocks the bulk of the data-isolation work. Steps 2–3 only when we're ready
> to *run* migrations against the live database.

---

## Step 1 — Give my account the Edge repos `DO THIS FIRST` ⏱️ ~90s

The session connects as **`nicosmada3-web`**. Make the two Edge repos visible to it.

1. Log in to GitHub as **`Jeevesbot-work`**.
2. Go to **`Jeevesbot-work/edge-app`** → **Settings** → **Collaborators** → **Add people**.
3. Enter **`nicosmada3-web`** → role **Write** → send invite.
4. Repeat for **`b2s-command-center`** (once you confirm which repo it deploys from — see Step 4).
5. Accept the invite from the `nicosmada3-web` account (Notifications → accept).

✅ **Result:** my next session can read the real Edge schema, auth, and onboarding code, and
open PRs against it. I can then write the RLS migration + privacy test as actual code.

---

## Step 2 — Supabase credentials `WHEN READY TO RUN` ⏱️ ~3 min

Needed only to *execute and verify* the RLS work against the live DB. Add as environment
variables (Claude web has no separate secrets vault yet):

1. In Claude Code web, click the **environment name** (cloud icon, top of the session).
2. Hover the environment → click the **settings/gear icon** → **Environment variables**.
3. Add, in `.env` format (no quotes):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   SUPABASE_SERVICE_ROLE_KEY=<service role key>
   ```
4. Set the environment's **network access** level to allow outbound to `*.supabase.co`.

⚠️ **Security caveats (real, from the docs):**
- Anyone who can edit this environment can read these values.
- `SUPABASE_SERVICE_ROLE_KEY` **bypasses RLS** — it's a master key. Rotate it in the Supabase
  dashboard after the work is done if you want a clean slate.
- The anon key is fine to expose; the service-role key is the sensitive one.

---

## Step 3 — Vercel / Netlify `MAYBE ALREADY DONE`

A Vercel integration and a Netlify integration are already connected to this session. When
you authorize them, I can read deploys, logs, and project env-var *names* for `edge-app` and
`b2s-command-center` **without** sharing any keys. No action needed unless prompted to authorize.

---

## Step 4 — Tell me the command-centre repo `1 LINE`

`b2s-command-center` deploys from an unconfirmed repo. Either tell me the repo name, or check
its Vercel project → **Settings → Git** → connected repository, and add `nicosmada3-web` as a
collaborator there too (same as Step 1).

---

## The guardrail I'll operate under

Once access lands, I'll act on commands directly for everything **read-only or non-production**
(reading code, writing RLS/test code, opening PRs, dashboards, drafts). For anything that
**writes to live client data or uses the service-role key**, I'll show you the exact change and
get a yes first — because that key bypasses every safety policy we're building. Fast on the safe
stuff, a 5-second confirm on the irreversible stuff.

---

## What I do the moment Step 1 lands

1. Read the real Edge schema + onboarding flow.
2. Write the RLS migration (per `EDGE-APP-CHANGE-SPEC.md` §1) as a PR against `edge-app`.
3. Write the automated privacy test (Client A cannot read Client B's rows).
4. After Step 2, run it and send you the **pass/fail privacy report** — the evidence-based
   answer to "how foolproof is it."
