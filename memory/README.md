# Memory Folder

This folder stores technical decisions and bugs discovered during implementation.

## Structure

```
memory/
├── decisions/    # Technical decisions and rationale
├── bugs/         # Bug reports and investigations
└── README.md     # This file
```

## Naming Convention

Files are numbered sequentially:
- `decisions/001-topic.md`
- `decisions/002-topic.md`
- `bugs/001-issue.md`

## Templates

See [CLAUDE.md](../CLAUDE.md) for decision and bug templates.

## Guidelines

**Document when:**
- Making non-obvious technical choices
- Choosing between multiple valid approaches
- Finding workarounds for limitations
- Encountering bugs (even if fixed immediately)

**Skip documenting:**
- Standard implementation following existing docs
- Obvious choices
- Minor refactors
