# Git hooks

## commit-msg

Removes `Co-authored-by: Cursor <cursoragent@cursor.com>` from every commit message so **cursoragent** does not appear as a repository contributor on GitHub.

### Enable (one time per clone)

```bash
git config core.hooksPath .githooks
```

On Windows (Git Bash or PowerShell from the repo root):

```powershell
git config core.hooksPath .githooks
```

Hooks in `.githooks/` are not active until you run the command above.
