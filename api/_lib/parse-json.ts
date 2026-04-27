/**
 * Robustly extract a JSON object from LLM output that may contain prose before/after.
 *
 * Strategy:
 * 1. Find the first '{'.
 * 2. Walk forward, balancing braces while respecting strings (quotes + escapes).
 * 3. Return the first balanced substring that JSON.parse() accepts.
 * 4. If that fails, fall back to a non-greedy regex match for safety.
 *
 * Returns null if no parseable JSON object is found.
 */
export function extractJsonObject(text: string): unknown | null {
  if (!text) return null;

  // Walk the string finding balanced { ... } blocks.
  for (let start = text.indexOf('{'); start !== -1; start = text.indexOf('{', start + 1)) {
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < text.length; i++) {
      const c = text[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (c === '\\') {
        escape = true;
        continue;
      }
      if (c === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) {
          // Candidate balanced block from start to i (inclusive)
          const candidate = text.slice(start, i + 1);
          try {
            return JSON.parse(candidate);
          } catch {
            // Try next start position
            break;
          }
        }
      }
    }
  }

  // Fallback: greedy match (existing behavior). Last resort.
  const greedy = text.match(/\{[\s\S]*\}/);
  if (!greedy) return null;
  try {
    return JSON.parse(greedy[0]);
  } catch {
    return null;
  }
}
