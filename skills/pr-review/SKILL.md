---
name: pr-review
description: Review someone else's open pull request on the code host. Treat the user's stated concerns as claims to check against the code. Check reuse of shared packages, naming against the domain glossary, and duplication the PR puts off. Give make it work / make it right / make it fast verdicts. Draft Conventional Comments anchored to file and line, then post them only after the user approves. Use when the user says "review PR 123", "do a review on this PR", or names a PR with concerns to check. Not for your own branch before you push — that is /review.
subagent-role: reviewer
argument-hint: "PR id or URL, then optional concerns as free text (e.g. '660 naming of form-cards; raw html vs @hcp/ui')"
---

# PR Review

Review a teammate's open PR the way a senior reviewer would. Start from the user's concerns, check each one against the code, add the checks below, and give a verdict in three phases: make it work, make it right, make it fast. Then draft comments for the host. Nothing is posted until the user approves.

Work alone in one context. Don't spawn subagents. The value comes from holding the user's concerns and the code together.

## Process

### 1. Fetch the PR

Read `docs/agents/code-host.md`. If the host is not Bitbucket, stop and tell the user that only Bitbucket is supported. Otherwise follow [host-bitbucket.md](./host-bitbucket.md) to get:

- the PR title, description, author, source and destination branches
- the existing comments (bot and human)
- the source branch, fetched locally, and the diff against the merge-base with the destination

Read the PR description closely. Note anything the author says they put off on purpose ("left alone to keep this PR additive", "worth extracting later"). Step 3 checks those.

### 2. Check the user's concerns

Split the free-text concerns into separate claims. For each one, find the evidence in the diff and the code around it, then mark it **confirmed**, **partly confirmed**, or **refuted**, with file:line. A concern can be refuted. Say so plainly when it is. Don't stretch weak evidence to agree with the user.

### 3. Run the standard checks

Run all of these, even when the user gave concerns:

- **Shared-package reuse.** For each new component, helper or style block, look in the repo's shared packages (the ones AGENTS.md lists) for an existing equivalent. If you find one, read its props or API before claiming it fits. Some shared components look similar but are tied to context the PR doesn't have, such as a form library. A raw element that copies the existing pattern next to it is consistent. Flag the shared pattern as a candidate to move into the package, not as a defect in this PR.
- **Naming.** Compare new names with `CONTEXT.md`: the terms it defines and its _Avoid_ lists, including entries the PR itself adds. Grep for names that already exist elsewhere in the repo (types, components, folders) that a new name would shadow or make ambiguous.
- **Deferred duplication.** For each refactor the PR description puts off, check whether the two copies are already in the diff. If they are, ask for the extraction now, as its own commit before the feature commit.
- **Smell baseline.** Apply the smells in step 3 of [/review](../review/SKILL.md), with its rules: the repo's own standards override, and each smell is a judgement call.
- **Repo standards.** Apply `CONTRIBUTING.md`'s coding standards and the memory or steering rules that cover this area (coverage allowlists, comment policy, package boundaries).
- **Existing comments.** Don't repeat a point a bot or reviewer already made. If you have something to add, reply in their thread. If a commit seems to fix an existing comment, say whether you checked it.

### 4. Summarise

Reply in this shape:

- A short opening line on whether the user's concerns hold, then one paragraph on what the PR does and what it doesn't wire up yet.
- One subsection per concern: the verdict, then the evidence. Use a table when you compare "PR does" with "should use".
- **Make it work:** ✅, ⚠️ or ❌. Is the logic correct and tested? Is it reachable yet? Which external sign-offs are still open?
- **Make it right:** ✅ or ❌. A numbered list of design problems, worst first.
- **Make it fast:** n/a unless there is a stated performance requirement or an obvious hotspot. One line either way.
- **Verdict:** approve, approve with comments, or request changes, and the points it depends on.

### 5. Draft the comments

Write the drafts straight after the summary. Don't ask first. Follow [comment-format.md](./comment-format.md). Number each draft and give its anchor (path:line on the PR's source side). Put the top-level summary comment last. Start with a line naming the audience, e.g. "Written for: <author> and the other reviewers."

Then stop and wait. The user may approve, edit, drop or relabel comments.

### 6. Post

Only after the user approves, post each comment with the command in [host-bitbucket.md](./host-bitbucket.md), using the wording the user approved. Report a table: number, anchor, label, and whether it posted. Show any failure in full. Don't set the PR's review status (approve / request changes) unless the user asks.
