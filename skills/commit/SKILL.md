---
name: commit
description: Analyze staged git changes, write a Conventional Commits message, and assess whether the changes should be split into smaller commits for good hygiene. Reads CONTRIBUTING.md for this repo's actual commit format when present, falling back to a sane default otherwise. Use when the user wants to commit, asks for a commit message, says "commit this", or has staged changes ready to review.
subagent-role: scout
---

# Commit

## Quick start

Run `git diff --staged` and `git status`, then draft a message and assess split hygiene.

## Commit format

Check `CONTRIBUTING.md` first — its "Commit message format" section is this
repo's actual convention (type list, scope rules, footer style, and whether ticket
numbers belong in the message). Use it as written; it overrides everything below.

If that file doesn't exist, or has nothing to say about commit format, fall back to:

```
<type>(<scope>): <subject>

[optional body — explain WHY, wrap at 72 chars]

[optional footer — BREAKING CHANGE:]
```

**Types**: feat | fix | docs | style | refactor | perf | test | build | ci | chore | revert

Breaking change: append `!` after type/scope and/or add `BREAKING CHANGE:` footer.

**No ticket-number slot in the subject, body, or footer.** If an issue key is already
in the branch name, it'll land in the PR too — repeating it here is redundant, not
wrong. This is the default, not an override: if `CONTRIBUTING.md` says this
repo *does* want ticket numbers in commit messages, follow that instead. Don't
reintroduce one by pattern-matching on older commits in this repo's history — history
predates the convention as often as it confirms it.

## Workflow

1. Read the diff — `git diff --staged` + `git status`
2. Check `CONTRIBUTING.md` for this repo's format (see above); use the default
   template if it's absent
3. Pick type and scope
4. Write subject — imperative mood, lowercase, no period, ≤72 chars, no ticket number
5. Add body if the why isn't obvious
6. Add footers for breaking changes
7. Assess hygiene (see below)
8. Present the message in a fenced block, ready to copy

## Split assessment

Only raise splitting if the diff clearly mixes distinct concerns:
- New feature + unrelated refactor
- Multiple unrelated bug fixes
- App logic + infra/config with different deployment semantics

Do NOT raise splitting for:
- A feature alongside its own tests
- A fix spanning multiple files in the same concern
- Tightly coupled changes (schema + migration + model)

When suggesting a split, name each proposed commit explicitly and list which files
belong to it.
