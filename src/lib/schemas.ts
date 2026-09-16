/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Request schemas for the claims API.
 *
 * Every POST body is parsed through one of these before it reaches the
 * ledger. Previously `Number(totalClaimed)` was trusted directly, so a body
 * of `{"totalClaimed":"abc"}` wrote NaN into the dashboard totals and
 * `{"totalClaimed":-5000000}` wrote a negative one.
 */

import { z } from 'zod';

/** ZAR amounts are positive, finite and bounded well above any real claim. */
const zarAmount = z.coerce
  .number()
  .finite('Amount must be a finite number')
  .positive('Amount must be greater than zero')
  .max(10_000_000, 'Amount exceeds the maximum single-claim value');

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Service date must be formatted YYYY-MM-DD')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Service date is not a real date');

export const claimSubmissionSchema = z.object({
  memberId: z.string().trim().min(1, 'memberId is required'),
  providerPractice: z.string().trim().min(1, 'providerPractice is required'),
  totalClaimed: zarAmount,
  serviceDate: isoDate,
  cptCode: z.string().trim().min(1).default('99213'),
  icd10Code: z.string().trim().min(1).default('I10'),
});

export const claimActionSchema = z.object({
  docId: z.string().trim().min(1, 'docId is required'),
  action: z.enum(['approve', 'reject']),
  reason: z.string().trim().max(500).optional(),
});

export const careGapTriggerSchema = z.object({
  gapId: z.string().trim().min(1, 'gapId is required'),
  note: z.string().trim().max(500).optional(),
});

export const aiSynthesisSchema = z.object({
  prompt: z.string().trim().max(2000).optional(),
});

/** Flattens a Zod error into something a client can render in a toast. */
export function formatIssues(error: z.ZodError): Array<{ field: string; message: string }> {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || '(body)',
    message: issue.message,
  }));
}
