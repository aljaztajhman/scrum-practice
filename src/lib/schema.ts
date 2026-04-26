import { z } from 'zod';

export const QuestionTypeSchema = z.enum(['single', 'multi', 'tf']);

export const QuestionSchema = z
  .object({
    id: z.number().int().positive(),
    type: QuestionTypeSchema,
    topic: z.string().min(1),
    q: z.string().min(1),
    options: z.array(z.string().min(1)).min(2),
    correct: z.array(z.number().int().nonnegative()).min(1),
    why: z.string().min(1),
  })
  .superRefine((q, ctx) => {
    // Every correct index must be inside options range
    for (const idx of q.correct) {
      if (idx >= q.options.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['correct'],
          message: `correct index ${idx} out of range (options.length=${q.options.length}) on question id=${q.id}`,
        });
      }
    }

    // No duplicate correct indices
    const seen = new Set<number>();
    for (const idx of q.correct) {
      if (seen.has(idx)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['correct'],
          message: `duplicate correct index ${idx} on question id=${q.id}`,
        });
      }
      seen.add(idx);
    }

    // Type-specific shape
    if (q.type === 'single' && q.correct.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['correct'],
        message: `'single' question must have exactly 1 correct answer (id=${q.id}, got ${q.correct.length})`,
      });
    }
    if (q.type === 'multi' && q.correct.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['correct'],
        message: `'multi' question must have at least 2 correct answers (id=${q.id}, got ${q.correct.length})`,
      });
    }
    if (q.type === 'tf') {
      if (q.options.length !== 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options'],
          message: `'tf' question must have exactly 2 options (id=${q.id}, got ${q.options.length})`,
        });
      }
      if (q.correct.length !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['correct'],
          message: `'tf' question must have exactly 1 correct answer (id=${q.id}, got ${q.correct.length})`,
        });
      }
    }
  });

export const QuestionBankSchema = z.array(QuestionSchema);

export type QuestionType = z.infer<typeof QuestionTypeSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type QuestionBank = z.infer<typeof QuestionBankSchema>;
