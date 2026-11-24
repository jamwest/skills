# Change checklist

One list, read by two skills at two times:

- **`/change-plan`** answers each item per subtask, before code exists: one line, or "doesn't
  apply". An item it can't answer becomes a product call (questions file) or a task in a subtask.
- **`/review`**'s Behaviour axis checks the code against each item, and against the plan's answer
  when there is one.

Each item has a **Plan** line (the question to answer before code) and a **Review** line (what to
check in the diff). Review findings cite file:line and give a concrete scenario ("two submits from
one account: …").

When a review finding traces to an item here that the plan answered wrongly or skipped, the fix is
usually a sharper Plan line in this file. When it traces to nothing here, it may need a new item.

## (a) Paths

- **Plan:** list every entry point the subtask adds or changes, and every sibling path that does
  the same kind of thing: every sender, every close, cancel or withdraw path, every scheduler or
  cadence that acts on the same data. Does each sibling get the change, or why not?
- **Review:** for each entry point the diff adds or changes (server function, route handler,
  exported function), list its outcome branches (e.g. created, linked, restored, refused). Flag any
  branch that skips a step its sibling branches do: saving an answer, crediting, writing the
  session, recording an audit.

## (b) Repeats and partial failure

- **Plan:** for each sequence of writes or external calls, what happens if the same request runs
  twice at once, or fails between steps? Which writes share a transaction?
- **Review:** for each sequence of writes or external calls, ask the same. Flag any state left
  half-written, duplicated or orphaned, and any two writes in separate transactions that must
  succeed or fail together.

## (c) Failure the user sees

- **Plan:** for each new failure, what does the user see, and can they do anything about it?
- **Review:** for each failure return or caught error, trace it to what the user is shown. Flag a
  message that blames the wrong thing, a failure swallowed with nothing shown, and a retry that
  cannot succeed.

## (d) States the change reads

- **Plan:** for each stored state or enum value the subtask shows, counts or branches on, which
  code writes it (including other apps)? Does a writer really leave it in place in the situation
  the screen says it stands for?
- **Review:** for each stored state or enum value the diff displays, counts or branches on, find
  every place that writes it, including code outside the diff and in other apps (grep the column or
  value). For the situation the UI or docs say the value stands for, confirm a writer actually
  leaves it in place, including after a rollback or a failure part-way. Flag a value that no path
  can produce in that situation, citing the writer's file:line.

## (e) Who can reach it

- **Plan:** for each new or moved write, which identities can reach it before and after? Is any
  identity new?
- **Review:** for each write the diff adds, or moves to a different auth guard or helper, read that
  guard's body even when the diff doesn't touch it. List which identities could reach the write
  before the change and which can after. Flag any identity that is new. Then ask:
  - Can the identity change between the page loading and the write? Cookies and local storage are
    shared by every tab, so another tab can sign in or start a session.
  - Does an optional auth or ownership parameter skip its check when it is left out? A check that
    passes when the parameter is missing fails open.

  Flag a write that stores data against a different user than the one who loaded the page.

## (f) Pages open across a deploy

- **Plan:** does any server function, endpoint or message keep its name but change its input or
  result shape? What does a page built before the deploy do with it?
- **Review:** for each server function, endpoint or message whose input or result shape the diff
  changes but whose name or id stays the same, ask: what happens to a page or client built before
  the deploy? Flag a client that would crash on the new result shape. Also flag an input field
  whose meaning changes, because an old server drops fields it does not know and still reports
  success.

## (g) Widened sets

- **Plan:** does the subtask extend a rule from one member to a set (every form, role, tenant)?
  List the members.
- **Review:** when the diff extends a rule from one member to a whole set, check every member of
  the set, not just the one the tests use. Also check that a member outside the set is still
  refused.

## (h) Go back and change

- **Plan:** does an answer show or hide another field, card or control? What happens to the hidden
  one's saved value?
- **Review:** for each field, card or control that a different answer shows or hides, walk through
  this: answer it, go back, change the answer that controls it so it is hidden, then come forward
  again. Flag any saved value or setting from the hidden control that still has an effect: it
  disables something, gets submitted, or fails validation.

## (i) Keys and conflicts

- **Plan:** for each migration and each insert or upsert, which unique keys apply after the
  migration, and can the new code legitimately write two rows that share one?
- **Review:** for each migration and each insert or upsert the diff adds or changes, list the
  unique keys on that table after the migration, and what each conflict clause targets ('on
  conflict do nothing' with no target matches every unique key). Then try rows the new code
  legitimately writes twice under a kept old key: two items sharing a date or offset, a value
  edited onto another's, a new version or run returning to an earlier one's value. Flag any second
  row a kept key silently drops, any conflict target with no exactly matching unique index (a
  partial index needs the same WHERE clause), and any rows older code still writes during a deploy
  that lose their protection or start failing.

## (j) Rollback

- **Plan:** if this deploys, writes data, then rolls back, what does the old code do with the new
  data (new enum values, new columns, new JSON shapes, new rows)?
- **Review:** for each new stored value or shape, find the old code that reads that table or field.
  Flag old code that would crash, drop the data, or act on it wrongly after a rollback.

## (k) Audit

- **Plan:** for each write, who is recorded as doing it (actor id and accessor type), on every
  path, including system jobs and staff acting for someone else?
- **Review:** for each write the diff adds or changes, check what the audit or history row records
  as the actor. Flag a missing audit row on one path but not its siblings, and a row that records
  the wrong actor or accessor type.

## (l) Every caller and screen

- **Plan:** list every caller of the changed function and every screen, email and SMS that shows
  the changed thing. Is each one still right (labels, wording, timing, one-time versus ongoing)?
- **Review:** grep every caller of each changed function and every place that shows the changed
  value. Flag a caller or screen that now shows the wrong thing or still follows the old rule.
