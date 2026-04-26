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

function pickTopic(cert: CertId, difficulty: Difficulty, exclude: string[]): string {
  const list = SEEDS[cert][difficulty];
  const lower = exclude.map((s) => s.toLowerCase());
  const filtered = list.filter((seed) => {
    const s = seed.toLowerCase();
    return !lower.some((ex) => ex.length > 4 && (s.includes(ex) || ex.includes(s)));
  });
  const pool = filtered.length > 0 ? filtered : list;
  return pool[Math.floor(Math.random() * pool.length)] as string;
}

function difficultyDirective(d: Difficulty): string {
  switch (d) {
    case 'easy':
      return `DIFFICULTY: easy (PURE recall)

The question MUST be a direct factual recall question that can be answered in one or two short sentences.

GOOD example for easy:
- Question: "What is the maximum length of the Daily Scrum?"
- Rubric: ["15 minutes maximum"]
- Reference: "The Daily Scrum is timeboxed to 15 minutes maximum, per the Scrum Guide 2020. The Developers hold it each working day to inspect Sprint progress and adapt their plan for the next 24 hours."
- Notice: rubric has EXACTLY ONE point — the answer to the question. Nothing else.

BAD example (DO NOT generate this on easy):
- Question: "A team consistently misses Daily Scrums. How should the Scrum Master handle this?"
- Why bad: This is a scenario question asking for diagnosis + resolution. That is scrum-master level. Easy must be direct factual recall, not problem-solving.

ANOTHER BAD example for easy:
- Question: "What is the timebox of the Daily Scrum, and why is it 15 minutes?"
- Why bad: The "and why" makes this a recall + explanation hybrid. That is medium level. Easy is recall ONLY.

CRITICAL RUBRIC RULE for easy:
- Each rubric point must be a fact that DIRECTLY answers the question. Nothing else.
- "Who can cancel a Sprint?" → rubric: ["The Product Owner has sole authority to cancel a Sprint."]. ONE point.
- "Name the 5 Scrum Values" → rubric: ["Commitment", "Focus", "Openness", "Respect", "Courage"]. FIVE points (one per item asked).
- "State the timebox of the Daily Scrum" → rubric: ["15 minutes maximum"]. ONE point.
- "Define the Sprint Goal" → rubric: ["The Sprint Goal is the single objective for the Sprint."]. ONE point.

DO NOT include: "context", "best practice notes", "when this applies", "why this exists", or any fact the question did not literally ask for. Those belong to MEDIUM and SCRUM-MASTER.

Length: question ≤ 25 words. Reference ≤ 100 words.`;
    case 'medium':
      return `DIFFICULTY: medium (application-level)

The question asks the learner to explain WHY a Scrum rule exists, when to apply it, how concepts interact, or to contrast two ideas. Requires understanding, not just memorization. NOT a multi-step scenario.

GOOD example for medium:
- Question: "Why is the Daily Scrum exactly 15 minutes and held at the same time and place?"
- Rubric: ["Forces focus on synchronization rather than detailed problem-solving", "Aligns with the Developers' need to plan only the next 24 hours of work", "Consistency reduces complexity and supports transparency"]
- Reference: "The 15-minute timebox forces the Developers to focus on planning the next 24 hours rather than turning the meeting into a status report or problem-solving session. Detailed discussions happen separately. The same time/place each day reduces cognitive load and makes attendance and consistency easier — supporting transparency and inspection without adding overhead. Per the Scrum Guide, the event is for the Developers to inspect progress toward the Sprint Goal and adapt the Sprint Backlog as needed."
- Notice: rubric has 3 conceptual points the learner must demonstrate understanding of.

BAD example (DO NOT generate this on medium):
- Question: "What is the maximum length of the Daily Scrum?"
- Why bad: This is recall — asks "what" not "why/how/when". That belongs on easy.

ANOTHER BAD example for medium:
- Question: "A team holds Daily Scrums but they run 30 minutes. What should the Scrum Master do?"
- Why bad: This is a scenario asking for diagnosis + resolution. That belongs on scrum-master.

Length: question 25-50 words. Reference 80-160 words. Rubric 3-4 conceptual points.`;
    case 'scrum-master':
      return `DIFFICULTY: scrum-master (mastery scenario)

A multi-step scenario with edge cases, contradictions, or organizational friction — the kind of situation a working Scrum Master actually faces. The learner must diagnose the problem AND propose a Scrum-Guide-grounded resolution.

GOOD example for scrum-master:
- Question: "A Scrum Team has a Product Owner who is a committee of three managers who vote weekly on backlog ordering. The team is delivering Increments but stakeholders complain the product feels directionless. Diagnose the root cause and outline how you would address it as Scrum Master."
- Rubric: ["The Product Owner accountability requires a single person, not a committee — this is the root structural cause", "Without a single PO, no one can authoritatively order the Product Backlog and stakeholders cannot rely on the ordering", "Resolution: surface this conflict to the organization, advocate for naming a single PO, coach leadership on why the framework requires it", "Until a single PO is named, the team will struggle to maximize value because there is no coherent product direction"]
- Reference: "The root cause is structural: the Scrum Guide is unambiguous that the Product Owner is one person, not a committee. With three managers voting, no single accountability exists for ordering the Product Backlog or maximizing value, which explains the directionless feeling. As Scrum Master, my job is to coach leadership on why the Guide requires a single PO and surface this as a impediment to the framework working. Until a single accountable PO is named, the team can deliver Increments but cannot reliably maximize value because there is no consistent product direction. I would advocate for naming one of the committee members as PO (with the others as stakeholders), with the explicit understanding that decisions rest with that single person."

BAD example (DO NOT generate this on scrum-master):
- Question: "Why must the Product Owner be a single person?"
- Why bad: This is a "why" question — that's medium level (application). Scrum-master needs a SCENARIO with concrete circumstances.

Length: question 50-90 words, sets up scenario clearly. Reference 140-220 words. Rubric 4-5 points covering both diagnosis and resolution.`;
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

UNIVERSAL RULES (every difficulty):
- Reference answer must be grounded in Scrum Guide 2020 (and EBM Guide for PSPO1 if relevant). Cite the section name only — do NOT include page numbers (the Scrum Guide does not have stable pagination).
- Rubric points are concrete and checkable. Each is a fact a grader can verify against an answer.
- Confidence 5 ONLY if the Scrum Guide is unambiguous on the topic AND your rubric is correctly scoped to what the question asks.

Output strict JSON only - no markdown, no commentary:
{
  "topic": "<short label>",
  "scrumGuideSection": "<Scrum Guide 2020 section name, no page numbers>",
  "q": "<the open question>",
  "referenceAnswer": "<ideal answer in plain prose>",
  "rubricKeyPoints": ["<point 1>", "<point 2>", "..."],
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
  if (!Array.isArray(p.rubricKeyPoints) || p.rubricKeyPoints.length < 1 || p.rubricKeyPoints.length > 6) return null;
  if (p.rubricKeyPoints.some((kp) => typeof kp !== 'string' || kp.length < 5)) return null;

  // Reject hallucinated page numbers in citations.
  if (/p\.?\s*\d+|pp\.?\s*\d+|page\s+\d+/i.test(p.scrumGuideSection as string)) return null;

  const wc = (s: string) => s.trim().split(/\s+/).length;
  const qWordCount = wc(p.q as string);
  const refWordCount = wc(p.referenceAnswer as string);
  if (difficulty === 'easy') {
    if (qWordCount > 30) return null;
    if (refWordCount > 110) return null;
  } else if (difficulty === 'medium') {
    if (qWordCount > 60) return null;
    if (refWordCount > 200) return null;
  } else {
    if (qWordCount > 110) return null;
    if (refWordCount > 260) return null;
  }

  // Easy must NOT contain scenario language
  if (difficulty === 'easy') {
    const text = (p.q as string).toLowerCase();
    const scenarioMarkers = [
      'a team', 'a scrum team', 'the team has', 'a developer', 'the po wants', 'a stakeholder',
      'mid-sprint', 'how should', 'walk through', 'describe how', 'what would you', 'imagine',
      'consider this', 'situation', 'scenario',
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

  const recentRaw = (req.query.recent as string | undefined) || '';
  const recentTopics = recentRaw.split('|').map((s) => s.trim()).filter(Boolean).slice(0, 5);

  const client = new Anthropic({ apiKey });

  let lastError: string | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const topic = pickTopic(cert, difficulty, recentTopics);
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
