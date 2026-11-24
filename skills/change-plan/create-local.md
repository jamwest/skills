# Creating subtasks: Local Markdown

Read this only when the tracker is `local`.

1. Before the first write, check the repo's `.gitignore` for a `.claude/scratch/` entry. If it's
   missing, add `.claude/scratch/` on its own line. This is working state, not project docs.
2. Create `.claude/scratch/<ticket>/issues/`, where `<ticket>` is the plan's ticket slug.
3. Write one file per subtask from the approved split, in split order (seams first):
   `<NN>-<kebab-title>.md`. Content: H1 title, a `Status: todo` line, one
   `Blocked by: <NN>-<kebab-title>.md` line per entry in the split's "Depends on" column, then
   what and why. No file lists.
4. Print each file path created.
