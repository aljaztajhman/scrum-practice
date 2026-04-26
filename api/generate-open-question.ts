import Anthropic from '@anthropic-ai/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateRequest, getProfile } from './_lib/auth.js';

const CERT_DESCRIPTIONS = {
  PSM1: 'Professional Scrum Master I - Scrum framework, three accountabilities (SM, PO, Developers), five events, three artifacts and commitments, the Scrum Values, empiricism (transparency / inspection / adaptation), self-management.',
  PSPO1: 'Professional Scrum Product Owner I - PO accountability, Product Goal, Product Backlog ordering and refinement, value maximization, stakeholder collaboration, Evidence-Based Management (Current Value, Unrealized Value, Time-to-Market, Ability to Innovate).',
} as const;

type CertId = keyof typeof CERT_DESCRIPTIONS;

const TOPIC_SEEDS: Record<CertId, string[]> = {
  PSM1: [
    'Why Sprint Goals exist', 'Why Definition of Done is a quality commitment',
    'Why the Scrum Master is not a project manager', 'Why Sprints are fixed-length',
    'Why Daily Scrum belongs to the Developers', 'Why only the PO can cancel a Sprint',
    'Why the Product Backlog has one ordered list', 'Why empiricism requires transparency',
    'Why work that fails DoD cannot be in the Increment',
    'Walk through what happens when a critical defect is found mid-Sprint',
    'Walk through how a Scrum Team handles missing skills', 'Contrast Sprint Review with status meeting',
    'Contrast Product Backlog refinement with planning', 'Contrast self-management with self-organization',
    'Steelman: "Daily Scrums are a waste of time" — then explain why the standard answer holds',
    'Find the flaw: a team adds work mid-Sprint because the PO requested it',
    'Find the flaw: the SM assigns work to Developers each morning',
    'Find the flaw: the team skips Retrospectives when nothing is wrong',
    'Explain how Sprint Goal and Definition of Done interact',
    'Explain how cross-functionality enables self-management',
  ],
  PSPO1: [
    'Why the PO is one person, not a committee', 'Why the PO orders the Product Backlog',
    'Why velocity is not value', 'Why MVP is a learning instrument, not a small product',
    'Walk through how a PO maximizes value under uncertainty',
    'Contrast Current Value with Unrealized Value (EBM)',
    'Contrast output with outcome', 'Contrast Time-to-Market with Ability to Innovate',
    'Steelman: "The PO should defer to the loudest stakeholder" — then explain why the standard answer holds',
    'Find the flaw: the PO commits to fixed scope at a fixed date',
    'Find the flaw: the PO orders backlog purely by stakeholder political weight',
    'Explain why fixed scope-and-date commitments mislead under empiricism',
    'Explain how Product Goal anchors backlog ordering',
    'Explain when to abandon a Product Goal',
    'Walk through how the PO uses EBM to justify investment',
  ],
};

function pickTopic(cert: CertId): string {
  const list = TOPIC_SEEDS[cert];
  return list[Math.floor(Math.random() * list.length)] as string;
}

interface OpenQuestion {
  topic: string;
  scrumGuideSection: string;
  q: string;
  referenceAnswer: string;
  rubricKeyPoints: string[];
  confidence: number;
}

function buildPrompt(cert: CertId, topicSeed: string): string {
  return `Generate ONE open-response question for ${cert} (${CERT_DESCRIPTIONS[cert]}).

Goal: a question requiring the learner to articulate understanding in their own words. NOT multiple choice. Tests active recall and conceptual depth.

FOCUS ON: ${topicSeed}

Hard rules:
- Question must be answerable in 30-100 words by someone who knows the Scrum Guide 2020.
- Reference answer must be grounded in Scrum Guide 2020 (and EBM Guide for PSPO1 if relevant). Cite the specific section.
- Provide 3-5 rubric key points the learner must mention to be considered correct. Each rubric point is a single Scrum-Guide-grounded fact, written so a grader can check it against an answer.
- Avoid trivia. Reward conceptual understanding.
- Confidence 5 ONLY if the Scrum Guide is unambiguous on the topic AND your rubric points are concrete and checkable. Otherwise reject.

Output strict JSON only - no markdown, no commentary:
{
  "topic": "<short label>",
  "scrumGuideSection": "<specific Scrum Guide 2020 section>",
  "q": "<the open question, one paragraph>",
  "referenceAnswer": "<100-200 word ideal answer in plain prose>",
  "rubricKeyPoints": ["<point 1>", "<point 2>", "<point 3>"],
  "confidence": <integer 1-5>
}

If confidence < 5: {"reject": true, "reason": "..."}`;
}

function validate(parsed: unknown): OpenQuestion | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const p = parsed as Record<string, unknown>;
  if ((p as { reject?: boolean }).reject === true) return null;
  if (typeof p.confidence !== 'number' || p.confidence < 5) return null;
  if (typeof p.topic !== 'string' || p.topic.length < 2) return null;
  if (typeof p.scrumGuideSection !== 'string' || p.scrumGuideSection.length < 4) return null;
  if (typeof p.q !== 'string' || p.q.length < 20) return null;
  if (typeof p.referenceAnswer !== 'string' || p.referenceAnswer.length < 50) return null;
  if (!Array.isArray(p.rubricKeyPoints) || p.rubricKeyPoints.length < 3 || p.rubricKeyPoints.length > 6) return null;
  if (p.rubricKeyPoints.some((kp) => typeof kp !== 'string' || kp.length < 5)) return null;
  // Word-count guards
  const wc = (s: string) => s.trim().split(/\s+/).length;
  if (wc(p.q as string) > 80) return null;
  if (wc(p.referenceAnswer as string) > 220) return null;
  return p as unknown as OpenQuestion;
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

  const client = new Anthropic({ apiKey });

  let lastError: string | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const topic = pickTopic(cert);
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: buildPrompt(cert, topic) }],
      });
      const block = response.content[0];
      if (!block || block.type !== 'text') {
        lastError = 'Empty response';
        continue;
      }
      const match = block.text.trim().match(/\{[\s\S]*\}/);
      if (!match) {
        lastError = 'No JSON in response';
        continue;
      }
      let parsed: unknown;
      try { parsed = JSON.parse(match[0]); } catch { lastError = 'Bad JSON'; continue; }
      const validated = validate(parsed);
      if (!validated) {
        lastError = 'Validation failed';
        continue;
      }
      res.status(200).json(validated);
      return;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      console.error(`Open gen attempt ${attempt} failed:`, lastError);
    }
  }
  res.status(502).json({ error: 'Could not generate a valid question after 5 attempts', detail: lastError });
}
