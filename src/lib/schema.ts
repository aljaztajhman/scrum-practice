import { z } from 'zod';

export const QuestionTypeSchema = z.enum(['single', 'multi', 'tf']);

export const QuestionSchema = z.object({
  id: z.number().int().positive(),
  type: QuestionTypeSchema,
  topic: z.string().min(1),
  q: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  correct: z.array(z.number().int().nonnegative()).min(1),
  why: z.string().min(1),
});

export const QuestionBankSchema = z.array(QuestionSchema);

export type QuestionType = z.infer<typeof QuestionTypeSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type QuestionBank = z.infer<typeof QuestionBankSchema>;
