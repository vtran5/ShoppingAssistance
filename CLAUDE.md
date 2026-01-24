# CLAUDE.md - AI Assistant Guide for ShoppingAssistance

This document provides guidance for AI assistants working on the ShoppingAssistance codebase.

## Project Overview

**ShoppingAssistance** is a shopping assistance application designed to help users with their shopping needs. This is a new project under active development.

### Repository Status
- **Current State**: Initial setup (empty repository)
- **Primary Branch**: `main` (to be created)
- **Development Branches**: Feature branches prefixed with `claude/` for AI-assisted development

## Project Structure

```
ShoppingAssistance/
├── CLAUDE.md           # This file - AI assistant guidelines
├── README.md           # Project documentation (to be created)
├── src/                # Source code (to be created)
├── tests/              # Test files (to be created)
├── docs/               # Documentation (to be created)
└── package.json        # Project configuration (to be created)
```

## Development Workflows

### Getting Started
1. Clone the repository
2. Install dependencies (once package.json is created)
3. Follow the coding conventions below

### Branch Naming Convention
- **Feature branches**: `feature/<description>`
- **Bug fixes**: `fix/<description>`
- **AI-assisted development**: `claude/<session-id>`

### Commit Message Format
Use clear, descriptive commit messages following conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Formatting, missing semicolons, etc.
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example: `feat: add product search functionality`

## Coding Conventions

### General Guidelines
1. **Keep it simple** - Avoid over-engineering; implement only what's needed
2. **Write clean code** - Use meaningful variable and function names
3. **Document when necessary** - Add comments only where logic isn't self-evident
4. **Test your code** - Write tests for new functionality
5. **Security first** - Avoid introducing vulnerabilities (XSS, SQL injection, etc.)

### Code Style
- Use consistent indentation (2 spaces recommended)
- Use meaningful variable names
- Keep functions focused and small
- Handle errors appropriately at system boundaries

### File Organization
- Group related functionality together
- Keep files focused on a single responsibility
- Use descriptive file names that reflect content

## Testing

### Test Commands
```bash
# Run all tests (once configured)
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- <filename>
```

### Testing Guidelines
- Write unit tests for business logic
- Write integration tests for API endpoints
- Aim for meaningful test coverage
- Test edge cases and error conditions

## Build & Deployment

### Build Commands
```bash
# Install dependencies
npm install

# Development build
npm run dev

# Production build
npm run build

# Start application
npm start
```

### Environment Variables
Store sensitive configuration in environment variables:
- Never commit `.env` files or secrets
- Use `.env.example` as a template for required variables

## AI Assistant Guidelines

### When Working on This Codebase

1. **Read before modifying** - Always read existing code before making changes
2. **Understand context** - Explore related files to understand the full picture
3. **Make minimal changes** - Only modify what's necessary for the task
4. **Preserve existing patterns** - Follow established conventions in the codebase
5. **Test changes** - Run tests after making modifications

### Things to Avoid
- Don't add unnecessary abstractions or "improvements"
- Don't introduce breaking changes without discussion
- Don't commit sensitive data (API keys, credentials, etc.)
- Don't over-engineer solutions
- Don't add dependencies without justification

### Common Tasks

#### Adding a New Feature
1. Understand the existing codebase structure
2. Plan the implementation with minimal changes
3. Implement the feature following existing patterns
4. Write tests for new functionality
5. Update documentation if necessary

#### Fixing a Bug
1. Reproduce and understand the bug
2. Identify the root cause
3. Implement the minimal fix
4. Add a test to prevent regression
5. Verify the fix doesn't break other functionality

#### Refactoring Code
1. Ensure comprehensive test coverage exists
2. Make small, incremental changes
3. Run tests after each change
4. Preserve existing behavior

## Dependencies

### Core Dependencies
*(To be added as the project develops)*

### Development Dependencies
*(To be added as the project develops)*

## API Documentation

*(To be added when APIs are implemented)*

## Troubleshooting

### Common Issues
*(To be documented as issues are encountered)*

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the conventions above
3. Write/update tests as needed
4. Submit a pull request with a clear description
5. Address any review feedback

---

*Last updated: 2026-01-24*
*This document should be updated as the project evolves.*
