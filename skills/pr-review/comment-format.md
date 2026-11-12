# Comment format

Use Conventional Comments (https://conventionalcomments.org). Each comment starts with a bold label and a decoration:

`**<label> (<decoration>):**`

- **label:** `praise`, `nitpick`, `suggestion`, `issue`, `todo`, `question`, `thought`, `chore`, `note`
- **decoration:** `blocking`, `non-blocking`, or `if-minor`. Always include one. `issue` is usually blocking. `nitpick` and `praise` are never blocking.

Examples: `**issue (blocking):**`, `**suggestion (non-blocking):**`, `**nitpick (non-blocking):**`.

## Body

1. The problem, in one or two sentences.
2. The evidence: the names that clash, the rule or glossary entry it breaks, the existing component that already does this.
3. The fix, named precisely (the component, the new name, the file to delete from). When you ask for a change, say "Please …" or "I'd like …", not a hint.

Write in plain language. The readers include people who speak English as a second language. Use short sentences, no idioms, and no sarcasm.

## Anchor

- One comment per point, on the first line of the relevant declaration.
- If the point is about a file the PR doesn't change, anchor it on the nearest changed line and name the other file in the text.
- If one point covers several files, anchor it once and list the other files.

## Summary comment

Top level, with no label:

1. What's good, in one or two sentences.
2. "Requesting changes on N things:" followed by a list of the blocking points.
3. The optional items, in one line.
4. External gates (sign-offs, flags, ADR status), if there are any.
