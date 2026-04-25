import { z } from 'zod';

export const QuestionTypeSchema = z.enum(['single', 'multi', 'tf']);

// Localized string: every translatable field is { en, sl }.
// Empty sl is allowed during the EN-only phase but the build-time
// validator will warn when a non-empty EN has an empty SL counterpart.
export const LocalizedStringSchema = z.object({
  en: z.string().min(1),
  sl: z.string(),
});

export const LocalizedOptionSchema = LocalizedStringSchema;

export const QuestionSchema = z.object({
  id: z.number().int().positive(),
  type: QuestionTypeSchema,
  topic: z.string().min(1), // language-neutral key
  q: LocalizedStringSchema,
  options: z.array(LocalizedOptionSchema).min(2),
  correct: z.array(z.number().int().nonnegative()).min(1),
  why: LocalizedStringSchema,
});

export const QuestionBankSchema = z.array(QuestionSchema);

export type QuestionType = z.infer<typeof QuestionTypeSchema>;
export type LocalizedString = z.infer<typeof LocalizedStringSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type QuestionBank = z.infer<typeof QuestionBankSchema>;

export type Lang = 'en' | 'sl';

// Helper: read a localized string with English fallback when SL is empty.
export function tr(s: LocalizedString, lang: Lang): string {
  if (lang === 'sl' && s.sl.length > 0) return s.sl;
  return s.en;
}
