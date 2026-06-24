# Triage Labels

The five canonical triage states are represented as GitHub labels:

| Label | Meaning |
|-------|---------|
| `needs-triage` | Maintainer needs to evaluate this issue or PR |
| `needs-info` | Waiting on the reporter for more information |
| `ready-for-agent` | Fully specified; an agent can pick it up with no human context |
| `ready-for-human` | Ready for human implementation or review |
| `wontfix` | Will not be actioned |

These labels are applied by the `/triage` skill. If your repo uses different label names, you can override them by editing this file — but the default names above are recommended for consistency across projects using Matt Pocock's agent skills.
