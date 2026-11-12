# Bitbucket commands

Use `atlassian-cli bb`. If it isn't installed (`command -v atlassian-cli`), give the user the drafts to paste into the web UI.

## Fetch

```sh
atlassian-cli bb pr get <repo> <id>          # title, description, source, destination, reviewers
atlassian-cli bb pr comments <repo> <id>     # existing comments, with author and location
git fetch origin <source-branch>
MB=$(git merge-base origin/<destination> origin/<source-branch>)
git log --oneline $MB..origin/<source-branch>
git diff --stat $MB origin/<source-branch>
git show origin/<source-branch>:<path>       # read a file on the PR side without checking it out
```

The comments output is a wide table and can be large. If the tool saves it to a file, read only the author and content columns. Bot comments end with a `<!-- cra:... -->` marker.

## Post

Write each comment body to its own file in a new temp dir using a quoted heredoc (`<<'EOF'`), so backticks and `$` stay literal. Then:

```sh
atlassian-cli bb pr comment <repo> <id> -f quiet --text "$(cat 1.md)" --path <path> --line <n>   # inline
atlassian-cli bb pr comment <repo> <id> -f quiet --text "$(cat 9.md)"                            # top-level
atlassian-cli bb pr comment <repo> <id> -f quiet --text "$(cat 3.md)" --parent <comment-id>      # reply in a thread
```

`--line` is a line in the PR's version of the file (`--side new`, the default). An inline comment can only go on a file the PR changes.
