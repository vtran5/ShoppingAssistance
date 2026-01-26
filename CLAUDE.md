# CLAUDE.md - Agent Guidelines for ShoppingAssistance

This document provides guidelines for AI agents working on this codebase.

## Quick Reference

| For... | Refer to |
|--------|----------|
| Implementation steps, tech stack, project structure | [PLAN.md](./PLAN.md) |
| Functional requirements, acceptance criteria, API specs | [docs/REQUIREMENTS.md](./docs/REQUIREMENTS.md) |
| System design, data models, code patterns | [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) |
| Technical decisions & bugs | [./memory/](./memory/) folder |

**Always read the relevant document before starting a task.**

---

## Agent Workflow

### Before Writing Code

1. **Read the relevant docs** - Understand what you're building and why
2. **Check ./memory/** - Look for existing decisions or known issues related to your task
3. **Read existing code** - Never modify code you haven't read first
4. **Understand patterns** - Follow established conventions in the codebase

### During Implementation

1. **Follow the PLAN.md phases** - Implement in the order specified
2. **Verify against REQUIREMENTS.md** - Use acceptance criteria as your checklist
3. **Match ARCHITECTURE.md patterns** - Use the data models and code patterns specified
4. **Document as you go** - Update ./memory/ with decisions and issues

### After Implementation

1. **Verify acceptance criteria** - Check off items in REQUIREMENTS.md
2. **Test your changes** - Run relevant tests
3. **Update documentation** - If your changes affect docs, update them

---

## Coding Conventions

### TypeScript

```typescript
// Use explicit types from src/types/index.ts - don't create duplicate interfaces
import { WishlistItem, Currency, UserSettings } from '@/types';

// Prefer explicit return types on functions
function getItem(id: string): WishlistItem | null { }

// Use null for optional fields (not undefined) - matches Google Sheets storage
interface Item {
  url: string | null;        // Good
  url?: string;              // Avoid
}
```

### React Components

```typescript
// File naming: PascalCase for components
// src/components/ui/Button.tsx
// src/components/wishlist/WishlistItem.tsx

// Props interface naming: ComponentNameProps
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

// Export as named export (not default)
export function Button({ variant = 'primary', onClick, children }: ButtonProps) {
  // ...
}
```

### API Routes

```typescript
// File: src/app/api/items/route.ts

// Always return consistent response shapes
// Success: { data: T } or { items: T[], count: number }
// Error: { error: string }

export async function GET() {
  try {
    const items = await getAllItems();
    return Response.json({ items, count: items.length });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

// Validate request bodies
export async function POST(request: Request) {
  const body = await request.json();

  if (!body.name || !body.currentPrice) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }
  // ...
}
```

### Error Handling

```typescript
// Validate at API boundaries, trust internal code
// Show user-friendly errors, log technical details

// API route
try {
  // operation
} catch (error) {
  console.error('Technical details:', error);
  return Response.json({ error: 'User-friendly message' }, { status: 500 });
}

// Client component
if (error) {
  return <div className="text-red-500">Failed to load items. Please try again.</div>;
}
```

### Styling (Tailwind)

```typescript
// Mobile-first: base styles for mobile, md: for larger
<div className="p-4 md:p-6">

// Touch targets: minimum 44x44px for buttons
<button className="min-h-[44px] min-w-[44px] p-3">

// Consistent spacing scale: 2, 4, 6, 8 (avoid arbitrary values)
<div className="space-y-4">  // Good
<div className="space-y-[13px]">  // Avoid
```

### File Organization

```
src/
├── app/                    # Next.js routes only
├── components/
│   ├── ui/                 # Generic reusable (Button, Modal, Input)
│   ├── wishlist/           # Feature-specific components
│   ├── budget/
│   └── layout/             # Header, BottomNav
├── lib/                    # Business logic, external integrations
├── hooks/                  # Custom React hooks
└── types/                  # TypeScript interfaces (single source of truth)
```

---

## Documentation Maintenance

### When to Update Docs

| Situation | Action |
|-----------|--------|
| Implementing a planned feature | Check off verification items in PLAN.md |
| Requirement changes | Update REQUIREMENTS.md acceptance criteria |
| Adding new API endpoint | Update API specs in REQUIREMENTS.md |
| Architecture decision | Add to ./memory/decisions/ |
| Finding a bug | Log in ./memory/bugs/ |
| New pattern established | Consider adding to ARCHITECTURE.md |

### How to Update

1. **PLAN.md** - Mark completed steps with [x], add notes if deviating
2. **REQUIREMENTS.md** - Update acceptance criteria, add new requirements with IDs
3. **ARCHITECTURE.md** - Update diagrams, add new patterns, keep code samples current

---

## Memory Folder

The `./memory/` folder stores technical decisions and bugs discovered during implementation.

### Structure

```
memory/
├── decisions/
│   ├── 001-auth-approach.md
│   ├── 002-image-storage.md
│   └── ...
└── bugs/
    ├── 001-sheets-rate-limit.md
    ├── 002-image-cors.md
    └── ...
```

### Decision Template

```markdown
# Decision: [Short Title]

**Date:** YYYY-MM-DD
**Status:** Accepted | Superseded | Deprecated

## Context
What problem are we solving? What constraints exist?

## Options Considered
1. **Option A** - Pros/cons
2. **Option B** - Pros/cons

## Decision
What we decided and why.

## Consequences
What changes as a result of this decision?
```

### Bug Template

```markdown
# Bug: [Short Title]

**Date:** YYYY-MM-DD
**Status:** Open | Investigating | Fixed | Won't Fix
**Related Files:** `src/lib/sheets.ts`, `src/app/api/items/route.ts`

## Description
What's happening?

## Steps to Reproduce
1. Step one
2. Step two

## Expected Behavior
What should happen?

## Actual Behavior
What's actually happening?

## Root Cause
(Fill in when identified)

## Solution
(Fill in when fixed)
```

### When to Document

**Always document in ./memory/ when:**
- Making a non-obvious technical choice
- Choosing between multiple valid approaches
- Discovering unexpected behavior
- Finding workarounds for limitations
- Encountering bugs (even if fixed immediately)

**Do NOT document:**
- Standard implementation following docs
- Obvious choices (e.g., using TypeScript types)
- Minor refactors

---

## Common Tasks Reference

### Adding a New Feature

1. Check PLAN.md for the implementation step
2. Check REQUIREMENTS.md for acceptance criteria
3. Follow patterns in ARCHITECTURE.md
4. Implement the feature
5. Verify against acceptance criteria
6. Update ./memory/ if any decisions were made

### Fixing a Bug

1. Log the bug in ./memory/bugs/
2. Investigate and document root cause
3. Implement fix
4. Update bug status to Fixed
5. Add regression test if appropriate

### Adding an API Endpoint

1. Define request/response types in src/types/index.ts
2. Implement route in src/app/api/
3. Update REQUIREMENTS.md API table
4. Test all status codes (200, 400, 404, 500)

---

## Reminders

- **Read before writing** - Always read existing code before modifying
- **Minimal changes** - Only change what's necessary for the task
- **No over-engineering** - Follow YAGNI (You Ain't Gonna Need It)
- **Trust the docs** - PLAN.md has the implementation order for a reason
- **Document decisions** - Future agents (and humans) will thank you
- **Test your work** - Verify against acceptance criteria before marking complete
