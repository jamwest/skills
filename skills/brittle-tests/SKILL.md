---
name: brittle-tests
description: Scan test files — from a diff, the whole suite, or a given path/glob — for brittle-test anti-patterns (testing implementation instead of behavior, fragile UI locators, fixed sleeps/waits, hardcoded test data) and report findings with file:line, why it's brittle, and a suggested fix, ranked by confidence. Use when the user wants to audit test quality/reliability, mentions tests breaking on unrelated refactors, or asks to check for brittle or flaky-adjacent tests.
subagent-role: reviewer
argument-hint: "fixed point to diff against (default), 'all' to scan the whole test suite, or a file/glob to target specific tests"
---

# Brittle Tests

A **brittle test** fails when the code under test is still correct — usually after a refactor, a styling tweak, or an internal implementation change that doesn't affect user-facing behavior. This is distinct from a **flaky test**, which fails intermittently on completely unchanged code; flaky tests are a timing/isolation problem, not a scope for this skill.

This skill scans test files for four anti-patterns known to cause brittleness, and reports what it finds — it does not rewrite tests. Fixing is a deliberate follow-up step the user drives.

## Process

### 1. Resolve scope

The argument determines what gets scanned:

- **A git ref** (branch, tag, commit, `main`, `HEAD~5`) — diff since that point: `git diff <fixed-point>...HEAD --name-only`, filtered to test files (see heuristic below). Confirm the ref resolves (`git rev-parse <fixed-point>`) before going further.
- **`all`** — scan every test file in the repo, found via the heuristic below.
- **A path or glob** — scan exactly those files, no filtering.
- **No argument given** — ask the user whether to diff since a fixed point (and which one) or scan the whole suite. Don't guess.

**Test file heuristic:** filenames/paths matching `*.test.*`, `*.spec.*`, `__tests__/`, `test_*.py`, `*_test.py`, `*Test.java`, `*_spec.rb`, `spec/**`, `e2e/**`, `cypress/**`. When scanning a diff, apply this filter to the changed-file list; when scanning `all`, use it to find candidates in the first place.

If no test files are found in scope, say so and stop — don't scan production code.

### 2. Scan against the brittleness baseline

Read each target file and check it against the four categories below. Like `review`'s smell baseline, each is a judgement call, not a hard violation — a test can look like it matches a pattern and still be the right call for that codebase. Flag it anyway and let the user decide; don't silently suppress based on your own guess about intent.

- **Implementation over behavior** — the test asserts *how* the code works instead of *what it returns or does*: exact internal call counts/order, private method invocations, exact query strings, snapshots of internal structures rather than outputs. → Fix: assert on the observable output or effect instead.
- **Fragile locators** — UI/DOM selectors tied to structure rather than meaning: positional XPath (`/html/body/div[2]/...`), `nth-child` chains, deep CSS descendant chains. → Fix: use semantic selectors — role, label, text, or a dedicated test attribute (e.g. `data-testid`).
- **Fixed waits** — hardcoded sleep/delay instead of waiting on a condition: `waitForTimeout(N)`, `sleep(N)`, `Thread.sleep(N)`, `time.sleep(N)`. → Fix: wait on the actual condition (element visible, request resolved, state changed) instead of a duration.
- **Hardcoded test data assumptions** — the test assumes specific data pre-exists in a shared fixture or database (a literal user ID, email, row) rather than creating and cleaning up its own. → Fix: have the test create its own isolated data (factory, fixture builder) and tear it down (transactional rollback or explicit cleanup).

### 3. Rate confidence per finding

- **High** — an unambiguous instance: a literal `sleep`/`waitForTimeout` call, a positional XPath, a snapshot of an internal object graph.
- **Medium** — matches the pattern but plausibly intentional (e.g. asserting a mock was called once, which is sometimes exactly the right contract to test).
- **Low** — a judgement call that depends on context the scan can't see (e.g. a hardcoded ID that might be a documented seed-data convention for this repo).

Don't drop Low findings — report them with the confidence label so the user can triage.

### 4. Report

Markdown report, grouped by category, each finding sorted highest-confidence-first within its group:

```
## Implementation over behavior
- **[High]** `path/to/file.ts:42` — asserts the internal SQL string instead of the query result.
  Fix: assert on the returned rows/shape instead.

## Fragile locators
...
```

Close with a one-line summary: total findings per category, and the single most confident finding overall.

## What this skill does not do

- Doesn't touch **flaky** tests (nondeterministic failures on unchanged code) — that's a timing/isolation problem, not brittleness.
- Doesn't auto-fix anything — report only. Fixing is a separate, deliberate step.
- Doesn't do general correctness/security review — that's the host's code-review flow.
- Doesn't verify UI behavior via a live browser — see `ui-evidence` for that.
