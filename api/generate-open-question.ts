import Anthropic from '@anthropic-ai/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateRequest, getProfile } from './_lib/auth.js';

// Allow up to 60s so the retry loop can finish without Vercel killing us.
export const maxDuration = 60;

const CERT_DESCRIPTIONS = {
  PSM1: 'Professional Scrum Master I - Scrum framework, three accountabilities (SM, PO, Developers), five events, three artifacts and commitments, the Scrum Values, empiricism (transparency / inspection / adaptation), self-management.',
  PSPO1: 'Professional Scrum Product Owner I - PO accountability, Product Goal, Product Backlog ordering and refinement, value maximization, stakeholder collaboration, Evidence-Based Management (Current Value, Unrealized Value, Time-to-Market, Ability to Innovate).',
} as const;

type CertId = keyof typeof CERT_DESCRIPTIONS;
type Difficulty = 'easy' | 'medium' | 'scrum-master';

const TOPIC_SEEDS: Record<CertId, string[]> = {
  PSM1: [
    'Sprint Goal as the Sprint commitment', 'Definition of Done as a quality commitment',
    'Daily Scrum purpose and 15-minute timebox', 'Sprint Retrospective as inspect-and-adapt',
    'Sprint Review as a working session not a status meeting',
    'Scrum Master accountability for effectiveness',
    'Scrum Master vs project manager distinction',
    'Self-management within the Scrum Team',
    'Cross-functionality and missing skills',
    'Sprint cancellation (only the PO can cancel)',
    'Why work that fails DoD cannot be in the Increment',
    'Empiricism: transparency, inspection, adaptation',
    'Scrum Values and behavior under pressure',
    'Multiple Scrum Teams on one product',
    'Product Backlog refinement as ongoing activity',
    'Scenario: a critical defect is found mid-Sprint',
    'Scenario: stakeholder pressure to add work mid-Sprint',
    'Scenario: a Developer wants to skip a Daily Scrum',
    'Scenario: Sprint Goal is no longer achievable',
    'Scenario: team consistently fails to meet DoD',
  ],
  PSPO1: [
    'Product Owner as a single accountable person',
    'Maximizing the value of the product',
    'Product Goal as long-term objective',
    'Product Backlog ordering by value',
    'Releasing Increments — PO decides timing',
    'EBM Current Value vs Unrealized Value',
    'EBM Time-to-Market and Ability to Innovate',
    'MVP as a learning instrument',
    'Why velocity is not value',
    'Stakeholder pressure on backlog ordering',
    'PO at scale on one product',
    'When to abandon a Product Goal',
    'Scenario: stakeholders demand fixed scope and date',
    'Scenario: PO is unavailable for half the Sprint',
    'Scenario: backlog has 500 items and growing',
    'Scenario: a feature has shipped but is not used',
    'Scenario: leadership wants weekly velocity reports',
  ],
};

function pickTopic(cert: CertId): string {
  const list = TOPIC_SEEDS[cert];
  return list[Math.floor(Math.random() * list.length)] as string;
}

function difficultyDirective(d: Difficulty): string {
  switch (d) {
    case 'easy':
      return `DIFFICULTY: easy (recall-level)
- Question asks for direct recall of a Scrum Guide fact: definitions, timeboxes, accountabilities, who-does-what.
- A learner who has read the Scrum Guide once should be able to answer in 30-50 words.
- Reference answer: 40-80 words, plain factual.
- Rubric: 3 specific facts they must mention.`;
    case 'medium':
      return `DIFFICULTY: medium (application-level)
- Question asks the learner to explain WHY a Scrum rule exists, when to apply it, or how concepts interact.
- Requires understanding, not just memorization.
- Reference answer: 80-160 words.
- Rubric: 3-4 conceptual points they must demonstrate.`;
    case 'scrum-master':
      return `DIFFICULTY: scrum-master (mastery-level)
- Multi-step scenario with edge cases, contradictions, or organizational friction. The kind of situation a working Scrum Master actually faces.
- Requires diagnosis + reasoning + grounded resolution.
- Reference answer: 140-220 words, walks through diagnosis and resolution.
- Rubric: 4-5 points covering both the diagnosis and the resolution.`;
  }
}

interface OpenQuestion {
  topic: string;
  scrumGuideSection: string;
  q: string;
  referenceAnswer: string;
  rubricKeyPoints: string[];
  difficulty: Difficulty;
  confidence: number;
}

function buildPrompt(cert: CertId, topicSeed: string, difficulty: Difficulty): string {
  return `Generate ONE open-response question for ${cert} (${CERT_DESCRIPTIONS[cert]}).

NOT multiple choice. The learner types a free-text answer.

FOCUS ON: ${topicSeed}

${difficultyDirective(difficulty)}

Hard rules:
- Reference answer must be grounded in Scrum Guide 2020 (and EBM Guide for PSPO1 if relevant). Cite the specific section.
- Rubric key points are concrete and checkable. Each is a Scrum-Guide-grounded fact a grader can verify against an answer.
- Avoid trivia. Reward conceptual understanding appropriate to the difficulty level.
- Confidence 5 ONLY if the Scrum Guide is unambiguous on the topic AND your rubric points are concrete. Otherwise reject.

Output strict JSON only - no markdown, no commentary:
{
  "topic": "<short label>",
  "scrumGuideSection": "<specific Scrum Guide 2020 section, no fake page numbers>",
  "q": "<the open question>",
  "referenceAnswer": "<ideal answer in plain prose>",
  "rubricKeyPoints": ["<point 1>", "<point 2>", "<point 3>"],
  "difficulty": "${difficulty}",
  "confidence": <integer 1-5>
}

If confidence < 5: {"reject": true, "reason": "..."}`;
}

function validate(parsed: unknown, difficulty: Difficulty): OpenQuestion | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const p = parsed as Record<string, unknown>;
  if ((p as { reject?: boolean }).reject === true) return null;
  if (typeof p.confidence !== 'number' || p.confidence < 5) return null;
  if (typeof p.topic !== 'string' || p.topic.length < 2) return null;
  if (typeof p.scrumGuideSection !== 'string' || p.scrumGuideSection.length < 4) return null;
  if (typeof p.q !== 'string' || p.q.length < 20) return null;
  if (typeof p.referenceAnswer !== 'string' || p.referenceAnswer.length < 40) return null;
  if (!Array.isArray(p.rubricKeyPoints) || p.rubricKeyPoints.length < 3 || p.rubricKeyPoints.length > 6) return null;
  if (p.rubricKeyPoints.some((kp) => typeof kp !== 'string' || kp.length < 5)) return null;
  const wc = (s: string) => s.trim().split(/\s+/).length;
  // Soft length caps tied to difficulty
  if (difficulty === 'easy' && wc(p.referenceAnswer as string) > 110) return null;
  if (difficulty === 'medium' && wc(p.referenceAnswer as string) > 200) return null;
  if (difficulty === 'scrum-master' && wc(p.referenceAnswer as string) > 260) return null;
  if (wc(p.q as string) > 100) return null;
  return { ...(p as object), difficulty } as OpenQuestion;
}

const PROD_URL = 'https://scrum-practice.vercel.app';

function originAllowed(origin: string | undefined, referer: string | undefined): boolean {
  const allowed = [PROD_URL];
  if (process.env.VERCEL_URL) allowed.push(`https://${process.env.VERCEL_URL}`);
  const patterns = [/^https?:\/\/localhost(:\d+)?$/, /^https?:\/\/127\.0\.0\.1(:\d+)?$/];
  const candidates = [origin, referer].filter((v): v is string => typeof v === 'string' && v.length > 0);
  if (candidates.length === 0) return false;
  for (const c of candidates) {
    let url: URL;
    try { url = new URL(c); } catch { continue; }
    const clean = `${url.protocol}//${url.host}`;
    if (allowed.includes(clean)) return true;
    if (patterns.some((p) => p.test(clean))) return true;
  }
  return false;
}

function pickHeader(h: string | string[] | undefined): string | undefined {
  return Array.isArray(h) ? h[0] : h;
}

function parseDifficulty(s: string | undefined): Difficulty {
  if (s === 'easy' || s === 'medium' || s === 'scrum-master') return s;
  return 'medium';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const origin = pickHeader(req.headers.origin);
  const referer = pickHeader(req.headers.referer);
  if (!originAllowed(origin, referer)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const auth = await authenticateRequest(req);
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const profile = await getProfile(auth.supabaseAdmin, auth.user.id);
  if (!profile) {
    res.status(403).json({ error: 'Profile not found' });
    return;
  }
  const allowed = profile.tier === 'pro' || profile.tier === 'admin' || profile.is_admin === true;
  if (!allowed) {
    res.status(403).json({ error: 'Pro tier required' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server not configured' });
    return;
  }

  const certParam = (req.query.cert as string | undefined)?.toUpperCase();
  if (certParam !== 'PSM1' && certParam !== 'PSPO1') {
    res.status(400).json({ error: 'Invalid cert' });
    return;
  }
  const cert = certParam as CertId;
  const difficulty = parseDifficulty(req.query.difficulty as string | undefined);

  const client = new Anthropic({ apiKey });

  let lastError: string | null = null;
  // 3 retries (was 5) — keeps total time under ~30s
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const topic = pickTopic(cert);
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: buildPrompt(cert, topic, difficulty) }],
      });
      const block = response.content[0];
      if (!block || block.type !== 'text') { lastError = 'Empty response'; continue; }
      const match = block.text.trim().match(/\{[\s\S]*\}/);
      if (!match) { lastError = 'No JSON in response'; continue; }
      let parsed: unknown;
      try { parsed = JSON.parse(match[0]); } catch { lastError = 'Bad JSON'; continue; }
      const validated = validate(parsed, difficulty);
      if (!validated) { lastError = 'Validation failed'; continue; }
      res.status(200).json(validated);
      return;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      console.error(`Open gen attempt ${attempt} failed:`, lastError);
    }
  }
  res.status(502).json({ error: 'Could not generate a valid question after 3 attempts', detail: lastError });
}
