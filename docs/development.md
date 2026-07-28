# Development

## Prerequisites

- Node.js 22 or later
- npm 10 or later

## Current command

```bash
npm run check
```

The current command verifies the repository baseline only. Before introducing a module, extension, generator or HIA-uView dependency, define the contract, source/license evidence, integration approach and validation scope.

## Integration boundary

HIA-uView is a separate repository. Use it only through published versions, a documented local link, an integration fixture or a dedicated script. Do not create a shared root lockfile or import files across repository roots.
