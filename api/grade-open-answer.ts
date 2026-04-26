import Anthropic from '@anthropic-ai/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateRequest, getProfile } from './_lib/auth.js';

export const maxDuration = 30;

type Difficulty = 'easy' | 'medium' | 'scrum-master';

interface GradeRequest {
  q: string;
  referenceAnswer: string;
  rubricKeyPoints: string[];
  scrumGuideSection: string;
  userAnswer: string;
  difficulty: Difficulty;
}

interface GradeResult {
  verdict: 'correct' | 'partial' | 'incorrect';
  score: number;
  feedback: string;
  hitKeyPoints: string[];
  missedKeyPoints: string[];
}

function parseDifficulty(s: unknown): Difficulty {
  if (s === 'easy' || s === 'medium' || s === 'scrum-master') return s;
  return 'medium';
}

function leniencyDirective(d: Difficulty): string {
  switch (d) {
    case 'easy':
      return `LENIENCY: maximum (recall-level grading)

The rubric on easy ONLY contains points that DIRECTLY answer the question. There are no "bonus" or "context" points at easy. If the learner hits all rubric points (in any phrasing), they are correct.

EXAMPLE of CORRECT grading on easy:
- Question: "Who can cancel a Sprint?"
- Rubric: ["The Product Owner has sole authority to cancel a Sprint"]
- Learner answer: "the product owner"
- Correct grade: { "verdict": "correct", "score": 9, "feedback": "Correctly identifies the Product Owner as the sole authority. Concise and accurate.", "hitKeyPoints": ["The Product Owner has sole authority to cancel a Sprint"], "missedKeyPoints": [] }
- Why correct: They named the Product Owner, which is what the question asked. Brevity is fine on easy.

EXAMPLE of WRONG grading on easy (do NOT do this):
- Same question, same answer ("the product owner")
- WRONG: { "verdict": "partial", "score": 6, "missedKeyPoints": ["Cancellation is rare", "Sprint Goal must be obsolete"] }
- Why wrong: The question asked WHO. The learner correctly said WHO. They are correct. Do not invent missed points that the question did not ask about. Do not deduct for brevity.

EXAMPLE of CORRECT grading on a list-style easy:
- Question: "Name the five Scrum Values"
- Rubric: ["Commitment", "Focus", "Openness", "Respect", "Courage"]
- Learner answer: "commitment, focus, openness, respect, and courage"
- Correct grade: { "verdict": "correct", "score": 10, "hitKeyPoints": [all 5], "missedKeyPoints": [] }

EXAMPLE of partial grading on easy (legitimate):
- Question: "What is the timebox of the Daily Scrum?"
- Rubric: ["15 minutes maximum"]
- Learner answer: "30 minutes"
- Grade: { "verdict": "incorrect", "score": 1, "missedKeyPoints": ["15 minutes maximum"], "feedback": "The Daily Scrum is timeboxed to 15 minutes, not 30." }
- Why: They got the fact wrong. That is "incorrect" — not because they were brief, but because the answer is wrong.

Easy-grading rules:
- Hit all rubric points (in any phrasing) → "correct" with score 9-10. missedKeyPoints MUST be empty.
- Got the answer factually WRONG → "incorrect" with score 0-3.
- Hit some but not all → "partial" with score 4-7.
- Brevity is NEVER a defect. The shortest correct answer wins.
- Do NOT add tangential "context" or "best practice" notes to missedKeyPoints. The rubric is the entire scoring surface.`;
    case 'medium':
      return `LENIENCY: high (application-level grading)

The rubric on medium contains conceptual points the learner should demonstrate, in any wording.

EXAMPLE of CORRECT grading on medium:
- Question: "Why is the Daily Scrum exactly 15 minutes?"
- Rubric: ["Forces focus on synchronization rather than detailed problem-solving", "Aligns with the Developers' need to plan only the next 24 hours of work", "Consistency reduces complexity and supports transparency"]
- Learner answer: "It's short to keep the team focused on planning the next day, not getting bogged down in problem-solving. Detailed work happens in separate conversations."
- Correct grade: { "verdict": "correct", "score": 9, "feedback": "Hits both the focus-not-problem-solving point and the next-24-hours framing. Doesn't explicitly mention transparency but the spirit is right.", "hitKeyPoints": ["Forces focus on synchronization rather than detailed problem-solving", "Aligns with the Developers' need to plan only the next 24 hours of work"], "missedKeyPoints": ["Consistency reduces complexity and supports transparency"] }
- Notice: 2 of 3 rubric points hit, learner got the spirit. Mark "correct" anyway because it's medium (not strict mastery) and the answer demonstrates real understanding.

PARAPHRASE RULES (any difficulty):
A rubric point is HIT if the learner's answer demonstrates the same CONCEPT, in any wording. Examples:
- Rubric "The Product Owner is accountable" matches: "the PO", "Product Owner role", "the person who owns the backlog", "PO is responsible".
- Rubric "Empiricism: transparency, inspection, adaptation" matches: "transparency, inspection, adaptation" (any order), "you make work visible, inspect it, and adapt", "the three pillars are visibility, checking, adjusting".
- Rubric "Cross-functional team has all skills needed" matches: "the team has every skill it needs", "no external dependencies for the team's work", "Developers cover all the disciplines".

If the learner names the concept in their own words, mark it HIT. Do not require word-level matching with the rubric.

Medium-grading rules:
- Hit most rubric points (e.g., 2 of 3 or 3 of 4) AND the spirit is right → "correct" with score 8-10.
- Hit half OR has minor errors → "partial" with score 5-7.
- Mostly missed OR has wrong claims → "incorrect" with score 0-4.
- Penalize wrong claims about Scrum (wrong roles, wrong timeboxes) regardless of how much else they got right.`;
    case 'scrum-master':
      return `LENIENCY: balanced (mastery-level grading)

The rubric on scrum-master covers diagnosis AND resolution. The learner must demonstrate both, but their reasoning may take a different valid path than the reference.

EXAMPLE of CORRECT grading on scrum-master:
- Question: "A Scrum Team has a Product Owner who is a committee of three managers..."
- Rubric: ["The PO accountability requires a single person — root structural cause", "Without a single PO, ordering and accountability break down", "Resolution: surface to org, advocate single PO, coach leadership", "Until resolved, value maximization is impossible"]
- Learner answer: "The root issue is that Scrum requires a single Product Owner, not a committee. With three people voting, no one can authoritatively order the backlog. As Scrum Master I would coach leadership on this, surface the impediment, and advocate that they pick one of the three to be the PO. Until that happens, the team can deliver but won't maximize value."
- Correct grade: { "verdict": "correct", "score": 9, "hitKeyPoints": [all 4], "missedKeyPoints": [] }

PARAPHRASE RULES (apply at all difficulties — see medium directive above for examples).

Scrum-master grading rules:
- Hit most diagnosis + resolution points AND reasoning is Scrum-Guide-defensible → "correct" with score 8-10.
- Got diagnosis right but resolution weak (or vice versa) → "partial" with score 5-7.
- Missed diagnosis OR has wrong claims about Scrum → "incorrect" with score 0-4.
- A different valid framing is fine. Strict only on factual errors (wrong accountabilities, wrong events, wrong timeboxes).
- The learner can take a different path to a Scrum-Guide-grounded conclusion. Reward the thinking.`;
  }
}

function buildGradePrompt(g: GradeRequest): string {
  return `You are grading a learner's open-response answer to a Scrum question. Be fair, generous on phrasing, strict on factual correctness about Scrum.

Before outputting JSON, think through these questions internally:
1. What CONCEPT does each rubric point represent (not just its words)?
2. Did the learner demonstrate that concept, in any wording?
3. Did they make any factually wrong claim about Scrum?

QUESTION (difficulty: ${g.difficulty}):
${g.q}

SCRUM GUIDE SECTION: ${g.scrumGuideSection}

REFERENCE ANSWER:
${g.referenceAnswer}

RUBRIC KEY POINTS (the learner should demonstrate these CONCEPTS, in any wording):
${g.rubricKeyPoints.map((kp, i) => `${i + 1}. ${kp}`).join('\n')}

LEARNER'S ANSWER:
"""
${g.userAnswer}
"""

${leniencyDirective(g.difficulty)}

Universal rules:
- Match the learner's answer to each rubric key point at the CONCEPT level. Mark "hit" if the concept is clearly present, even paraphrased or by example. Mark "missed" if the concept is absent or wrong.
- Synonyms, examples, and answers in the learner's own words all count for hits.
- Penalize wrong claims about Scrum regardless of difficulty (e.g. "the SM assigns work", "the PO is a committee", wrong timeboxes).
- Do NOT add to missedKeyPoints anything that is not literally in the rubric. The rubric is the entire scoring surface.

Verdict thresholds:
- "correct" = all/most rubric points hit AND no significant wrong claims (score 8-10)
- "partial" = some rubric points hit OR has minor errors (score 4-7)
- "incorrect" = most rubric points missed OR has significant wrong claims about Scrum (score 0-3)

Feedback: 1-3 sentences. Specific. State what they got right, what they missed (if anything), and any wrong claim. No filler.

Output strict JSON only - no markdown, no commentary:
{
  "verdict": "correct" | "partial" | "incorrect",
  "score": <integer 0-10>,
  "feedback": "<1-3 sentences>",
  "hitKeyPoints": [<rubric points hit, copied exactly from the rubric above>],
  "missedKeyPoints": [<rubric points missed, copied exactly>]
}`;
}

function validate(parsed: unknown, rubric: string[]): GradeResult | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const p = parsed as Record<string, unknown>;
  if (p.verdict !== 'correct' && p.verdict !== 'partial' && p.verdict !== 'incorrect') return null;
  if (typeof p.score !== 'number' || p.score < 0 || p.score > 10) return null;
  if (typeof p.feedback !== 'string' || p.feedback.length < 5) return null;
  if (!Array.isArray(p.hitKeyPoints) || !Array.isArray(p.missedKeyPoints)) return null;
  const hit = (p.hitKeyPoints as unknown[]).filter((k): k is string => typeof k === 'string');
  const miss = (p.missedKeyPoints as unknown[]).filter((k): k is string => typeof k === 'string');
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
  if (!auth) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const profile = await getProfile(auth.supabaseAdmin, auth.user.id);
  if (!profile) { res.status(403).json({ error: 'Profile not found' }); return; }
  const allowed = profile.tier === 'pro' || profile.tier === 'admin' || profile.is_admin === true;
  if (!allowed) { res.status(403).json({ error: 'Pro tier required' }); return; }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'Server not configured' }); return; }

  const body = req.body as Partial<GradeRequest> | undefined;
  if (!body || typeof body !== 'object') { res.status(400).json({ error: 'Missing JSON body' }); return; }
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
  if (body.userAnswer.length > 4000) { res.status(400).json({ error: 'Answer too long (max 4000 chars)' }); return; }
  if (body.userAnswer.trim().length < 3) { res.status(400).json({ error: 'Answer too short to grade' }); return; }

  const gradeReq: GradeRequest = {
    q: body.q,
    referenceAnswer: body.referenceAnswer,
    rubricKeyPoints: body.rubricKeyPoints as string[],
    scrumGuideSection: body.scrumGuideSection,
    userAnswer: body.userAnswer,
    difficulty: parseDifficulty(body.difficulty),
  };

  const client = new Anthropic({ apiKey });

  let lastError: string | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: buildGradePrompt(gradeReq) }],
      });
      const block = response.content[0];
      if (!block || block.type !== 'text') { lastError = 'Empty response'; continue; }
      const match = block.text.trim().match(/\{[\s\S]*\}/);
      if (!match) { lastError = 'No JSON in response'; continue; }
      let parsed: unknown;
      try { parsed = JSON.parse(match[0]); } catch { lastError = 'Bad JSON'; continue; }
      const validated = validate(parsed, gradeReq.rubricKeyPoints);
      if (!validated) { lastError = 'Validation failed'; continue; }
      res.status(200).json(validated);
      return;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      console.error(`Grade attempt ${attempt} failed:`, lastError);
    }
  }
  res.status(502).json({ error: 'Could not grade after 3 attempts', detail: lastError });
}
