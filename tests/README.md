# Testing Instructions

## Commands

```bash
# Run all tests
pnpm test:run

# Run specific categories
pnpm test:unit        # Unit tests (utilities)
pnpm test:hooks       # Hook tests
pnpm test:components  # Component tests

# Watch mode (re-runs on file changes)
pnpm test

# Single test file
pnpm vitest run tests/unit/typography.test.ts

# Coverage report
pnpm test:coverage
```

## Safety Notes

- **All API calls are mocked** via MSW - no real requests to PocketBase
- Tests are safe to run repeatedly without spamming endpoints
- jsdom environment simulates browser (no real DOM)

## Structure

```
tests/
├── unit/           # Pure function tests (fastest)
├── hooks/          # React hook tests
├── components/     # UI component tests
└── mocks/          # MSW API handlers
```

## Tips

- Run `pnpm test` during development for instant feedback
- Use `.only` to run single test: `it.only('test name', () => {})`
- Use `.skip` to skip test: `it.skip('test name', () => {})`
