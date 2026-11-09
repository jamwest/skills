# Refactor Candidates

Used in two places, with different scopes:

- **TIDY** (step 4, after each green) — only the code written this cycle. Renames, inlining,
  duplication within the cycle. No new abstractions.
- **Make it right** (step 5, once all behaviors pass) — the whole diff, plus small tidies elsewhere
  in files the task already touched. See the scope table in SKILL.md step 5.

Look for:

- **Duplication** → Extract function/class
- **Long methods** → Break into private helpers (keep tests on public interface)
- **Shallow modules** → Combine or deepen
- **Feature envy** → Move logic to where data lives
- **Primitive obsession** → Introduce value objects

## Leave it better — but stay in bounds

In files the task already touched, fix small things near your change: an unclear name, dead
code, a tiny extract. Nothing that changes an interface another file depends on.

Existing code the new work reveals as problematic **outside** those files is not a refactor
candidate here. If it's an obvious missing seam or shallow module, record it as a **seam
candidate** for the report — where, what the seam would be, rough file count, confined or not —
and let the user decide whether to roll it in or hand it to `/deepen`.
