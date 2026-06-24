# Domain Documentation

This repository uses a **single-context** layout for domain documentation.

## Structure

- **`CONTEXT.md`** — Domain language, key concepts, and project-specific terminology. Read by skills like `improve-codebase-architecture`, `diagnosing-bugs`, and `tdd`.
- **`docs/adr/`** — Architecture Decision Records. Agent skills read these to understand past design decisions and constraints.

## Using CONTEXT.md

Write `CONTEXT.md` at the repository root with sections like:

- **Domain entities** — types, models, and key concepts
- **Core workflows** — how users interact with the system
- **Constraints** — performance, compliance, architectural requirements
- **Terminology** — domain-specific words and abbreviations

Agent skills will consult this file to make better decisions about code organization, naming, and design.

## Using docs/adr/

Create architecture decision records under `docs/adr/` using the format:

```
docs/adr/0001-choose-database.md
docs/adr/0002-api-authentication.md
```

Each ADR should follow a standard format (e.g., [MADR](https://adr.github.io/madr/)) with Context, Decision, and Consequences sections.
