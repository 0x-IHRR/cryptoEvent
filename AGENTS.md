# Repository Guidelines

## Project Structure & Module Organization

This repository is a React 19, Vite, TypeScript, and Express application for tracking exchange campaigns.

- `src/components/`: reusable UI and feature views; use PascalCase filenames such as `ActivityRow.tsx`.
- `src/hooks/`: client state and data-loading hooks.
- `src/services/`: aggregation, exchange access, AI analysis, and URL validation.
- `src/types/` and `src/utils/`: shared models and deterministic business rules.
- `data/manual-activities.json`: manually verified fallback records.
- `tests/`: Node.js integration-style tests. A colocated unit suite also exists at `src/utils/activity.test.ts`.
- `server.ts`: Express API and Vite development server entry point.

Keep exchange-specific network behavior in `src/services/`; keep components focused on rendering and interaction.

## Build, Test, and Development Commands

Run commands from the repository root:

```bash
npm install       # install pinned dependencies
npm run dev       # start Express and Vite on port 3000
npm run lint      # run TypeScript type checking with no output
npm run build     # create the production Vite bundle in dist/
npm run preview   # preview the Vite bundle
npm run clean     # remove generated dist/ and server.js
```

The imported project currently has no `npm test` script. Test files use `node:test`, but some `.mjs` suites reference generated `.js` modules that are not produced by the current build. Wire a reliable test command before claiming automated test success.

## Coding Style & Naming Conventions

Use two-space indentation, single quotes, semicolons, and ES modules. Name React components and types in PascalCase, hooks with a `use` prefix, and functions/variables in camelCase. Prefer explicit domain types from `src/types/activity.ts`. Preserve the existing `.js` import suffix convention used by TypeScript’s bundler resolution.

## Testing Guidelines

Use Node.js `node:test` with `node:assert/strict`. Name tests `*.test.ts` or `*.test.mjs`. Cover date boundaries, URL allowlists, deduplication, manual overrides, and failure isolation. Network-dependent behavior must use fixtures or mocks; tests must not require live exchange availability.

## Commit & Pull Request Guidelines

No Git history was included with this import. Use Conventional Commit subjects, for example `fix: enforce refresh authorization`. Pull requests must describe behavior changes, list verification commands, and call out API, data, or security risks. Include before/after screenshots for visible UI changes and never commit `.env.local`, API keys, cookies, or generated build output.
