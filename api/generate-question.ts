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
    'Ask the learner to derive a Scrum rule from underlying principles, not recall it. Example shape: "If you had to pick a maximum length for Sprint Planning from scratch, what factors would push you toward 8 hours rather than 2 or 16?" The correct answer reasons from goals (e.g. enough time to forge a Sprint Goal, short enough to avoid waste). Distractors reflect surface-level reasoning.',
  'find-the-flaw':
    'Describe a 2–3 sentence team scenario containing one or more violations of Scrum principles. Ask which violation is most consequential, OR which are present (multi-select). Distractors are reasonable team practices that are NOT violations, mixed with the real ones.',
  'steel-manning':
    'Present a take that contradicts a Scrum principle, but in its strongest form (e.g. "the Daily Scrum is wasteful because Slack already keeps the team aligned"). Ask which counterargument most substantively engages the concern without dismissing it. Weak distractors include dogmatic responses and ones that miss the legitimate point.',
  counterfactual:
    'Ask "if X did not exist in Scrum, what would specifically degrade?" where X is a rule, accountability, event, or commitment. Tests why the rule matters by imagining its absence. Distractors offer surface or wrong consequences.',
  'cross-framework':
    'Ask the learner to map a Scrum concept onto a non-Scrum framework (scientific method, OODA loop, Kanban WIP limits, lean manufacturing, PDCA, etc.) and identify which mapping is structurally tightest. Tests grasp through analogy.',
  'devils-advocate':
    'Construct a scenario where it would seem acceptable to violate a Scrum rule. Ask the learner to identify why the apparent exception is not actually valid OR what subtle factor distinguishes a legitimate edge case from this one. Tests judgment under principle-tension.',
};

const CERT_DESCRIPTIONS = {
  PSM1: 'Professional Scrum Master I — Scrum framework, three accountabilities (Scrum Master, Product Owner, Developers), five events, three artifacts and their commitments, the Scrum Values, empiricism (transparency / inspection / adaptation), self-management.',
  PSPO1: 'Professional Scrum Product Owner I — Product Owner accountability, Product Goal, Product Backlog ordering and refinement, value maximization, stakeholder collaboration, Evidence-Based Management (Current Value, Unrealized Value, Time-to-Market, Ability to Innovate).',
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
  return `Generate ONE original practice question for the ${cert} certification (${CERT_DESCRIPTIONS[cert]}).

The learner has already practiced 340 standard exam-mirror questions. Your goal is to give them a DIFFERENT perspective that hardens their understanding — not another recognition-style question. Style: ${style}.

Style guide:
${STYLE_INSTRUCTIONS[style]}

Hard rules:
- The marked-correct answer MUST be defensible per the Scrum Guide 2020 (and the EBM Guide if relevant for PSPO I). Cite the exact section.
- Self-critique: state the strongest argument against your marked-correct answer, even if you ultimately stand by it.
- After self-critique, rate your confidence 1–5 that the marked-correct answer is right. If confidence < 4, output {"reject": true, "reason": "..."} — do not generate a question you are not confident about.
- All distractors must be plausible to a half-trained learner. No strawmen, no obvious nonsense.
- Length-balance: the correct option must NOT be conspicuously the longest or shortest. Aim for similar lengths across options.
- Type rules:
  - "single": exactly 4 options, exactly 1 correct index.
  - "tf": exactly 2 options ["True","False"], exactly 1 correct index.
  - "multi": 5–7 options, 2–4 correct indices.

Output strict JSON only — no markdown fences, no commentary:

{
  "style": "${style}",
  "topic": "<short topic label, e.g. 'Sprint Goal' or 'Empiricism'>",
  "scrumGuideSection": "<specific section name from the Scrum Guide 2020 grounding the answer>",
  "type": "single" | "multi" | "tf",
  "q": "<question text>",
  "options": ["..."],
  "correct": [<0-indexed integer indices>],
  "why": "<explanation citing Scrum Guide reasoning>",
  "selfCritique": "<strongest counterargument to the marked-correct answer>",
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
  // Type-specific
  if (p.type === 'single' && (p.options.length !== 4 || p.correct.length !== 1)) return null;
  if (p.type === 'tf' && (p.options.length !== 2 || p.correct.length !== 1)) return null;
  if (p.type === 'multi' && (p.options.length < 5 || p.options.length > 7)) return null;
  if (p.type === 'multi' && (p.correct.length < 2 || p.correct.length > 4)) return null;
  return p as unknown as GeneratedQuestion;
}

async function generateOnce(
  client: Anthropic,
  cert: CertId,
  style: Style
): Promise<GeneratedQuestion | null> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
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
  return validate(parsed);
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

  // Up to 3 attempts; if the first style keeps rejecting, vary it
  let lastError: string | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const tryStyle = attempt === 0 ? style : pickStyle();
    try {
      const result = await generateOnce(client, cert, tryStyle);
      if (result) {
        res.status(200).json(result);
        return;
      }
      lastError = 'Validation failed (low confidence or malformed output)';
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
