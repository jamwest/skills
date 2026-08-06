# PR description format

A reviewer should have full context within ~30 seconds of reading. Every rule here
exists to protect that: if a section doesn't earn its place, cut it.

## Title

```
<issue-key> | <short imperative summary>
```

Example: `GROOV-2452 | Add copy button to action plan create/edit`

Without a linked issue key, drop the prefix: `Add copy button to action plan
create/edit`. Match whatever ticket-prefix format `CONTRIBUTING.md` records for
this repo — the pattern above is a common default, not a fixed rule.

## Body

```markdown
## Summary

- <what changed, in this area, and why — one bullet per logical change>
- <...>

## Evidence

<the markdown block ui-evidence produced, pasted in verbatim>

## Note

<only if something is genuinely risky — a migration, a flag flip, a breaking change>
```

Omit a section entirely rather than filling it with a placeholder. No "Evidence" heading
with "N/A" under it, no empty "Note" section, no "Testing: none" line.

## Summary bullets

- One bullet per logical change, not per file or per commit. A PR that touched 12 files
  to do one thing gets one bullet.
- State the *why* when it isn't obvious from the *what* — "extracted the retry logic so
  the webhook handler can reuse it" beats "refactored retry logic".
- Cut anything a reviewer would classify as implementation detail rather than a decision:
  renamed variables, reformatted files, dependency bumps with no behavior change.

## What "concise" means here

- 2-4 summary bullets covers nearly every PR. A fifth bullet is a sign the change should
  probably have been two PRs, not a sign the description needs to be longer.
- No restating the diff ("changed X from A to B") — say what that change accomplishes.
- No preamble ("This PR adds...", "This change implements...") — start at the content.
- Weak: "Updated the form component and added some validation."
- Strong: "Validation now blocks submit until every required field has content, instead
  of surfacing the error only after a failed save."
