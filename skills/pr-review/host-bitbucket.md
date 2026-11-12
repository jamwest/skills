# Bitbucket commands

Use `atlassian-cli bb`. If it isn't installed (`command -v atlassian-cli`), give the user the drafts to paste into the web UI.

## Fetch

Use `-f json`. The default table output wraps and truncates a long description.

```sh
atlassian-cli bb pr get <repo> <id> -f json \
  | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["title"], d["author"], d["source"], d["destination"], sep="\n"); print(d["description"])'
atlassian-cli bb pr comments <repo> <id> -f json \
  | python3 -c 'import json,sys
for c in json.load(sys.stdin): print("---", c["id"], c["author"], c["location"], "parent", c["parent"]); print(c["content"])'

B=origin/<source-branch>
git fetch origin <source-branch>
MB=$(git merge-base origin/<destination> "${B}")
git log --oneline $MB.."${B}"
git diff --stat $MB "${B}"
git show "${B}:<path>"                       # read a file on the PR side without checking it out
```

Always write `"${B}:<path>"` with braces. In zsh, `$B:e` is a modifier (the extension of `$B`), so `"$B:evals/x.ts"` becomes a broken path. Also don't start a word with `=` (for example `echo ===`): zsh expands `=word` to a command path and fails.

Bot comments end with a `<!-- cra:... -->` marker. `location` is `path:line` for an inline comment and `null` for a top-level one.

## Post

Write each comment body to its own file in a new temp dir using a quoted heredoc (`<<'EOF'`), so backticks and `$` stay literal. Then:

```sh
atlassian-cli bb pr comment <repo> <id> -f quiet --text "$(cat 1.md)" --path <path> --line <n>   # inline
atlassian-cli bb pr comment <repo> <id> -f quiet --text "$(cat 9.md)"                            # top-level
atlassian-cli bb pr comment <repo> <id> -f quiet --text "$(cat 3.md)" --parent <comment-id>      # reply in a thread
```

`--line` is a line in the PR's version of the file (`--side new`, the default). An inline comment can only go on a file the PR changes.

## Review status

Set only the status the user chose in step 6:

```sh
atlassian-cli bb pr approve <repo> <id>
atlassian-cli bb pr unapprove <repo> <id>
atlassian-cli bb api -X post /2.0/repositories/<workspace>/<repo>/pullrequests/<id>/request-changes     # no typed command for this
atlassian-cli bb api -X delete /2.0/repositories/<workspace>/<repo>/pullrequests/<id>/request-changes   # undo it
```
