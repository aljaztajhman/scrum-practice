import Anthropic from '@anthropic-ai/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateRequest, getProfile } from './_lib/auth.js';

interface GradeRequest {
  q: string;
  referenceAnswer: string;
  rubricKeyPoints: string[];
  scrumGuideSection: string;
  userAnswer: string;
}

interface GradeResult {
  verdict: 'correct' | 'partial' | 'incorrect';
  score: number;
  feedback: string;
  hitKeyPoints: string[];
  missedKeyPoints: string[];
}

function buildGradePrompt(g: GradeRequest): string {
  return `You are grading a learner's open-response answer to a Scrum question. Be fair, specific, and grounded in the Scrum Guide 2020.

QUESTION:
${g.q}

SCRUM GUIDE SECTION: ${g.scrumGuideSection}

REFERENCE ANSWER (a model correct answer):
${g.referenceAnswer}

RUBRIC KEY POINTS (the learner must demonstrate these to be considered correct):
${g.rubricKeyPoints.map((kp, i) => `${i + 1}. ${kp}`).join('\n')}

LEARNER'S ANSWER:
"""
${g.userAnswer}
"""

Grading rules:
- Match the learner's answer to each rubric key point. Mark it "hit" if the concept is clearly present, even in different words. Mark it "missed" if absent or wrong.
- Be lenient on phrasing — credit synonyms, paraphrases, examples that demonstrate understanding.
- Be strict on conceptual correctness — if the learner makes a clearly wrong claim about Scrum (e.g. "the SM assigns work to Devs", "the PO can be a committee"), penalize even if other points are hit.
- Verdict thresholds:
  - "correct" = hit all or all-but-one key points AND no significant wrong claims (score 8-10)
  - "partial" = hit some key points OR has minor errors (score 4-7)
  - "incorrect" = missed most key points OR has significant wrong claims (score 0-3)
- Feedback: 1-3 sentences. State what they got right, what they missed, what (if any) wrong claim they made. Plain, direct prose.

Output strict JSON only - no markdown, no commentary:
{
  "verdict": "correct" | "partial" | "incorrect",
  "score": <integer 0-10>,
  "feedback": "<1-3 sentence rationale>",
  "hitKeyPoints": [<rubric points the learner hit, copied exactly>],
  "missedKeyPoints": [<rubric points the learner missed, copied exactly>]
}`;
}

function validate(parsed: unknown, rubric: string[]): GradeResult | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const p = parsed as Record<string, unknown>;
  if (p.verdict !== 'correct' && p.verdict !== 'partial' && p.verdict !== 'incorrect') return null;
  if (typeof p.score !== 'number' || p.score < 0 || p.score > 10) return null;
  if (typeof p.feedback !== 'string' || p.feedback.length < 5) return null;
  if (!Array.isArray(p.hitKeyPoints) || !Array.isArray(p.missedKeyPoints)) return null;
  // Coerce strings
  const hit = (p.hitKeyPoints as unknown[]).filter((k): k is string => typeof k === 'string');
  const miss = (p.missedKeyPoints as unknown[]).filter((k): k is string => typeof k === 'string');
  // Sanity: hit + miss should roughly cover the rubric (model can paraphrase though)
  if (hit.length + miss.length < Math.max(1, rubric.length - 1)) return null;
  return {
    verdict: p.verdict,
    score: p.score,
    feedback: p.feedback,
    hitKeyPoints: hit,
    missedKeyPoints: miss,
  };
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
  if (req.method !== 'POST') {
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

  // Validate body
  const body = req.body as Partial<GradeRequest> | undefined;
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'Missing JSON body' });
    return;
  }
  if (
    typeof body.q !== 'string' || body.q.length < 5 ||
    typeof body.referenceAnswer !== 'string' || body.referenceAnswer.length < 5 ||
    typeof body.scrumGuideSection !== 'string' ||
    !Array.isArray(body.rubricKeyPoints) || body.rubricKeyPoints.length === 0 ||
    typeof body.userAnswer !== 'string'
  ) {
    res.status(400).json({ error: 'Invalid body shape' });
    return;
  }
  // Cap user answer length to prevent prompt injection / runaway tokens
  if (body.userAnswer.length > 4000) {
    res.status(400).json({ error: 'Answer too long (max 4000 chars)' });
    return;
  }
  // Reject empty / whitespace-only answers without burning a Claude call
  if (body.userAnswer.trim().length < 3) {
    res.status(400).json({ error: 'Answer too short to grade' });
    return;
  }

  const gradeReq: GradeRequest = {
    q: body.q,
    referenceAnswer: body.referenceAnswer,
    rubricKeyPoints: body.rubricKeyPoints as string[],
    scrumGuideSection: body.scrumGuideSection,
    userAnswer: body.userAnswer,
  };

  const client = new Anthropic({ apiKey });

  let lastError: string | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{ role: 'user', content: buildGradePrompt(gradeReq) }],
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
      const validated = validate(parsed, gradeReq.rubricKeyPoints);
      if (!validated) {
        lastError = 'Validation failed';
        continue;
      }
      res.status(200).json(validated);
      return;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      console.error(`Grade attempt ${attempt} failed:`, lastError);
    }
  }
  res.status(502).json({ error: 'Could not grade after 3 attempts', detail: lastError });
}
