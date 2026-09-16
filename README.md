# Discovery Health Flywheel — interactive prototype

A single-process demo of a **closed-loop claims flywheel**: savings captured when a
claim is adjudicated are credited to a reinvestment pool, and that pool funds
preventative care interventions for members with open care gaps.

> **This is a prototype, not a platform.** It is one Express process with an
> in-memory ledger and a React console on top. It has no database, no
> authentication, and no connection to any real claims system. Every member,
> provider and claim in it is synthetic. Read [Scope and limitations](#scope-and-limitations)
> before showing it to anyone who might mistake it for a running system.

---

## Quick start

```bash
npm ci        # exact, reproducible install
npm run dev   # http://localhost:3000
```

Then:

```bash
npm test        # regression suite (20 tests)
npm run build   # typecheck, then bundle client + server
npm start       # serve the production build
```

No environment variables are required. Copy `.env.example` to `.env` if you want
to point the AI synthesis endpoint at a real model.

---

## How the flywheel actually computes

This is the part worth reviewing, because it is where a demo of this shape
usually goes wrong.

**Nothing is accumulated.** There is no running total anywhere in the codebase.
Every figure on the dashboard is derived from the claim and care-gap rows on
each read by `computeFinancialSummary` in [`src/lib/ledger.ts`](src/lib/ledger.ts).
Replaying a request, double-clicking a button, or restarting the process cannot
change the answer.

Two kinds of money are tracked **separately**, because conflating them
overstates the benefit:

| | Meaning | Booked when |
|---|---|---|
| **Realised admin savings** | Cash not spent on a claim we *did* pay, because a rule reduced what was payable | Claim reaches `approved` |
| **Avoided leakage** | Gross value of a claim we declined to pay at all | Claim reaches `rejected` |

```
gross savings = realised admin savings + avoided leakage
pool          = gross savings − preventative outlay
```

A claim sitting in the review queue (`flagged`) is worth **R0**. That is what
stops a caller from inflating the pool by submitting the same duplicate over
and over: each submission creates another flagged row worth nothing until a
human adjudicates it.

`/api/data` asserts these invariants on every read via `ledgerViolations` and
returns **500** rather than serving a number that does not balance.

### Adjudication rules

[`src/lib/adjudication.ts`](src/lib/adjudication.ts) is pure — same input and
same ledger state always produce the same claim, and it books no money itself.

| Rule | Check | Saving when it passes |
|---|---|---|
| V001 | Member is in the registry | — |
| V002 | Provider practice is registered | — |
| V003 | Procedure code matches the diagnosis pathway | R150 |
| V004 | Not a duplicate (same member, provider, service date) | — |
| V005 | In-network contracted tariff applies | R200 |
| V006 | Service date is within the claim window | — |

A claim auto-approves only when every rule passes *and* extraction confidence
clears 0.8. Anything else goes to a human.

---

## API

Every `POST` body is parsed with a [Zod](https://zod.dev) schema
([`src/lib/schemas.ts`](src/lib/schemas.ts)) and returns `400` with field-level
issues when it fails. Unknown identifiers return `404`.

| Method | Route | Notes |
|---|---|---|
| `GET` | `/api/data` | Whole ledger with derived totals; `500` if invariants break |
| `POST` | `/api/claim/upload` | Runs V001–V006; `201` with the adjudicated claim |
| `POST` | `/api/claim/action` | `approve` / `reject`; idempotent, reports `alreadyApplied` |
| `POST` | `/api/caregaps/trigger` | `open → intervention_sent → resolved`; `409` if the pool is short |
| `POST` | `/api/ai/synthesis` | Returns `source: "live" \| "cached"` — see below |

### AI synthesis

`/api/ai/synthesis` calls Gemini when `GEMINI_API_KEY` is set, and serves a
static narrative otherwise. The response **always** declares which one you got:

```json
{ "text": "...", "source": "cached", "reason": "GEMINI_API_KEY is not configured", "model": null }
```

The console renders a badge from that field. A fallback that is
indistinguishable from live output is how a demo ends up reporting numbers
nobody generated.

Override the model with `GEMINI_MODEL` (default `gemini-2.5-flash`).

---

## The ROI model

[`src/components/ExecutiveRoiCalculator.tsx`](src/components/ExecutiveRoiCalculator.tsx)
is an **illustrative benefit case**, not a measurement. It states everything
annually, exposes all twelve assumptions in an in-app panel with a note on how
well-founded each one is, and shows three scenarios rather than a single
number:

| Scenario | Return |
|---|---|
| Conservative | ~0.99x — roughly break-even |
| Base case | ~1.90x |
| Optimistic | ~2.63x |

Base-case benefit works out to about **0.5% of claims paid**. The return turns
mostly on the share of admissions genuinely avoidable, which is flagged in the
panel as the least validated input in the model.

---

## Repository layout

```
server.ts                  Express app: routes, validation, static serving
src/
  App.tsx                  Console shell and tab routing
  types.ts                 Shared domain types
  components/              Dashboard, claims feed, care gaps, ROI, POPIA view
  lib/
    ledger.ts              Derived financials + invariants
    adjudication.ts        Rules V001–V006 (pure)
    schemas.ts             Zod request schemas
    seed.ts                Synthetic fixtures
    ledger.test.ts         Regression suite
.github/workflows/ci.yml   npm ci → typecheck → test → build
```

---

## Scope and limitations

Known and deliberate, listed so nobody has to discover them in a demo:

- **No persistence.** The ledger is process-local and resets on restart. Every
  visitor to a deployed instance shares and can mutate the same one.
- **No authentication.** Every endpoint is open. Anyone who can reach the
  server can adjudicate claims and dispatch vouchers.
- **No audit log.** State transitions record no actor and no timestamp, so the
  time-travel audit story this concept depends on is not implemented.
- **The POPIA view is illustrative.** It demonstrates a tokenisation *concept*
  with synthetic values. It performs no real tokenisation and the identifiers
  shown are fabricated.
- **The fraud graph is static.** It renders fixed scenarios. No graph algorithm
  runs.
- **Simulation mode overwrites the live ledger.** The 90-day roadmap wizard
  replaces dashboard figures with projections. A banner marks this; the figures
  are planning projections, not measurements.
- **No integrations.** Nothing connects to a claims system, data lake, stream,
  or model-serving platform.

## Next milestones

In the order they unblock the most:

1. Persist the ledger behind an append-only event table; make the summary a view over it.
2. Authentication and per-session ledgers, so a shared deployment is usable.
3. HTTP-level authorisation plus rate limiting.
4. One real document-extraction slice on a scanned claim, replacing the mock upload path.
5. Replace ROI planning assumptions with scheme actuals, assumption by assumption.

---

*Synthetic data only. Not affiliated with, endorsed by, or connected to any
live Discovery Health system.*
