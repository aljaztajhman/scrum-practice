import Anthropic from '@anthropic-ai/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateRequest, getProfile } from './_lib/auth.js';

export const maxDuration = 60;

const CERT_DESCRIPTIONS = {
  PSM1: 'Professional Scrum Master I - Scrum framework, three accountabilities (SM, PO, Developers), five events, three artifacts and commitments, the Scrum Values, empiricism (transparency / inspection / adaptation), self-management.',
  PSPO1: 'Professional Scrum Product Owner I - PO accountability, Product Goal, Product Backlog ordering and refinement, value maximization, stakeholder collaboration, Evidence-Based Management.',
} as const;

type CertId = keyof typeof CERT_DESCRIPTIONS;
type Difficulty = 'easy' | 'medium' | 'scrum-master';

// Seeds split by difficulty.
// EASY: direct recall — definitions, timeboxes, accountabilities, who-owns-what.
// MEDIUM: application — why does X exist, when to apply X, how X and Y interact.
// SCRUM-MASTER: multi-step scenarios with edge cases, organizational friction.
const SEEDS: Record<CertId, Record<Difficulty, string[]>> = {
  PSM1: {
    easy: [
      'Define the Sprint Goal and what it commits to',
      'Define the Definition of Done and what role it plays',
      'State the maximum length of a Sprint',
      'State the timebox of the Daily Scrum',
      'State the timebox of Sprint Planning for a one-month Sprint',
      'State the timebox of the Sprint Review and Sprint Retrospective for a one-month Sprint',
      'Name the three accountabilities in a Scrum Team',
      'Name the five Scrum events',
      'Name the three artifacts and their commitments',
      'Name the five Scrum Values',
      'State who is accountable for the Product Backlog',
      'State who is accountable for the Sprint Backlog',
      'State who is accountable for the Increment',
      'State who can cancel a Sprint',
      'State the purpose of the Daily Scrum',
      'State the purpose of the Sprint Retrospective',
      'State the three pillars of empiricism',
      'State the size limit of a Scrum Team per the Scrum Guide',
      'State who attends the Sprint Review',
    ],
    medium: [
      'Why is the Sprint Goal a single coherent objective rather than a list of items',
      'Why is the Daily Scrum exactly 15 minutes and held at the same time and place',
      'Why is the Definition of Done shared by the whole team and not per-individual',
      'Why is the Sprint a fixed length',
      'Why can only the Product Owner cancel a Sprint',
      'Why is work that does not meet the Definition of Done excluded from the Increment',
      'Why is the Daily Scrum for the Developers',
      'How do the Sprint Goal and the Sprint Backlog interact during the Sprint',
      'How does the Definition of Done relate to transparency and quality',
      'How do empiricism (transparency, inspection, adaptation) and self-management reinforce each other',
      'How do the Scrum Values support the framework working in practice',
      'When is it appropriate to renegotiate the Sprint Backlog with the Product Owner',
      'When does Product Backlog refinement happen and who participates',
      'Contrast the Scrum Master role with a project manager role',
      'Contrast self-management with self-organization',
    ],
    'scrum-master': [
      'Scenario: a critical production defect is discovered mid-Sprint and the PO wants the team to drop everything',
      'Scenario: a stakeholder demands the team add a high-priority feature mid-Sprint, citing urgency',
      'Scenario: the team consistently fails to meet the Definition of Done; how do you diagnose and act',
      'Scenario: the Sprint Goal is no longer achievable midway through the Sprint',
      'Scenario: a Developer wants to skip the Daily Scrum because they say it is a waste of time',
      'Scenario: leadership demands a velocity report and predictable scope-and-date commitments',
      'Scenario: a Scrum Team is missing a critical skill needed for a high-priority item',
      'Scenario: the team holds Retrospectives but never implements improvements',
      'Scenario: the PO is unavailable for half of every Sprint and stakeholders bypass them',
      'Scenario: two Scrum Teams on the same product disagree on the Definition of Done',
      'Scenario: a Developer privately tells the SM they think a colleague is not pulling their weight',
    ],
  },
  PSPO1: {
    easy: [
      'Define the Product Owner accountability',
      'Define the Product Goal and where it lives',
      'Define the Product Backlog and its commitment',
      'State who is accountable for ordering the Product Backlog',
      'State who can cancel a Sprint',
      'State who decides when an Increment is released',
      'Name the four Key Value Areas in EBM',
      'Define Current Value (CV) in EBM',
      'Define Unrealized Value (UV) in EBM',
      'Define Time-to-Market (T2M) in EBM',
      'Define Ability to Innovate (A2I) in EBM',
      'State the role of the Product Owner in Sprint Planning',
      'State whether a Product Owner can be a committee',
    ],
    medium: [
      'Why must the Product Owner be a single person and not a committee',
      'Why is the Product Backlog ordered rather than just prioritized',
      'Why is velocity not a measure of value',
      'Why is the MVP a learning instrument rather than a small product',
      'Why must fixed scope-and-date commitments be treated cautiously under empiricism',
      'How does the Product Goal anchor Product Backlog ordering',
      'How do Current Value and Unrealized Value differ in EBM',
      'How does the Product Owner balance stakeholder pressure with value maximization',
      'When is it appropriate to abandon a Product Goal',
      'When does Product Backlog refinement happen and how is "ready" defined',
      'Contrast output (features shipped) with outcome (value delivered)',
    ],
    'scrum-master': [
      'Scenario: stakeholders demand a fixed scope at a fixed date and the PO is pressured to commit',
      'Scenario: the PO is unavailable for half of each Sprint and stakeholders bypass them',
      'Scenario: a feature has shipped but adoption is near zero — what does the PO do',
      'Scenario: leadership wants weekly velocity reports as the value metric',
      'Scenario: the Product Backlog has 500 items and is growing faster than the team can refine',
      'Scenario: two competing stakeholders want opposite top-priority items',
      'Scenario: the team finished an item early; should the PO add work to the Sprint',
      'Scenario: a major customer demands a roadmap with fixed dates for next 6 months',
      'Scenario: the PO inherits a product with an outdated Product Goal that no one believes in',
    ],
  },
};

function pickTopic(cert: CertId, difficulty: Difficulty): string {
  const list = SEEDS[cert][difficulty];
  return list[Math.floor(Math.random() * list.length)] as string;
}

function difficultyDirective(d: Difficulty): string {
  switch (d) {
    case 'easy':
      return `DIFFICULTY: easy (PURE recall)

The question MUST be a direct factual recall question that can be answered in one or two short sentences.

Examples of acceptable easy questions:
- "What is the maximum length of a Sprint per the Scrum Guide?"
- "Who is accountable for the Product Backlog?"
- "Define the Sprint Goal."
- "Name the five Scrum Values."

DO NOT generate:
- Scenarios ("A team has..." → forbidden)
- Multi-step problems
- "Explain why..." questions (those are MEDIUM)
- "Describe how a team should handle..." questions (those are SCRUM-MASTER)

The question should be SHORT — under 25 words. The answer should be 30-50 words. The reference answer is a plain factual definition or fact statement, 40-80 words.

Rubric: 2-3 specific facts that should appear in the answer.`;
    case 'medium':
      return `DIFFICULTY: medium (application-level)

The question asks the learner to explain WHY a Scrum rule exists, when to apply it, how concepts interact, or to contrast two ideas. Requires understanding, not just memorization. NOT a multi-step scenario — that's scrum-master.

Examples:
- "Why is the Daily Scrum exactly 15 minutes?"
- "How do Sprint Goal and Sprint Backlog interact?"
- "Contrast the Scrum Master role with a project manager role."

Question: 25-50 words. Reference answer: 80-160 words. Rubric: 3-4 conceptual points.`;
    case 'scrum-master':
      return `DIFFICULTY: scrum-master (mastery scenario)

A multi-step scenario with edge cases, contradictions, or organizational friction. The kind of situation a working Scrum Master actually faces. The learner must diagnose the problem AND propose a Scrum-Guide-grounded resolution.

Question: 50-90 words, sets up the scenario clearly. Reference answer: 140-220 words, walking through diagnosis + resolution. Rubric: 4-5 points covering both.`;
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

Hard rules (apply at every difficulty):
- Reference answer must be grounded in Scrum Guide 2020 (and EBM Guide for PSPO1 if relevant). Cite the specific section.
- Rubric key points are concrete and checkable. Each is a Scrum-Guide-grounded fact a grader can verify against an answer.
- Confidence 5 ONLY if the Scrum Guide is unambiguous on the topic AND your rubric points are concrete AND the question matches the difficulty level above. Otherwise reject.

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
  if (typeof p.q !== 'string' || p.q.length < 15) return null;
  if (typeof p.referenceAnswer !== 'string' || p.referenceAnswer.length < 40) return null;
  if (!Array.isArray(p.rubricKeyPoints) || p.rubricKeyPoints.length < 2 || p.rubricKeyPoints.length > 6) return null;
  if (p.rubricKeyPoints.some((kp) => typeof kp !== 'string' || kp.length < 5)) return null;

  const wc = (s: string) => s.trim().split(/\s+/).length;

  // Strict length caps per difficulty — rejects scenario-style questions at easy.
  const qWordCount = wc(p.q as string);
  const refWordCount = wc(p.referenceAnswer as string);
  if (difficulty === 'easy') {
    if (qWordCount > 30) return null;
    if (refWordCount > 100) return null;
  } else if (difficulty === 'medium') {
    if (qWordCount > 60) return null;
    if (refWordCount > 200) return null;
  } else {
    if (qWordCount > 110) return null;
    if (refWordCount > 260) return null;
  }

  // Heuristic: easy questions must NOT contain scenario language
  if (difficulty === 'easy') {
    const text = (p.q as string).toLowerCase();
    const scenarioMarkers = [
      'a team', 'a scrum team', 'the team has', 'a developer', 'the po wants', 'a stakeholder',
      'mid-sprint', 'how should', 'walk through', 'describe how', 'what would you', 'imagine',
      'consider this', 'situation', 'scenario', 'explain why',
    ];
    if (scenarioMarkers.some((m) => text.includes(m))) return null;
  }

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
  if (!auth) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const profile = await getProfile(auth.supabaseAdmin, auth.user.id);
  if (!profile) { res.status(403).json({ error: 'Profile not found' }); return; }
  const allowed = profile.tier === 'pro' || profile.tier === 'admin' || profile.is_admin === true;
  if (!allowed) { res.status(403).json({ error: 'Pro tier required' }); return; }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'Server not configured' }); return; }

  const certParam = (req.query.cert as string | undefined)?.toUpperCase();
  if (certParam !== 'PSM1' && certParam !== 'PSPO1') {
    res.status(400).json({ error: 'Invalid cert' });
    return;
  }
  const cert = certParam as CertId;
  const difficulty = parseDifficulty(req.query.difficulty as string | undefined);

  const client = new Anthropic({ apiKey });

  let lastError: string | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const topic = pickTopic(cert, difficulty);
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
