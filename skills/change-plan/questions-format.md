# Questions file

Questions for the user go to a file first, then to chat. Chat scrolls away; the file doesn't, and
the next agent can check it before asking again.

Path: `~/runs/<repo>/<ticket>.questions.md`, next to the run file (same `<repo>` and `<ticket>`
rules, see [run-format.md](./run-format.md)).

## Rules for every skill that asks the user something

1. **Read the file first.** If the question is already there and answered, the answer is settled:
   use it, don't ask again. If it's there and open, don't add a duplicate.
2. **Write the entry, then ask.** Add the entry below, then ask in chat, quoting the options and
   the recommendation. Name the file path.
3. **Show what each option means for a person.** Each option says what the patient or
   practitioner sees, including what stops happening. "No fallback" is not an option; "Patients
   with no slot set get no SMS at all (today they get one at 9am)" is.
4. **Read back the answer.** Each option has its own one-sentence read-back. When the user
   answers, write back the chosen option's read-back and record it. If the user's answer doesn't match any option, write a
   new read-back and confirm it before building anything.
5. **Close it.** Set status to answered, with the answer, who gave it and when. A product call's
   answer also goes into the ticket text (see the issue-tracker doc), so the ticket stays the
   source of what and why. During a ticket-size plan, `/change-plan` writes all the answers to the
   ticket at once, after the split is approved.

A PR is not marked ready while this file has an open entry.

## Format

```markdown
---
repo: groov.hcp-portal
ticket: GROOV-3347
open: 1
---

# Questions for [[GROOV-3347]]

## Q1. What happens when a patient has no slot set?

- Status: open             # open | answered
- Asked by: change-plan (ticket plan)   # or: implement GROOV-3351, fleet-command
- Asked: 2026-11-24
- Options:
  - A. Use the clinic's default slot. Patient sees: SMS at the clinic default time, as today.
    Stops happening: nothing.
  - B. No SMS until a slot is set. Patient sees: no SMS. Stops happening: the daily SMS for every
    patient who hasn't picked a slot.
- Recommendation: A. Most patients will never open settings, and B silently stops their SMS.
- Read-back:
  - A: "Patients with no slot set keep getting the SMS at the clinic's default time."
  - B: "Patients with no slot set get no SMS until they pick one."
- Answer: ~                # e.g. A — James, 2026-11-24. Read-back confirmed.
```
