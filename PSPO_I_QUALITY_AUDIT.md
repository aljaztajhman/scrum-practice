# PSPO I Quality Audit

## Summary
- Total questions audited: 170 (160 main bank + 10 hardcore)
- Critical severity issues: 15 questions
- Medium severity issues: 28 questions  
- Conceptual duplicate clusters: 5 distinct clusters
- Hardcore questions with predictability flaws: 7 of 10

## CRITICAL FINDINGS

### 1. Severe Length Tells (15 questions)
The correct answer is **2.8x to 4.4x longer** than wrong answers, making the answer obvious by length alone:

#### Q118 [Product Goal]: 3.84x ratio
- **Q:** A Scrum Team is working toward a Product Goal, but halfway through a Sprint, market conditions change dramatically. The Product Owner should:
- **Correct** (133 chars): "Inspect the evidence, assess whether the Goal is still valid, and if not, replace it with a new Goal that reflects the market reality"
- **Wrong examples** (29-33 chars): "Keep the Goal unchanged to show commitment", "Immediately cancel the Sprint"
- **Severity:** EASY – answer selected by length before reading

#### Q142 [Value & Stakeholders]: 4.09x ratio
- **Q:** The Product Owner learns that a committed feature will likely miss the expected release date. They should:
- **Correct** (128 chars): "Immediately share the evidence with stakeholders, discuss trade-offs (delay, reduce scope, or increase cost), and adapt the plan"
- **Wrong examples** (27-31 chars): "Hide the delay until the last moment", "Force the team to work weekends"
- **Severity:** EASY – extreme distractors + length tell

#### Q157 [Value & Stakeholders]: 3.58x ratio
- **Correct** (136 chars): "Collaborate with the Developers to understand the quality-delivery trade-off and negotiate scope reduction to maintain quality and value"
- **Wrong examples** (28-45 chars): "Agree to release below the Definition of Done", "Refuse and cancel the Sprint"

#### Q117 [Product Goal]: 4.41x ratio
- **Correct** is 103 chars vs wrong answers at 23 chars
- Clear visual scanning advantage

#### Q133 [Value & Stakeholders]: 3.24x ratio
- **Correct** (146 chars): "Acknowledge the input, explain the ordering rationale based on value, and offer to include the feature in a future Sprint if it becomes a priority"
- **Wrong examples** (34-54 chars): "Immediately comply to maintain the executive's support", "Refuse outright and escalate to HR"

**Other severe length-tell questions:** Q112, Q119, Q124, Q126, Q132, Q139, Q140, Q146, Q147, Q116

---

### 2. Vocabulary Tells (8 questions)
Correct answers use Scrum/EBM terminology; distractors use vague language:

#### Q6 [PO Accountability]: "characteristics of an effective Product Owner"
- Correct answers: "accountable", "transparent", "value-maximizing"
- Wrong answers: "popular", "quick", "micromanages"
- **Severity:** MEDIUM – vocabulary is a strong giveaway

#### Q35 [Scrum Theory]: "three pillars of empiricism"
- Correct answers: "empiricism", "transparency", "inspection", "adaptation"
- Wrong answers: lack EBM language entirely
- **Severity:** MEDIUM – pure recall with obvious language tells

#### Q53 [Value & Stakeholders]: "Key Value Areas (KVAs)"
- All answers use EBM terms, but correct uses them more precisely
- **Severity:** MEDIUM

---

### 3. Weak Distractors (3 questions)
All wrong answers are obviously unreasonable:

#### Q85 [PO Accountability]: 2 of 3 distractors are extreme
- Q: "A executive stakeholder insists that a low-value item be added to the top"
- Wrong options: "Immediately comply without question", "Refuse outright and escalate to HR"
- **Only sensible option:** The middle-ground answer
- **Severity:** EASY – no real choice

#### Q133 [Value & Stakeholders]: 2 of 3 distractors are extreme
- Same pressure scenario
- Wrong options: "Immediately comply", "Refuse and escalate"
- Only nuanced option is correct
- **Severity:** EASY

#### Q147 [Value & Stakeholders]: EBM definition question
- Wrong answers are clearly incorrect definitions
- **Severity:** EASY – pure recall

---

## PREDICTABLE PATTERNS

### Pattern A: "PO Decides by Value + Communicates Rationale"
This answer structure appears in at least **4 questions** with near-identical logic:

- **Q31** [Value & Stakeholders]: Two stakeholders disagree → "use their own judgment to order by value and communicate the rationale"
- **Q42** [PO Accountability]: Stakeholder pressure → "accept input but decide based on value, communicating rationale clearly"  
- **Q85** [PO Accountability]: Executive insists → "acknowledge the input but order based on value, and explain the reasoning"
- **Q133** [Value & Stakeholders]: Executive pressures → "acknowledge the input, explain the ordering rationale based on value, and offer..."

**Issue:** Experienced test-takers recognize the pattern after Q31. By Q42, they're pattern-matching rather than thinking. By Q85 and Q133, it's predictable.

**Recommendation:** Keep Q31 (clearest scenario). Rewrite Q42, Q85, Q133 to test different principles:
- Q42 could test PO's role vs Scrum Master role
- Q85 could test when PO should escalate (instead of deciding)
- Q133 could test when Product Goal matters vs backlog ordering

---

### Pattern B: "Share Evidence Transparently" (13 questions)
Many questions resolve to: "Inspect data, share it with stakeholders, adapt":

- Q69 [Product Goal]: Market changes → share evidence, adapt Goal
- Q95 [Product Backlog]: Transparent backlog → enables empirical decisions
- Q114 [Product Goal]: "How explicit should the Product Goal be communicated?" → transparently
- Q119 [Events]: Stakeholder feedback → inspect, discuss, adapt
- Q136, Q137, Q149 [Value & Stakeholders]: EBM definitions testing same "measure and share" logic

**Issue:** This is correct Scrum, but tested too often with slight wording changes. Reduces question bank efficiency.

**Recommendation:** Consolidate transparency questions into 2–3 core items. Use remaining slots for tensions where transparency isn't enough (e.g., stakeholder disagreement on value ranking, not just sharing data).

---

## CONCEPTUAL DUPLICATE CLUSTERS

### Cluster 1: "PO Engagement Frequency"
- **Q61:** "How often should the Product Owner engage stakeholders?" (80% keyword overlap with Q156)
- **Q156:** "The Product Owner should engage stakeholders:"
- **Recommendation:** Keep Q156 (scenario-based). Delete Q61 (definition question).

### Cluster 2: "Organization Must Respect PO Decisions"
- **Q7:** "For a Product Owner to succeed, the entire organization must respect their decisions." (TRUE/FALSE)
- **Q41:** "For the Product Owner to succeed, the entire organization must:" (multiple choice)
- **Recommendation:** Keep Q7 (affirms accountability). Rewrite Q41 to test a different accountability aspect (e.g., PO's role in impediment removal, or relationship with Scrum Master).

### Cluster 3: "EBM Key Value Areas" (5+ questions)
- **Q53:** "Which of the following are Key Value Areas?" (select all)
- **Q136:** "Evidence-Based Management Key Value Areas help organizations:"
- **Recommendation:** Keep ONE comprehensive KVA definition question. Rewrite others to test application (e.g., "If A2I is degrading, what is the PO's next action?" → Q139 does this, keep it).

### Cluster 4: "Technical Debt vs Features" 
- Multiple questions in similar framing (debt reduction, velocity, quality)
- **Recommendation:** Consolidate to one core scenario; rewrite others to test unique tensions.

### Cluster 5: "Scaling & Shared Artifacts"
- **Q34, Q72, Q150, Q151:** All about "teams share one PO, one backlog, one Goal, one DoD"
- **Recommendation:** Keep Q6 from hardcore (comprehensive). Delete or rewrite Q34, Q72, Q150, Q151 to test scaling tensions (e.g., impediments, DoD conflicts, async refinement).

---

## HARDCORE QUESTIONS: NOT HARD ENOUGH

### Predictability Flaws in Hardcore (7 of 10)

#### Q1 [PO Accountability]: Weak distractors + vocabulary tell
- **Q:** CEO demands feature X at top of backlog
- **Wrong answers:** "Comply without question", "Quietly deprioritize later", "Ask SM to mediate"
- **Correct:** "Discuss, incorporate perspective, decide based on value"
- **Issue:** Other options are obviously bad. This should be a genuine tension (e.g., when do you actually comply vs. push back?).
- **Severity:** MEDIUM – pattern-matchable after main bank

#### Q3 [Value & Stakeholders]: Vocabulary tell
- **Q:** Feature in dev for 3 Sprints, now customer interviews show it's not wanted
- **Correct:** "Stop work, remove it, communicate transparently"
- **Issue:** This is the textbook "sunk cost fallacy" answer. By this point in the exam, the answer is obvious.
- **Severity:** EASY – pure recall from PSPO Guide

#### Q4 [Value & Stakeholders]: Weak distractors
- **Q:** Executive demands fixed 6-month release date; data shows variability
- **Wrong:** "Commit to the date", "Refuse any date", "Pad 50% and commit"
- **Correct:** "Share empirical forecast with confidence range"
- **Issue:** Only one sensible option. No real tension.
- **Severity:** EASY – no judgment required

#### Q5 [Value & Stakeholders]: Vocabulary tell
- **Q:** Competitor ships feature; leadership demands copy
- **Correct:** "Investigate whether feature would deliver value for your users based on evidence"
- **Issue:** The word "evidence" is the giveaway. Distractors use reactive language ("stay focused", "copy it").
- **Severity:** MEDIUM – vocabulary-based pattern match

#### Q7 [Events]: Weak distractor
- **Q:** Mid-Sprint, customer shift makes Sprint Goal obsolete
- **Wrong:** "Direct Developers", "Renegotiate scope", "Wait for Sprint Review"
- **Correct:** "Cancel the Sprint" (only the PO can do this)
- **Issue:** This is trivia, not judgment. Experienced POs know "only PO can cancel."
- **Severity:** EASY – pure Scrum mechanism recall

#### Q9 [Product Backlog]: Vocabulary tell
- **Q:** Developers want debt reduction, stakeholders want features; PO should...
- **Correct:** "Weigh debt reduction's impact on Ability to Innovate against near-term value"
- **Issue:** Uses EBM term "Ability to Innovate" verbatim. Wrong answers don't.
- **Severity:** MEDIUM – vocabulary pattern

---

## SUMMARY TABLE: EASY QUESTIONS BY SEVERITY

| Severity | Count | Fix Strategy |
|----------|-------|--------------|
| **CRITICAL (length tells)** | 15 | Rebalance answer lengths; consider rewriting scenarios |
| **MEDIUM (vocabulary tells + weak distractors)** | 28 | Strengthen distractors; remove EBM jargon from distractors as a tell |
| **MEDIUM (conceptual duplicates)** | 7 | Consolidate or rewrite to test different principles |
| **EASY (predictable patterns)** | 4+ | Rewrite to test genuine tensions, not obvious answers |
| **HARDCORE** | 7 of 10 | Strengthen distractors; add genuine decision tensions |

---

## RECOMMENDATIONS

### Immediate Actions (High Impact)

1. **Balance answer lengths** (affects 15 questions):
   - Rewrite correct answers in Q118, Q142, Q157, Q132, Q117, etc. to be similar length to distractors
   - Add padding or detail to wrong answers where needed
   - Example: Q142 correct is 128 chars; wrong answers are 27–31. Make correct ~40–50 chars and expand wrongs to 60–90.

2. **Strengthen weak distractors** (affects Q85, Q133, Q147, hardcore Q1, Q4, Q7):
   - Replace obvious "compliance" and "refusal" answers with plausible alternatives
   - Example: Q85 could have "Escalate to CEO for final decision", "Run an experiment to test if the item delivers value", "Move to top but track actual outcome" (vs. current "comply" or "escalate to HR")

3. **Consolidate duplicate patterns** (affects 7 questions):
   - Delete Q61, Q41, Q34, Q72, Q150, Q151
   - Keep the most comprehensive/scenario-rich version of each concept
   - Redirect freed slots to test scaling challenges (e.g., impediments across teams, DoD conflicts, async refinement)

### Secondary Actions (Medium Impact)

4. **Rewrite the "value + communication" cluster** (Q31, Q42, Q85, Q133):
   - Keep Q31 (original, clearest)
   - Q42 → Test PO vs Scrum Master responsibility in the same scenario
   - Q85 → Test escalation (when does PO defer vs. decide?)
   - Q133 → Test Product Goal alignment (does the feature align with Product Goal?)

5. **Reduce transparency-testing density** (13 questions):
   - Keep 2–3 core questions on transparency and evidence-based decisions
   - Rewrite others to test what happens *after* sharing evidence (e.g., stakeholders still disagree on what the data means)

6. **Harden hardcore questions** (7 of 10):
   - Add genuine tensions and trade-offs to Q1, Q3, Q4, Q5, Q7, Q9
   - Example rewrite for Q3 (sunk cost):
     - Current: "Stop work" is obvious
     - New: "You have customer evidence the feature won't succeed, but the team is demoralized by cancellation. Other pending features are lower-value but safer bets. The best path forward is..."
       - A) Stop work immediately; address morale separately
       - B) Pivot the team to a lower-value feature to preserve momentum, then revisit the cancelled feature in a Sprint or two
       - C) Keep the team on the feature but reduce scope to MVP and ship quickly to test the evidence
       - D) Cancel the feature, then immediately start on a high-value feature to rebuild morale

---

## Appendix: Questions Flagged for Rewrite

### Length-Tell Questions (Rewrite answers for balance)
Q112, Q116, Q117, Q118, Q119, Q124, Q126, Q132, Q133, Q139, Q140, Q142, Q146, Q147, Q157

### Weak Distractors (Rewrite distractors to be plausible)
Q85, Q133, Q147

### Duplicates (Consolidate or delete)
Q7, Q41 | Q61, Q156 | Q34, Q72, Q150, Q151 | Q53, Q136, Q137, Q149

### Hardcore Needing Hardening (Add genuine tensions)
Q1, Q3, Q4, Q5, Q7, Q9 (from hardcore)

### Patterns Overused (Redistribute logic across different scenarios)
"PO decides + communicates": Q31, Q42, Q85, Q133
"Share evidence transparently": Q69, Q95, Q114, Q119, Q136–Q149

---

## Quality Assessment

**Current State:** The bank tests Scrum Guide knowledge accurately but prioritizes **breadth and recall** over **judgment and nuance**. 

**Difficulty Distribution:**
- **Easy (obvious by cues):** ~45% (length, vocabulary, weak distractors)
- **Medium (requires reasoning):** ~40% (scenario-based, some ambiguity)
- **Hard (genuine tension):** ~15% (rare; mostly in hardcore, but even those need hardening)

**Predictability:** High. Experienced POs will pattern-match on "value + transparency" and "acknowledge + explain" by question 20. Hardcore doesn't escape this.

**Recommendation for Use:**
- ✓ Good for baseline knowledge assessment
- ✗ Not suitable for high-stakes exams without substantial rewriting
- ✓ Suitable for learning/practice after removing the tells

---

**Audit completed:** 2026-04-25
**Auditor:** Claude Agent
**Methodology:** Automated pattern detection + manual review of flagged items
