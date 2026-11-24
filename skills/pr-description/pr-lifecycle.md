# PR lifecycle: draft, force-push, ready

Shared by `/implement`, `/fleet-command` and `/pr-description`. Skip all of it when
`CONTRIBUTING.md` says the repo is trunk-based with no PRs: commit to the base branch instead.

## Open a draft, without asking

As soon as a subtask's checks pass (full suite, lint, typecheck, and its review round), commit,
push and open a **draft** PR with **no reviewers**. Don't ask first: a draft notifies no one, and a
pushed branch is a backup.

- Branch and PR title follow `CONTRIBUTING.md`.
- PR base: the branch the subtask depends on when that hasn't merged yet (a stack), otherwise
  `CONTRIBUTING.md`'s base branch.
- Description: from `/pr-description`, which also captures the evidence.
- Use the code host's draft option from `docs/agents/code-host.md` and
  `.claude/agent-context/code-host.local.md`. GitHub: `gh pr create --draft`. Bitbucket's
  `atlassian-cli bb pr create` has no draft flag: create it through the API instead,
  `atlassian-cli bb api /2.0/repositories/<ws>/<repo>/pullrequests -X POST -d '{"title":…,"draft":true,"source":{"branch":{"name":…}},"destination":{"branch":{"name":…}},"description":…}'`.

## Force-push while it's a draft

While the PR is a draft, force-push our own branches freely with `git push --force-with-lease`,
to keep a readable commit history (fold fix-ups into the commit they fix, restack). Never plain
`--force`. Once the PR is marked ready, ask before any force-push: reviewers may have pulled it or
commented on lines.

Never force-push a branch someone else pushed to.

## Mark ready, after asking once

A PR is ready when all of these hold:

- The pipeline is green.
- Static analysis (Sonar, when the repo has it) shows 0 new issues.
- Evidence is attached, when the change has UI (the user attaches the PDF by hand).
- The questions file (`~/runs/<repo>/<ticket>.questions.md`) has no open entries.
- Every known defect has the user's decision.

When they hold, say the PR is ready, list the checks, and ask once: _"Mark PR <id> ready and add
reviewers?"_ On yes, flip it and add the reviewers named in `docs/agents/code-host.md` (else the
repo's default reviewers). GitHub: `gh pr ready <id>` then `gh pr edit <id> --add-reviewer ...`.
Bitbucket: `atlassian-cli bb api -X put -d '{"draft":false}' /2.0/repositories/<ws>/<repo>/pullrequests/<id>`
then `atlassian-cli bb pr update <repo> <id> --reviewers <uuid>,...`.

If a check fails, say which, and don't ask.
