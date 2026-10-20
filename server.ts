/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { ZodError, ZodTypeAny, z } from 'zod';

import { adjudicate, formatDocumentId } from './src/lib/adjudication';
import { computeFinancialSummary, ledgerViolations, withDerivedAmounts, workingSet } from './src/lib/ledger';
import {
  aiSynthesisSchema,
  careGapTriggerSchema,
  claimActionSchema,
  claimSubmissionSchema,
  formatIssues,
} from './src/lib/schemas';
import { seedCareGaps, seedClaims, seedMembers, seedProviders } from './src/lib/seed';
import { CareGap, Claim } from './src/types';

dotenv.config();

export const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(express.json({ limit: '256kb' }));

/**
 * In-memory demo ledger, seeded on boot.
 *
 * This is a prototype store: it is process-local and resets on restart, so
 * every visitor to a deployed instance shares (and can mutate) one ledger.
 * Persisting it behind an append-only event table is the next milestone -
 * see the roadmap in README.md.
 */
const members = structuredClone(seedMembers);
const providers = structuredClone(seedProviders);
const claims: Claim[] = structuredClone(seedClaims);
const careGaps: CareGap[] = structuredClone(seedCareGaps);

/** Monotonic, never reused - claim IDs must stay unique for the whole run. */
let claimSequence = 0;

/** Restores the ledger to its seeded state. Used by the test suite. */
export function resetLedger() {
  claims.length = 0;
  claims.push(...structuredClone(seedClaims));
  careGaps.length = 0;
  careGaps.push(...structuredClone(seedCareGaps));
  claimSequence = 0;
}

/** Serialises the whole ledger with all derived figures recomputed. */
function ledgerSnapshot() {
  return {
    members,
    providers,
    claims: workingSet(claims).map(withDerivedAmounts),
    claims_total: claims.length,
    careGaps,
    financialSummary: computeFinancialSummary(claims, careGaps),
  };
}

/** Parses a request body, replying 400 with field-level issues on failure. */
function parseBody<S extends ZodTypeAny>(schema: S, req: Request, res: Response): z.infer<S> | undefined {
  try {
    return schema.parse(req.body ?? {});
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Invalid request body', issues: formatIssues(error) });
      return undefined;
    }
    throw error;
  }
}

app.get('/api/data', (_req, res) => {
  const violations = ledgerViolations(claims, careGaps);

  // A ledger that cannot balance is not reportable. Fail loudly rather than
  // rendering a number nobody can defend in an audit.
  if (violations.length) {
    console.error('Ledger invariant violated:', violations);
    return res.status(500).json({ error: 'Ledger invariant violated', violations });
  }

  res.json(ledgerSnapshot());
});

app.post('/api/claim/upload', (req, res) => {
  const submission = parseBody(claimSubmissionSchema, req, res);
  if (!submission) return;

  claimSequence += 1;
  const claim = adjudicate(
    submission,
    { claims, members, providers },
    formatDocumentId(claimSequence),
  );

  claims.unshift(claim);

  res.status(201).json({
    success: true,
    claim: withDerivedAmounts(claim),
    financialSummary: computeFinancialSummary(claims, careGaps),
  });
});

/**
 * Manual adjudication of a flagged claim.
 *
 * Idempotent by construction: the endpoint only sets `status`, and every
 * financial consequence is recomputed from that status. Replaying the same
 * reject ten times books the avoided leakage exactly once.
 */
app.post('/api/claim/action', (req, res) => {
  const body = parseBody(claimActionSchema, req, res);
  if (!body) return;

  const claim = claims.find((c) => c.document_id === body.docId);
  if (!claim) {
    return res.status(404).json({ error: `No claim with document_id ${body.docId}` });
  }

  const targetStatus = body.action === 'approve' ? 'approved' : 'rejected';
  const alreadyApplied = claim.status === targetStatus;

  if (!alreadyApplied) {
    claim.status = targetStatus;
    claim.fhir_claim.status = targetStatus === 'approved' ? 'active' : 'draft';

    if (targetStatus === 'rejected') {
      claim.rejection_reason = body.reason ?? 'Declined on manual audit.';
    } else {
      delete claim.rejection_reason;
    }
  }

  res.json({
    success: true,
    alreadyApplied,
    claims: workingSet(claims).map(withDerivedAmounts),
    claims_total: claims.length,
    financialSummary: computeFinancialSummary(claims, careGaps),
  });
});

/**
 * Advances a care gap: open -> intervention_sent -> resolved.
 *
 * Only the final step spends money, and it is refused when the pool cannot
 * cover the subsidy.
 */
app.post('/api/caregaps/trigger', (req, res) => {
  const body = parseBody(careGapTriggerSchema, req, res);
  if (!body) return;

  const gap = careGaps.find((g) => g.id === body.gapId);
  if (!gap) {
    return res.status(404).json({ error: `No care gap with id ${body.gapId}` });
  }

  if (gap.status === 'open') {
    gap.status = 'intervention_sent';
    gap.intervention_notes =
      body.note ?? 'Reinvestment voucher dispatched to the member for booking.';
  } else if (gap.status === 'intervention_sent') {
    const pool = computeFinancialSummary(claims, careGaps).savings_reinvestment_pool_zar;

    if (pool < gap.subsidized_cost_zar) {
      return res.status(409).json({
        error: 'Insufficient funds in the reinvestment pool',
        required_zar: gap.subsidized_cost_zar,
        available_zar: pool,
      });
    }

    gap.status = 'resolved';
    gap.resolved_date = new Date().toISOString().split('T')[0];
    gap.intervention_notes = `Funded from the Flywheel reinvestment pool. Voucher redeemed ${gap.resolved_date}.`;
  }

  res.json({
    success: true,
    careGaps,
    financialSummary: computeFinancialSummary(claims, careGaps),
  });
});

/* -------------------------------------------------------------------------- */
/* AI synthesis                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Overridable so the model can be rolled forward without a code change. The
 * previous default, `gemini-3.5-flash`, is not a real model id: every call
 * threw, was swallowed by the catch below, and served the cached narrative
 * while the UI presented it as live output.
 */
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

let aiClient: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

/**
 * Served when the model is unreachable. The response labels it `cached` so
 * the client can badge it - a fallback that is indistinguishable from live
 * output is how a demo ends up reporting numbers nobody generated.
 */
function cachedNarrative(pool: number, openGaps: number): string {
  return `### Flywheel status (cached narrative)

This text is a **static fallback**, not model output. It is served when \`GEMINI_API_KEY\`
is unset or the model call fails, so the console stays usable offline.

* **Reinvestment pool:** R ${pool.toLocaleString('en-ZA')} available to fund preventative care.
* **Open care gaps:** ${openGaps} awaiting dispatch.
* **Suggested next step:** fund the highest-risk open gap, then re-run this synthesis
  with a model key configured for a live clinical read.`;
}

app.post('/api/ai/synthesis', async (req, res) => {
  const body = parseBody(aiSynthesisSchema, req, res);
  if (!body) return;

  const summary = computeFinancialSummary(claims, careGaps);
  const openGaps = careGaps.filter((gap) => gap.status === 'open');
  const fallback = cachedNarrative(summary.savings_reinvestment_pool_zar, openGaps.length);

  const ai = getGemini();
  if (!ai) {
    return res.json({
      text: fallback,
      source: 'cached',
      reason: 'GEMINI_API_KEY is not configured',
      model: null,
    });
  }

  const systemInstruction = `You are an analyst reporting to a medical scheme's clinical team.
Given the ledger below, explain where administrative savings were unlocked and which outstanding
care gaps the reinvestment pool should fund next. Be concrete and quantitative. Do not invent
figures that are not in the data. Address the reader as "Clinical Team". Maximum 250 words.`;

  const ledgerBrief = `Claims: ${summary.total_claims_count} total, ${summary.auto_approved_count} auto-approved, ${summary.flagged_review_count} flagged, ${summary.rejected_count} rejected.
Realised administrative savings: ZAR ${summary.realised_admin_savings_zar}.
Avoided leakage on rejected claims: ZAR ${summary.avoided_leakage_zar}.
Reinvestment pool available: ZAR ${summary.savings_reinvestment_pool_zar}.
Already disbursed to preventative care: ZAR ${summary.preventative_outlay_zar}.
Open care gaps: ${openGaps.map((g) => `${g.gap_type} (${g.risk_level} risk, R${g.subsidized_cost_zar})`).join('; ') || 'none'}.

Analyst request: ${body.prompt || 'Give a general efficiency assessment.'}`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: ledgerBrief,
      config: { systemInstruction, temperature: 0.7 },
    });

    const text = response.text;
    if (!text) throw new Error('Model returned an empty response');

    res.json({ text, source: 'live', model: GEMINI_MODEL });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown model error';
    console.warn(`Gemini call failed (${GEMINI_MODEL}), serving cached narrative:`, reason);
    res.json({ text: fallback, source: 'cached', reason, model: GEMINI_MODEL });
  }
});

/* -------------------------------------------------------------------------- */
/* Static serving                                                             */
/* -------------------------------------------------------------------------- */

const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  if (isProd) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Flywheel console listening on 0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
    console.log(`AI synthesis model: ${GEMINI_MODEL} (${process.env.GEMINI_API_KEY ? 'key configured' : 'no key - cached narrative only'})`);
  });
}

/**
 * Tests import `app` directly and drive it through supertest, so the listener
 * must not bind a port under `vitest`.
 */
if (process.env.NODE_ENV !== 'test') {
  startServer();
}
