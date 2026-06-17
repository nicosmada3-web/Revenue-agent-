# INFRASTRUCTURE MAP — Back2Strong + Solihull

_Last updated: 2026-06-17 by lead engineer (Claude). Phase 1 inventory — read-only, no changes made to any live system._

> This file is the single source of truth for where everything lives. Keep it updated.

---

## Accounts & teams

| Thing | Name | ID | Notes |
|---|---|---|---|
| GitHub account A | **nicosmada3-web** | user 288026561 | Currently logged in. Holds the Solihull app + website repos. SSO-managed (can't log into 3rd parties with it). |
| GitHub account B | **Jeevesbot-work** | — | Holds the Edge client app repo. Separate login. |
| Netlify team | **nick adams** | 69f62e51ecbd5f162de12de4 | All 7 Netlify sites live here. |
| Vercel team | **nick adams' projects** | team_h5l2h8LG69oc4IsCrT6IDEnD | Edge app + command centre live here. |
| Supabase | _(project not yet inspected — see blockers)_ | — | Backend + database for the Edge app / dashboard. |

> Note: the brief mentioned accounts `nicosmada3` and `jeeves-bot`. Those exact names don't exist. The real ones are **nicosmada3-web** and **Jeevesbot-work**.

---

## GitHub repositories

| Repo | Account | Built with | Last updated | What it is |
|---|---|---|---|---|
| **Revenue-agent-** (trailing dash) | nicosmada3-web | HTML | 2026-06-17 (today) | **The Solihull School app.** Active. Default branch `claude/solihull-school-app-fx5s3z`. This is what we've been fixing. |
| Revenue-agent (no dash) | nicosmada3-web | — | 2026-06-10 | Empty/abandoned first attempt (size 0). **Orphan candidate.** |
| **edge-app** | Jeevesbot-work | TypeScript / Next.js | 2026-05-05 | **The Edge client app (Barry's app).** Deployed to Vercel. ⚠️ Not yet readable in this session — see blockers. |

> Only public repos are visible. There may be private repos under Jeevesbot-work (e.g. the command-centre source) that aren't listed yet.

---

## Live apps & where they're hosted

### 1. back2strong.online — marketing website  ✅ LIVE — DO NOT TOUCH
- **Host:** Netlify, site `back2strongonline` (id `1cf731c6-4568-41b4-a8f5-6d96d6ccff0c`)
- **URL:** https://back2strong.online
- **Status:** Deployed, healthy.
- **Forms (Netlify Forms):**
  - `reset-guide` — email capture for the PDF reset guide. **14 submissions**, last 2026-06-11. Active.
  - `strong90-audit` — the warm-lead audit. **1 submission**, last 2026-05-25. Fields: name, email + ~30 audit questions.
- ⚠️ **Email alerts on form submit are NOT yet confirmed set up** (Phase 2 item 3).

### 2. Edge app — client training + nutrition  ⚠️ PRIORITY (Barry)
- **Host:** Vercel, project `edge-app` (id `prj_GFWMEstfrVPCI1YcbuWDfv5XCOWf`)
- **URL (custom domain):** https://app.back2strong.online (also edge-app-topaz.vercel.app)
- **Built with:** Next.js (Node 24). Source: GitHub `Jeevesbot-work/edge-app`.
- **Status:** Latest production deploy READY.
- **Backend:** Supabase (each client's own training/nutrition data). **Row-Level Security NOT yet verified** — this is the top safety item.

### 3. b2s-command-center — coaches dashboard
- **Host:** Vercel, project `b2s-command-center` (id `prj_NMuRXihwsS0ccmaP63kACUkhEKQO`)
- **URL:** https://b2s-command-center.vercel.app
- **Built with:** Node. Status: latest deploy READY.
- **Source repo:** unknown/unconfirmed (no matching public repo found).

### 4. Solihull School app  ⚠️ was blank screen — FIX READY, awaiting deploy
- **Host:** Netlify, site `solihull-rugby` (id `546a5f69-1561-4e0b-9137-c58953ea0ef3`)
- **URL:** https://solihull-rugby.netlify.app
- **Built with:** Single-file HTML + React. Source: GitHub `nicosmada3-web/Revenue-agent-`, branch `claude/solihull-school-app-fx5s3z`.
- **Status:** Cause of blank screen found & fixed in code (now self-contained, no external CDN). Needs one deploy to go live.

---

## Netlify sites — full list (7) with duplicate/orphan flags

| Site | URL | Keep? | Notes |
|---|---|---|---|
| back2strongonline | back2strong.online | ✅ KEEP | The live website. |
| solihull-rugby | solihull-rugby.netlify.app | ✅ KEEP | Current Solihull app. |
| inspiring-sawine-c9937d | inspiring-sawine-c9937d.netlify.app | 🟠 DUPLICATE | Same `strong90-audit` + `reset-guide` forms as the live site = an old/duplicate copy of the website. |
| solihull | solihull.netlify.app | 🟠 DUPLICATE | Older/duplicate Solihull site. |
| back2strong-drift-check | back2strong-drift-check.netlify.app | 🟠 ORPHAN? | Purpose unclear — likely a test. |
| steady-fudge-2b8978 | steady-fudge-2b8978.netlify.app | 🟠 ORPHAN? | Auto-generated name, never renamed — likely a stray drag-and-drop deploy. |

> Nothing in this table will be deleted without an explicit go-ahead (hard rule #3).

---

## Environment variables (names only — to be confirmed)

I could not yet read the actual env var names (Vercel env + Supabase need access — see blockers). For a Next.js + Supabase app these are **typically**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only — must never be exposed to the browser)

**Flagged for verification once access is granted.** Listed here as expected, NOT confirmed.

---

## Open blockers (need founder action)

1. **Edge app repo access.** To verify Barry's data privacy (Supabase Row-Level Security) and debug his experience, I need to read `Jeevesbot-work/edge-app`. This session is currently locked to `nicosmada3-web/Revenue-agent-`. → Need that repo added to my access.
2. **Supabase access.** To confirm one client can't see another's data at the database level, I need either Supabase dashboard access or the project URL + keys.
3. **Command-centre source.** Need to know which repo `b2s-command-center` deploys from.

---

## What I'd fix first (priority order)

1. **Solihull blank screen** — fix already written, just needs one deploy. (Lowest risk, quick win.)
2. **Barry / Edge app data privacy (RLS)** — highest-stakes safety item. Blocked on repo + Supabase access.
3. **Strong90 email alert** — small, high-value. Likely a Netlify dashboard setting on the live site.
4. **Consolidation (Phase 3)** — clean up duplicates/orphans, move to one host + one GitHub account. Plan only, no action without go-ahead.
