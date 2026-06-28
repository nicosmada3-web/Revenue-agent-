# WORK LOG

_Running log so any future session starts with full context. Newest first._

---

## 2026-06-28 — Edge app access unblocked + change-spec written

### Edge app repo access — RESOLVED ✅
- Closed blocker #1 (open since 2026-06-17). `nicosmada3-web` added as a **collaborator
  (Write)** on `Jeevesbot-work/edge-app`; invite sent to `nicosmada3@googlemail.com` and
  accepted. The Edge app is now reachable from the main account.
- **Account-recovery saga (so it's never repeated):** the `Jeevesbot-work` account email was
  `nick@therevenueagent.co.uk` — no longer accessible — which blocked both password reset and
  GitHub's sudo "Confirm access" gate on the Collaborators page. Resolved by adding + verifying
  a reachable email (`n.adams3…`) on the account, then resetting through that. The dead address
  should be removed and a controlled email made primary; this is exactly the pain the
  consolidation work is meant to end.
- **Next session:** the actual Edge work (RLS, notifications) must run in a **new session
  pointed at `edge-app`** — a session scoped to `Revenue-agent-` still can't see it.

### Spec docs added (this repo, branch `claude/edge-app-client-onboarding-ep8hlr`)
- `docs/EDGE-APP-CHANGE-SPEC.md` — per-client data isolation (RLS) + privacy proof test,
  session/food-shot notifications (event-driven + scheduled gap-check), account/host
  consolidation, and the access request.
- `docs/ACCESS-SETUP-RUNBOOK.md` — the collaborator-invite path that unblocked access above.
- Solihull app code left untouched — Edge spec kept in `docs/` to keep the two systems separate.

---

## 2026-06-17 — Phase 1 inventory + Solihull blank-screen fix

### Solihull blank screen — FIXED (in code), awaiting deploy
- **Cause:** the app downloaded React, ReactDOM and a ~3MB Babel compiler from `unpkg.com` on every load and transpiled in the browser. If any download was slow/blocked (school/mobile network), the page rendered blank with no error.
- **Proof it wasn't a code bug:** compiled the JSX and ran it in a simulated browser — the login screen rendered correctly (852 chars).
- **Fix:** rebuilt `index.html` to be fully self-contained — React inlined, JSX pre-compiled, Babel + all CDN script tags removed. Zero external JavaScript dependencies now. Verified it boots in a full-document browser simulation.
- **Committed & pushed** to `nicosmada3-web/Revenue-agent-` branch `claude/solihull-school-app-fx5s3z`.
- **Also:** simplified `netlify.toml` (removed unused functions block — we use Netlify Forms).
- **Remaining:** the deploy itself must run from the founder's Mac (this cloud environment is firewalled from Netlify — 403). One-command deploy provided.

### Phase 1 inventory — DONE
- Mapped GitHub (2 accounts), Netlify (7 sites), Vercel (2 projects). Written to `INFRASTRUCTURE-MAP.md`.
- **Key findings:**
  - Edge app (Barry) is on **Vercel** at `app.back2strong.online`, source `Jeevesbot-work/edge-app` (Next.js + Supabase).
  - Coaches dashboard = `b2s-command-center` on Vercel.
  - `inspiring-sawine-c9937d` (Netlify) is a **duplicate of the website**; `solihull`, `back2strong-drift-check`, `steady-fudge-2b8978` are likely orphans.
  - Live website `back2strong.online`: `reset-guide` form (14 subs) + `strong90-audit` form (1 sub).
- **Blockers raised:** need Edge app repo access + Supabase access to verify Barry's data privacy (RLS).

### Not touched
- back2strong.online (live website) — left alone per hard rule #2.
- No files moved or deleted between hosts.
