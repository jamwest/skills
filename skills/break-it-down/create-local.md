# Creating subtasks: Local Markdown

Read this only when Step 1 resolved the tracker as `local`.

1. Before the first write, check the repo's `.gitignore` for a `.claude/scratch/` entry —
   if it's missing, add it (append `.claude/scratch/` on its own line). This directory is
   skillset working state, not project documentation, and shouldn't be committed.
2. Create `.claude/scratch/<slug>/issues/` where `<slug>` is the blueprint filename without
   `.md`.
3. Write one file per non-blocked subtask: `<NN>-<kebab-title>.md`. Content: H1 title,
   description body, `Status: todo` line.
4. Print each file path created.
