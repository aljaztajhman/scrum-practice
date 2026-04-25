import Anthropic from '@anthropic-ai/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const STYLES = [
  'first-principles',
  'find-the-flaw',
  'steel-manning',
  'counterfactual',
  'cross-framework',
  'devils-advocate',
] as const;

type Style = (typeof STYLES)[number];

const STYLE_INSTRUCTIONS: Record<Style, string> = {
  'first-principles':
    'Ask the learner to derive a Scrum rule from underlying goals, not recall it. The correct answer reasons from first principles; distractors reflect surface-level reasoning.',
  'find-the-flaw':
    'Describe a 1-2 sentence team scenario containing one Scrum violation. Ask what is wrong (single) or which violations are present (multi). Distractors are reasonable practices that are NOT violations.',
  'steel-manning':
    'Present a contrarian Scrum take in its strongest 1-sentence form (≤25 words quoted). Ask which counterargument best engages the concern without dismissing it. Distractors are dogmatic or beside-the-point.',
  counterfactual:
    'Ask "if X did not exist in Scrum, what would degrade?" — X is a rule, accountability, event, or commitment. Tests why the rule matters by imagining its absence.',
  'cross-framework':
    'Ask the learner to map a Scrum concept onto a non-Scrum framework (scientific method, OODA loop, Kanban WIP, lean, PDCA) and identify the structurally tightest mapping.',
  'devils-advocate':
    'Construct a brief scenario where it seems acceptable to violate a Scrum rule. Ask why the apparent exception is not actually valid.',
};

const CERT_DESCRIPTIONS = {
  PSM1: 'Professional Scrum Master I — Scrum framework, three accountabilities (SM, PO, Developers), five events, three artifacts and commitments, the Scrum Values, empiricism (transparency / inspection / adaptation), self-management.',
  PSPO1: 'Professional Scrum Product Owner I — PO accountability, Product Goal, Product Backlog ordering and refinement, value maximization, stakeholder collaboration, Evidence-Based Management (Current Value, Unrealized Value, Time-to-Market, Ability to Innovate).',
} as const;

type CertId = keyof typeof CERT_DESCRIPTIONS;

interface GeneratedQuestion {
  style: Style;
  topic: string;
  scrumGuideSection: string;
  type: 'single' | 'multi' | 'tf';
  q: string;
  options: string[];
  correct: number[];
  why: string;
  selfCritique: string;
  confidence: number;
}

function pickStyle(): Style {
  return STYLES[Math.floor(Math.random() * STYLES.length)] as Style;
}

function buildPrompt(cert: CertId, style: Style): string {
  return `Generate ONE original practice question for ${cert} (${CERT_DESCRIPTIONS[cert]}).

Goal: a different angle from the standard exam. Style: ${style}.

Style guide: ${STYLE_INSTRUCTIONS[style]}

LENGTH BUDGETS (hard limits — count words):
- Question text: ≤ 30 words for direct styles (first-principles, counterfactual, cross-framework). ≤ 60 words for scenario styles (find-the-flaw, steel-manning, devils-advocate).
- Each option: ≤ 18 words. No padding, no parentheticals unless essential.
- "why": ≤ 50 words.
- "selfCritique": ≤ 40 words.

Brevity discipline: cut every word that does not add information. No throat-clearing, no "this question tests…", no restating the question in options.

Hard rules:
- Marked-correct answer must align with Scrum Guide 2020 (and EBM Guide for PSPO1 if relevant). Cite the section.
- Self-critique: state the strongest argument against your marked answer.
- After self-critique, rate confidence 1–5. If < 4, output {"reject": true, "reason": "..."} — do not generate a question you are unsure about.
- All distractors plausible. No strawmen.
- Length-balance: correct option must NOT be conspicuously longest or shortest. All options similar in length.
- Type rules: "single" = exactly 4 options + 1 correct. "tf" = exactly 2 options ["True","False"] + 1 correct. "multi" = 5–7 options + 2–4 correct.

Output strict JSON only — no markdown, no commentary:
{
  "style": "${style}",
  "topic": "<short label, e.g. 'Sprint Goal'>",
  "scrumGuideSection": "<specific Scrum Guide 2020 section>",
  "type": "single" | "multi" | "tf",
  "q": "<question text>",
  "options": ["..."],
  "correct": [<0-indexed integers>],
  "why": "<≤50 words explanation grounded in the Guide>",
  "selfCritique": "<≤40 words counter-argument>",
  "confidence": <integer 1-5>
}`;
}

function validate(parsed: unknown): GeneratedQuestion | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const p = parsed as Record<string, unknown>;
  if ((p as { reject?: boolean }).reject === true) return null;
  if (typeof p.confidence !== 'number' || p.confidence < 4) return null;
  if (typeof p.style !== 'string' || !STYLES.includes(p.style as Style)) return null;
  if (typeof p.topic !== 'string' || p.topic.length < 2) return null;
  if (typeof p.scrumGuideSection !== 'string' || p.scrumGuideSection.length < 4) return null;
  if (p.type !== 'single' && p.type !== 'multi' && p.type !== 'tf') return null;
  if (typeof p.q !== 'string' || p.q.length < 10) return null;
  if (!Array.isArray(p.options) || p.options.length < 2) return null;
  if (p.options.some((o) => typeof o !== 'string' || o.length < 1)) return null;
  if (!Array.isArray(p.correct) || p.correct.length < 1) return null;
  if (
    p.correct.some(
      (i: unknown) => typeof i !== 'number' || i < 0 || i >= (p.options as unknown[]).length
    )
  )
    return null;
  if (typeof p.why !== 'string' || p.why.length < 20) return null;
  if (typeof p.selfCritique !== 'string' || p.selfCritique.length < 20) return null;
  if (p.type === 'single' && (p.options.length !== 4 || p.correct.length !== 1)) return null;
  if (p.type === 'tf' && (p.options.length !== 2 || p.correct.length !== 1)) return null;
  if (p.type === 'multi' && (p.options.length < 5 || p.options.length > 7)) return null;
  if (p.type === 'multi' && (p.correct.length < 2 || p.correct.length > 4)) return null;

  // Word-count check on length budgets
  const wc = (s: string) => s.trim().split(/\s+/).length;
  const isScenario = ['find-the-flaw', 'steel-manning', 'devils-advocate'].includes(p.style as string);
  const qLimit = isScenario ? 70 : 35;
  if (wc(p.q as string) > qLimit) return null;
  for (const opt of p.options as string[]) {
    if (wc(opt) > 22) return null;
  }
  if (wc(p.why as string) > 65) return null;
  if (wc(p.selfCritique as string) > 50) return null;

  return p as unknown as GeneratedQuestion;
}


function shuffleOptions(q: GeneratedQuestion): GeneratedQuestion {
  // T/F questions stay in fixed True/False order
  if (q.type === 'tf') return q;
  const indexed = q.options.map((opt, i) => ({ opt, original: i }));
  for (let i = indexed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexed[i], indexed[j]] = [indexed[j]!, indexed[i]!];
  }
  const correctSet = new Set(q.correct);
  const newOptions = indexed.map((x) => x.opt);
  const newCorrect: number[] = [];
  indexed.forEach((x, newIdx) => {
    if (correctSet.has(x.original)) newCorrect.push(newIdx);
  });
  newCorrect.sort((a, b) => a - b);
  return { ...q, options: newOptions, correct: newCorrect };
}

async function generateOnce(
  client: Anthropic,
  cert: CertId,
  style: Style
): Promise<GeneratedQuestion | null> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1200,
    messages: [{ role: 'user', content: buildPrompt(cert, style) }],
  });
  const block = response.content[0];
  if (!block || block.type !== 'text') return null;
  const text = block.text.trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return null;
  }
  const validated = validate(parsed);
  if (!validated) return null;
  return shuffleOptions(validated);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server not configured: missing ANTHROPIC_API_KEY' });
    return;
  }
  const certParam = (req.query.cert as string | undefined)?.toUpperCase();
  if (certParam !== 'PSM1' && certParam !== 'PSPO1') {
    res.status(400).json({ error: 'Invalid cert. Use PSM1 or PSPO1.' });
    return;
  }
  const cert = certParam as CertId;
  const styleParam = req.query.style as string | undefined;
  const style: Style =
    styleParam && (STYLES as readonly string[]).includes(styleParam)
      ? (styleParam as Style)
      : pickStyle();

  const client = new Anthropic({ apiKey });

  let lastError: string | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const tryStyle = attempt === 0 ? style : pickStyle();
    try {
      const result = await generateOnce(client, cert, tryStyle);
      if (result) {
        res.status(200).json(result);
        return;
      }
      lastError = 'Validation failed (length, confidence, or shape)';
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      console.error(`AI gen attempt ${attempt} failed:`, lastError);
    }
  }
  res.status(502).json({
    error: 'Could not generate a valid question after 3 attempts',
    detail: lastError,
  });
}
