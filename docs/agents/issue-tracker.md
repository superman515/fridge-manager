# Issue Tracker

Issues and feature requests live in [GitHub Issues](https://docs.github.com/en/issues/tracking-your-work-with-issues).

## External PRs as a triage surface

External pull requests are treated as issues during triage. The `/triage` skill will label and process them through the standard triage workflow. This means feature requests submitted as PRs will be evaluated, labeled, and tracked alongside issues.

Collaborators' in-flight PRs (on branches with push access) are excluded from triage and left alone.

## Integration with agent skills

Agent skills that read or write issues use the GitHub CLI (`gh`). Ensure you have `gh` installed and authenticated:

```bash
gh auth login
```

Skills like `/triage`, `/to-issues`, `/to-prd`, and `/qa` will interact with this issue tracker automatically.
