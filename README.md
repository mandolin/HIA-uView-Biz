# HIA-uView-Biz

HIA-uView-Biz is a configurable, capability-composed UniApp business framework for mini-program applications. It will consume released HIA-uView packages through explicit versioned contracts and can grow independently with business modules and extensions.

## Repository layout

| Location | Purpose |
| --- | --- |
| `packages/core/` | Business-framework core package boundary |
| `modules/` | Optional, independently scoped business capability modules |
| `extensions/` | Explicit extension points and extension packages |
| `docs/` | Public development and architecture documentation |

The repository currently contains only its governance and package baseline. No runtime API, module contract, generated project template or dependency on unreleased HIA-uView packages has been declared.

## Development

Requires Node.js 22 or later and npm 10 or later.

```bash
npm run check
```

The current check validates the baseline files. See [development notes](docs/development.md) and the [architecture overview](docs/architecture.md).

## License

HIA-uView-Biz is licensed under the [MIT License](LICENSE). Future commercial modules or extensions may use their own declared licenses and notices; they must not change the license of this framework repository.
