import Anthropic from '@anthropic-ai/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateRequest, getProfile } from './_lib/auth.js';

const STYLES = [
  'first-principles',
  'find-the-flaw',
  'steel-manning',
  'counterfactual',
  'devils-advocate',
] as const;

type Style = (typeof STYLES)[number];

const STYLE_INSTRUCTIONS: Record<Style, string> = {
  'first-principles':
    'Ask the learner to derive a Scrum rule from underlying goals, not recall it. The correct answer reasons from first principles; distractors reflect surface-level reasoning.',
  'find-the-flaw':
    'Describe a 1-2 sentence team scenario containing one Scrum violation. Ask what is wrong (single) or which violations are present (multi). Distractors are reasonable practices that are NOT violations.',
  'steel-manning':
    'Present a contrarian Scrum take in its strongest 1-sentence form (<=25 words quoted). Ask which counterargument best engages the concern without dismissing it. Distractors are dogmatic or beside-the-point.',
  counterfactual:
    'Ask "if X did not exist in Scrum, what would degrade?" - X is a rule, accountability, event, or commitment. Tests why the rule matters by imagining its absence.',
  'devils-advocate':
    'Construct a brief scenario where it seems acceptable to violate a Scrum rule. Ask why the apparent exception is not actually valid.',
};

const STYLE_EXAMPLES: Record<Style, string> = {
  'first-principles': `STYLE EXAMPLES - first-principles:

GOOD: "Why does the Scrum Guide make Developers — not the Scrum Master or PO — own the Sprint Backlog?"
- Reasons from the self-management principle, not from rule-recall.
- Correct option grounds in: "Self-management requires the team to plan and adjust its own work to genuinely own delivery."
- Distractors are surface practices: "Because Developers know the technical details", "Because the SM is not technical", "Because the PO is busy with stakeholders".

BAD (do NOT generate as first-principles): "Who is accountable for the Sprint Backlog?"
- That is recall (a fact lookup), not first-principles reasoning. First-principles asks WHY a rule exists from underlying goals.`,
  'find-the-flaw': `STYLE EXAMPLES - find-the-flaw:

GOOD: "Mid-Sprint, the Product Owner adds three high-priority items to the Sprint Backlog and tells the Developers to start them today. What is wrong with this?"
- Concrete 1-2 sentence scenario containing one Scrum violation.
- Correct option names the actual violation: "The Sprint Backlog is owned by the Developers — only they can adjust it within the Sprint Goal."
- Distractors are reasonable practices that are NOT the flaw: "The items should be refined first", "The Sprint Goal should be revised", "A new Sprint should be planned".

BAD (do NOT generate as find-the-flaw): "What is the Sprint Backlog?"
- Definitional MC, not a flaw-finding scenario. find-the-flaw must present a CONCRETE situation containing a Scrum violation.`,
  'steel-manning': `STYLE EXAMPLES - steel-manning:

GOOD: 'A senior engineer says: "Daily Scrums waste time. Skilled adults sync on Slack and meet only when something is actually blocked." What is the strongest Scrum-grounded counterargument that engages this concern rather than dismissing it?'
- Contrarian view stated in its strongest form (≤25 words quoted).
- Correct option engages the concern (acknowledges async sync works for some signals) but defends the inspect-and-adapt purpose: "Daily Scrums are not status reports — they are inspection points for adapting the Sprint plan against the Sprint Goal, which Slack threads do not naturally produce."
- Distractors are dogmatic or beside-the-point: "Daily Scrums are required by the Guide", "Engineers must follow framework rules".

BAD (do NOT generate as steel-manning): "Why are Daily Scrums important?"
- That asks for the standard rationale, not for engaging a specific contrarian concern.`,
  counterfactual: `STYLE EXAMPLES - counterfactual:

GOOD: "If Scrum had no Definition of Done, what would degrade most?"
- Imagines the rule absent to test why it matters.
- Correct option: "Transparency of the Increment — without a shared standard, no one can tell if work is actually complete."
- Distractors are weaker degradations: "Sprint Planning would take longer", "The Product Owner could not order the backlog", "The Daily Scrum would lose focus".

BAD (do NOT generate as counterfactual): "What is the Definition of Done?"
- That is recall. Counterfactual must imagine the rule's ABSENCE to expose its function.`,
  'devils-advocate': `STYLE EXAMPLES - devils-advocate:

GOOD: "A Scrum Team's Sprint Goal is to ship feature X. On day 3, the PO learns from data that feature Y would deliver 10x more value. The PO wants to swap Sprint Goals mid-Sprint. Why is this not a valid exception?"
- Scenario where violating a rule SEEMS justified.
- Correct option: "The Sprint Goal is the Sprint commitment — changing it mid-Sprint defeats empiricism by hiding the failed assumption. Cancel the Sprint instead."
- Distractors miss the structural answer: "The PO should consult Developers first", "The team should finish X then start Y", "Stakeholders must approve the change".

BAD (do NOT generate as devils-advocate): "Can the Product Owner change the Sprint Goal mid-Sprint?"
- Yes/no recall. devils-advocate must present a SCENARIO where the violation looks reasonable, then explain why it isn't.`,
};

const CERT_DESCRIPTIONS = {
  PSM1: 'Professional Scrum Master I - Scrum framework, three accountabilities (SM, PO, Developers), five events, three artifacts and commitments, the Scrum Values, empiricism (transparency / inspection / adaptation), self-management.',
  PSPO1: 'Professional Scrum Product Owner I - PO accountability, Product Goal, Product Backlog ordering and refinement, value maximization, stakeholder collaboration, Evidence-Based Management (Current Value, Unrealized Value, Time-to-Market, Ability to Innovate).',
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

const TOPIC_SEEDS: Record<CertId, string[]> = {
  PSM1: [
    'Sprint Goal as the Sprint commitment',
    'Definition of Done',
    'Product Goal as the Product Backlog commitment',
    'Sprint timebox (1 month maximum)',
    'Sprint Planning structure and timebox',
    'Daily Scrum purpose and 15-minute timebox',
    'Sprint Review as a working session, not a status meeting',
    'Sprint Retrospective and continuous improvement',
    'Increment integrity and the Definition of Done',
    'Product Backlog as an emergent ordered list',
    'Sprint Backlog as a plan by and for the Developers',
    'Scrum Master as a true leader who serves',
    'Scrum Master vs project manager',
    'Product Owner as one person, not a committee',
    'Developers as cross-functional and self-managing',
    'Empiricism: transparency',
    'Empiricism: inspection',
    'Empiricism: adaptation',
    'Scrum Values (commitment, focus, openness, respect, courage)',
    'Self-management within the Scrum Team',
    'Cross-functionality and missing skills',
    'Stakeholder participation in the Sprint Review',
    'Sprint cancellation (only the Product Owner can cancel)',
    'Sprint Backlog renegotiation within the Sprint Goal',
    'Product Backlog refinement as an ongoing activity',
    'Organisational vs team Definition of Done',
    'Multiple Scrum Teams on one product (one PO, one Backlog, one Goal)',
    'Why Sprints are fixed-length',
    'Why work that does not meet DoD cannot be in the Increment',
    'Daily Scrum as for the Developers',
  ],
  PSPO1: [
    'Product Owner as a single accountable person',
    'Maximizing the value of the product',
    'Product Goal: long-term objective',
    'Product Backlog ordering by value',
    'Product Backlog refinement',
    'Releasing Increments - the Product Owner decides timing',
    'Multiple Increments may be created within a Sprint',
    'Stakeholder collaboration outside the Sprint Review',
    'Value vs output measurement',
    'EBM Current Value (CV)',
    'EBM Unrealized Value (UV)',
    'EBM Time-to-Market (T2M)',
    'EBM Ability to Innovate (A2I)',
    'MVP as a learning instrument, not a small product',
    'Empirical forecasting under uncertainty',
    'Sprint Goal - Product Owner proposes value',
    'Sprint cancellation - only the PO',
    'One PO at scale on one product',
    'For the PO to succeed, the organization must respect their decisions',
    'Communicating the Product Goal',
    'Why velocity is not value',
    'Splitting large items into value-delivering slices',
    'Refining items so they are ready for Sprint Planning',
    'Decisions about the Product Backlog rest with the Product Owner',
    'Anyone may propose items, but the PO orders',
    'When to abandon a Product Goal',
    'Stakeholder pressure on backlog ordering',
    'The PO may delegate work but remains accountable',
    'Why fixed scope-and-date commitments mislead under empiricism',
    'Sunk cost and pivoting based on evidence',
  ],
};

function pickTopic(cert: CertId, exclude: string[] = []): string {
  const list = TOPIC_SEEDS[cert];
  const lower = exclude.map((s) => s.toLowerCase());
  const filtered = list.filter((seed) => {
    const s = seed.toLowerCase();
    return !lower.some((ex) => ex.length > 4 && (s.includes(ex) || ex.includes(s)));
  });
  const pool = filtered.length > 0 ? filtered : list;
  return pool[Math.floor(Math.random() * pool.length)] as string;
}

function pickStyle(): Style {
  return STYLES[Math.floor(Math.random() * STYLES.length)] as Style;
}

function buildPrompt(cert: CertId, style: Style, topicSeed: string): string {
  return `Generate ONE original practice question for ${cert} (${CERT_DESCRIPTIONS[cert]}).

Goal: a different angle from the standard exam. Style: ${style}.

Style guide: ${STYLE_INSTRUCTIONS[style]}

${STYLE_EXAMPLES[style]}

FOCUS THIS QUESTION ON: ${topicSeed}.
Make this the actual subject - not a generic question. If the style does not naturally fit this topic, pick a related angle on it rather than drifting to a more comfortable topic.

LENGTH BUDGETS (hard limits - count words):
- Question text: <= 30 words for direct styles (first-principles, counterfactual). <= 60 words for scenario styles (find-the-flaw, steel-manning, devils-advocate).
- Each option: <= 18 words. No padding, no parentheticals unless essential.
- "why": <= 50 words.
- "selfCritique": <= 40 words.

Brevity discipline: cut every word that does not add information. No throat-clearing, no "this question tests...", no restating the question in options.

Hard rules:
- Marked-correct answer must align with Scrum Guide 2020 (and EBM Guide for PSPO1 if relevant). Cite the section NAME only — do NOT include page numbers (the Scrum Guide does not have stable pagination). The marked answer must be the ONLY answer defensible from the Guide - no "best of" judgment calls.
- Before writing selfCritique, internally ask: "If I were arguing for a different option, which one would I pick and why?" Then write that argument as the selfCritique. It MUST reference a specific wrong option from your options list (by paraphrasing it) or cite a competing Scrum interpretation. Do NOT affirm the marked answer; do NOT write "this question is sound" or "no concerns" - that is a self-rejection. If you cannot construct a real counter-argument from one of YOUR OWN distractors, the question is too easy or the distractors are too weak - reject it.
- After selfCritique, rate confidence 1-5. Use 5 ONLY if (a) the Scrum Guide passage you cited is unambiguous on this point AND (b) you generated a real counter-argument and still consider it weaker than the marked answer. If < 5, output {"reject": true, "reason": "..."} - do not generate a question you are not bulletproof on.
- All distractors plausible. No strawmen.
- Length-balance: correct option must NOT be conspicuously longest or shortest. All options similar in length.
- Type rules: "single" = exactly 4 options + 1 correct. "tf" = exactly 2 options ["True","False"] + 1 correct. "multi" = 5-7 options + 2-4 correct.

Output strict JSON only - no markdown, no commentary:
{
  "style": "${style}",
  "topic": "<short label, e.g. 'Sprint Goal'>",
  "scrumGuideSection": "<Scrum Guide 2020 section name, no page numbers>",
  "type": "single" | "multi" | "tf",
  "q": "<question text>",
  "options": ["..."],
  "correct": [<0-indexed integers>],
  "why": "<<=50 words explanation grounded in the Guide>",
  "selfCritique": "<<=40 words counter-argument referencing one of the wrong options>",
  "confidence": <integer 1-5>
}`;
}

const SELF_CRITIQUE_SIGNALS = [
  'could','might','however','but ','though','although','alternative','argue','argument',
  'objection','weak','challenge','contest','interpret','ambiguous','reasonable','defensible',
  'one might','one could','a learner','someone','unless','if ','against','counter','depending','arguable',
];

const SELF_CRITIQUE_AFFIRMATIONS = [
  /^\s*(this|the)\s+(question|answer|item)\s+is\s+(sound|solid|clean|clear|unambiguous|well[- ]formed|good|fine)/i,
  /^\s*no\s+(real\s+)?(concerns?|issues?|objections?|weakness)/i,
  /^\s*the\s+marked\s+answer\s+is\s+(clearly|obviously|undeniably)/i,
  /^\s*solid\b/i,
  /^\s*clean\b/i,
];

function isCounterArgument(critique: string): boolean {
  const lc = critique.toLowerCase();
  for (const re of SELF_CRITIQUE_AFFIRMATIONS) if (re.test(critique)) return false;
  return SELF_CRITIQUE_SIGNALS.some((sig) => lc.includes(sig));
}

function validate(parsed: unknown): GeneratedQuestion | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const p = parsed as Record<string, unknown>;
  if ((p as { reject?: boolean }).reject === true) return null;
  if (typeof p.confidence !== 'number' || p.confidence < 5) return null;
  if (typeof p.style !== 'string' || !STYLES.includes(p.style as Style)) return null;
  if (typeof p.topic !== 'string' || p.topic.length < 2) return null;
  if (typeof p.scrumGuideSection !== 'string' || p.scrumGuideSection.length < 4) return null;
  // Reject hallucinated page numbers
  if (/p\.?\s*\d+|pp\.?\s*\d+|page\s+\d+/i.test(p.scrumGuideSection as string)) return null;
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
  if (typeof p.selfCritique !== 'string' || p.selfCritique.length < 30) return null;
  if (!isCounterArgument(p.selfCritique as string)) return null;
  if (p.type === 'single' && (p.options.length !== 4 || p.correct.length !== 1)) return null;
  if (p.type === 'tf' && (p.options.length !== 2 || p.correct.length !== 1)) return null;
  if (p.type === 'multi' && (p.options.length < 5 || p.options.length > 7)) return null;
  if (p.type === 'multi' && (p.correct.length < 2 || p.correct.length > 4)) return null;

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

const PROD_URL = 'https://scrum-practice.vercel.app';
const ORIGIN_PATTERNS: RegExp[] = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
];

function originAllowed(origin: string | undefined, referer: string | undefined): boolean {
  const allowedExact: string[] = [PROD_URL];
  if (process.env.VERCEL_URL) allowedExact.push(`https://${process.env.VERCEL_URL}`);
  const candidates = [origin, referer].filter((v): v is string => typeof v === 'string' && v.length > 0);
  if (candidates.length === 0) return false;
  for (const candidate of candidates) {
    let url: URL;
    try { url = new URL(candidate); } catch { continue; }
    const clean = `${url.protocol}//${url.host}`;
    if (allowedExact.includes(clean)) return true;
    if (ORIGIN_PATTERNS.some((p) => p.test(clean))) return true;
  }
  return false;
}

const RATE_WINDOW_MS = 5 * 60 * 1000;
const RATE_MAX_PER_IP = 30;
const ipHits = new Map<string, number[]>();

function checkRateLimit(ip: string): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const prev = ipHits.get(ip) ?? [];
  const recent = prev.filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX_PER_IP) {
    const oldest = recent[0]!;
    const retryAfterSec = Math.max(1, Math.ceil((RATE_WINDOW_MS - (now - oldest)) / 1000));
    ipHits.set(ip, recent);
    return { ok: false, retryAfterSec };
  }
  recent.push(now);
  ipHits.set(ip, recent);
  if (ipHits.size > 500) {
    for (const [k, v] of ipHits.entries()) {
      const r = v.filter((t) => now - t < RATE_WINDOW_MS);
      if (r.length === 0) ipHits.delete(k);
      else ipHits.set(k, r);
    }
  }
  return { ok: true, retryAfterSec: 0 };
}

function getClientIp(req: VercelRequest): string {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) return xff.split(',')[0]!.trim();
  if (Array.isArray(xff) && xff[0]) return xff[0].split(',')[0]!.trim();
  const xri = req.headers['x-real-ip'];
  if (typeof xri === 'string' && xri.length > 0) return xri;
  return 'unknown';
}

async function generateOnce(
  client: Anthropic,
  cert: CertId,
  style: Style,
  topicSeed: string
): Promise<GeneratedQuestion | null> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{ role: 'user', content: buildPrompt(cert, style, topicSeed) }],
  });
  const block = response.content[0];
  if (!block || block.type !== 'text') return null;
  const text = block.text.trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(match[0]); } catch { return null; }
  const validated = validate(parsed);
  if (!validated) return null;
  return shuffleOptions(validated);
}

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const pickHeader = (h: string | string[] | undefined): string | undefined =>
    Array.isArray(h) ? h[0] : h;
  const origin = pickHeader(req.headers.origin);
  const referer = pickHeader(req.headers.referer);
  if (!originAllowed(origin, referer)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const ip = getClientIp(req);
  const limit = checkRateLimit(ip);
  if (!limit.ok) {
    res.setHeader('Retry-After', String(limit.retryAfterSec));
    res.status(429).json({ error: 'Rate limit exceeded', retryAfterSec: limit.retryAfterSec });
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

  const recentRaw = (req.query.recent as string | undefined) || '';
  const recentTopics = recentRaw.split('|').map((s) => s.trim()).filter(Boolean).slice(0, 5);

  const client = new Anthropic({ apiKey });

  let lastError: string | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const tryStyle = attempt === 0 ? style : pickStyle();
    try {
      const tryTopic = pickTopic(cert, recentTopics);
      const result = await generateOnce(client, cert, tryStyle, tryTopic);
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
    error: 'Could not generate a valid question after 5 attempts',
    detail: lastError,
  });
}
