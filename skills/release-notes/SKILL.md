---
name: release-notes
description: Generate high-level, Slack-postable release notes summarizing the changes between two branches (typically development -> main) for a non-technical audience (CEO, demoers). Use when the user asks for release notes, a "what's new" summary, or wants to announce a deploy in Slack.
subagent-role: scout
argument-hint: "optional branch range and/or release status override (e.g. 'staging..main', 'status: Live')"
---

# Release Notes

This skill produces a short, copy-pasteable Slack message summarizing a release. The audience is the CEO and people demoing the product — not engineers. Every bullet should read as a user-facing outcome, not an implementation detail.

## Process

1. Determine the commit range. Default to `origin/main..origin/development` after `git fetch origin main development --quiet`. If the user names different branches/refs, use those instead.

2. Pull the full commit list to understand what shipped:
   - `git log <range> --oneline --no-merges` for the raw commits
   - `git log <range> --oneline` (merges included) to recover PR titles, which often group related work better than individual commits

3. Filter ruthlessly. Drop anything that isn't user-visible: test-only commits, eval/harness commits, CI/pipeline commits, dependency bumps, typo fixes in non-user-facing data, refactors. If there's anything worth keeping from that pile, fold it into one or two bullets under a single "Behind the scenes" section — never one bullet per internal commit.

4. Group the remaining commits by user-facing feature area, not by ticket, folder, or repo package. Categories are dynamic per release — infer them from what actually changed. Past categories used: AI Health Coach, Check-ins & Notifications, Data Security, Portal, Sign-in, Mobile, Branding, Behind the scenes. Don't force a fixed list — add or drop categories to fit the batch, and skip any category with nothing in it.

5. Write each bullet at CEO/demoer altitude:
   - Describe the outcome or user impact, not the mechanism
   - No ticket numbers (GROOV-xxxx), PR numbers, file paths, or internal system/vendor names (e.g. say "sign-in" not "WorkOS callback"; say "faster page loads" not "turbo cache fix")
   - One line per change; combine tightly related fixes into a single bullet rather than listing each separately

6. Never invent a deploy timing/availability line. If the user hasn't told you where/when this ships, omit that line rather than guessing or copying a prior release's wording.

## Output format

Plain text, ready to paste directly into Slack (`mrkdwn` formatting — single asterisks for bold, `•` for bullets, category names as bold headers with no `#`).

```
:rocket: *Release Notes — <Month D, YYYY>*
_*Status:* Deploying_ :hourglass_flowing_sand:

*<Category>*
• <bullet>
• <bullet>

*<Category>*
• <bullet>
```

- Keep the rocket + title as line 1, the status line directly under it as line 2, then a blank line before the first category.
- If the user gives a different status (e.g. "Live", "Deploying to Demo only"), use their wording instead of "Deploying" — but keep the `_*Status:* ..._` styling and trailing emoji.
- Only add a closing availability line ("This will be available in ... by end of day") if the user has told you the actual timing/environment for this release.

## Example output

```
:rocket: *Release Notes — July 23, 2026*
_*Status:* Deploying_ :hourglass_flowing_sand:

*Branding*
• Portal, landing page, and app header rebranded to Groov Health with new logo/lockup

*AI Health Coach*
• Fixed a bug where the coach could announce an action and then go silent instead of following through
• Refreshed the welcome and footer copy, tightened up the chat input layout

*Portal & Mobile*
• Fixed keyboard and scrolling issues on iOS (chat, PROMs, sign-in)
• Hid the WorkOS security widget from the preferences page for a cleaner settings screen

*Sign-in*
• Callback failures now show a friendly error page instead of a raw error
• Fixed a stale-session edge case when linking a guest account to WorkOS

*Behind the scenes*
• Fixed a consent seed data typo
• Faster CI builds
```
