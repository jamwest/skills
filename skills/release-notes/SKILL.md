---
name: release-notes
description: Generate high-level, Slack-postable release notes summarizing the changes between two branches (typically development -> main) for a non-technical audience (CEO, demoers). Splits what is live for everyone from work still behind a feature flag or not yet set up, so unreleased features still show progress. Use when the user asks for release notes, a "what's new" summary, or wants to announce a deploy in Slack.
subagent-role: scout
argument-hint: "optional branch range and/or release status override (e.g. 'staging..main', 'status: Live')"
---

# Release Notes

This skill produces a short, copy-pasteable Slack message summarizing a release. The audience is the CEO and people demoing the product — not engineers. Every bullet should read as a user-facing outcome, not an implementation detail.

## Process

1. Determine the commit range. Default to `origin/main..origin/development` after `git fetch origin main development --quiet`. If the user names a merged release PR, use that merge commit's range (`<merge>^1..<merge>^2`). If the user names different branches/refs, use those instead.

2. Pull the full commit list to understand what shipped:
   - `git log <range> --oneline --no-merges` for the raw commits
   - `git log <range> --oneline --first-parent` to recover PR titles, which often group related work better than individual commits

3. Filter ruthlessly. Drop anything that isn't user-visible: test-only commits, eval/harness commits, CI/pipeline commits, dependency bumps, typo fixes in non-user-facing data, refactors. If there's anything worth keeping from that pile, fold it into one or two bullets under a single "Behind the scenes" section — never one bullet per internal commit.

4. Work out whether each remaining change is live for everyone or held back.
   - **Behind a flag:** find the repo's feature flag registry (grep for the flag slugs, e.g. a `FLAGS` constant) and check, from the PR's diff, which flag gates the change. A change can sit behind a flag without naming it: a fix inside a flagged feature (e.g. a v2-only module) is gated by that feature's flag. Note flag dependencies (one flag only works when another is on).
   - **Not set up yet:** some work has no flag but is still not live, for example a questionnaire or tenant not yet configured in production. You can't see this from the code. Ask the user, or take it from what they told you.
   - **Live for everyone:** everything else.
   Don't guess which flags are on in which environment. If the user gives you that, add it next to the flag header; otherwise leave it off.

5. Group the bullets:
   - Under **Live for everyone**, group by user-facing area (Patient app, Portal, AI Health Coach, Sign-in, Mobile, Branding, ...). Categories are dynamic per release — skip any with nothing in it.
   - Under **In progress, behind feature flags**, make one group per feature, named in plain words, followed by its flag slug(s) in backticks. A held-back item with no flag gets its own group with an italic note instead of a slug (e.g. `_not set up in production yet_`).
   - **Behind the scenes** goes last.
   Leave out a top-level section that would be empty. If nothing is flagged, drop the two top-level headers and just list the categories.

6. Write each bullet at CEO/demoer altitude:
   - Describe the outcome or user impact, not the mechanism
   - No ticket numbers (GROOV-xxxx), PR numbers, file paths, or internal system/vendor names (e.g. say "sign-in" not "WorkOS callback"; say "faster page loads" not "turbo cache fix"). Flag slugs are the one exception, and only in the flag group headers, so demoers can ask for a flag to be turned on.
   - One line per change; combine tightly related fixes into a single bullet rather than listing each separately

7. Never invent a deploy timing/availability line. If the user hasn't told you where/when this ships, omit that line rather than guessing or copying a prior release's wording.

8. Show the draft in the text format below and stop. Wait for the user to approve or change it.

9. Once the draft is approved, offer to post it to Slack as Block Kit (see **Posting to Slack**). Never post without the user saying so. If Slack isn't set up, the approved text is the final output.

## Posting to Slack

Two scripts sit next to this file. `build-blocks.mjs` turns a notes file into the card layout, so every release looks the same. `post-slack.mjs` posts it. The bot token is in the macOS Keychain, and the channels are in `~/.config/release-notes/slack.json`:

```json
{ "keychainService": "slack-release-notes-bot", "channels": { "test": "C…", "release": "C…" } }
```

If that file or the token is missing, tell the user what's missing and give the approved text instead.

1. Write the approved draft as a notes file in a gitignored scratch folder (in a repo, `.claude/release-notes/<YYYY-MM-DD>-notes.json`):

   ```json
   {
     "date": "November 20, 2026",
     "status": "Deploying :hourglass_flowing_sand:",
     "summary": "one line for notifications and search",
     "prUrl": "https://… (optional, adds a View release PR button)",
     "live": [{ "title": "Patient app", "bullets": ["…"] }],
     "inProgress": [
       { "title": "Health plan", "flags": ["health-plan"], "bullets": ["…"] },
       { "title": "New AI Health Coach", "flags": ["web.coach-v2"], "needs": ["health-plan"], "bullets": ["…"] },
       { "title": "HEMC questionnaires", "note": "not set up in production yet", "bullets": ["…"] }
     ],
     "behindTheScenes": ["…"]
   }
   ```

   `status` defaults to Deploying. Use the user's wording when they give one.

2. Build: `node <skill-dir>/build-blocks.mjs <notes.json> <message.json>`.

3. Preview: `node <skill-dir>/post-slack.mjs --target test --file <message.json>`. Report the `ts` and ask the user to check the post in Slack. For changes, edit the notes file, rebuild, and update the preview in place with `--update <ts>`.

4. Post only after the user approves the preview: `--target release`. Report the `ts`. Later edits (e.g. status to `Live :white_check_mark:`) go through `--update <ts>` on the same message, never a new post.

## Output format

Plain text, ready to paste directly into Slack (`mrkdwn` formatting — single asterisks for bold, `•` for bullets, category names as bold headers with no `#`).

```
:rocket: *Release Notes — <Month D, YYYY>*
_*Status:* Deploying_ :hourglass_flowing_sand:

*Live for everyone*

*<Category>*
• <bullet>

*In progress, behind feature flags*
_Progress on features that are not switched on for everyone yet_

*<Feature>*  `<flag-slug>`
• <bullet>

*<Feature>*  _not set up in production yet_
• <bullet>

*Behind the scenes*
• <bullet>
```

- Keep the rocket + title as line 1, the status line directly under it as line 2, then a blank line before the first section.
- If the user gives a different status (e.g. "Live", "Deploying to Demo only"), use their wording instead of "Deploying" — but keep the `_*Status:* ..._` styling and trailing emoji.
- Only add a closing availability line ("This will be available in ... by end of day") if the user has told you the actual timing/environment for this release.

## Example output

```
:rocket: *Release Notes — November 20, 2026*
_*Status:* Deploying_ :hourglass_flowing_sand:

*Live for everyone*

*Patient app*
• Buttons, inputs and chat controls are bigger and easier to tap on phones

*Portal*
• The Search and Reset buttons on the Patients page line up with the inputs

*In progress, behind feature flags*
_Progress on features that are not switched on for everyone yet_

*HEMC questionnaires*  _not set up in production yet_
• The new patient questionnaire asks sex assigned at birth on one clear screen, with an "Another term" option

*Health plan*  `health-plan`
• The patient Overview shows the health plan instead of the old action plan card

*New AI Health Coach*  `web.coach-v2` (needs `health-plan` too)
• The coach never remembers sensitive things such as abuse, self-harm, or sexual health
• After the patient adds an action, the coach confirms it is in their health plan and moves on to the next step

*Gender*  `web.gender-capture`, `portal.patient-gender`
• Onboarding asks the patient's gender
• The portal Patient details card shows gender

*Behind the scenes*
• Visit records are tidied up and checked for missing details
```
