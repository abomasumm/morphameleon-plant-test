# Migration plan
<!-- Written by .agents/migrate.sh init on 2026-11-03 06:39:22. Edit freely: the planner and every worker read this file. -->

## Migration
- From: JavaScript (ES modules)
- To: TypeScript, strict mode, plain DOM instead of jQuery

## Scope
In scope:
- src/
Never touch:
- existing tests
- package.json and lockfile
- build and tool config

## Behaviour that must not change
- money(12.3) returns "$12.30", money(12.345) returns "$12.35", and money(0) returns "$0.00"
- plural(1, "plant") returns "1 plant", while plural(0, "plant") and plural(2, "plant") return "0 plants" and "2 plants"
- createCart().add returns true and adds a line with qty 1 for an in-stock plant, but returns false and leaves lines unchanged when stock is 0 or the requested line has reached plant.stock
- byLight(PLANTS, "all") returns a copy containing every plant, while byLight(PLANTS, "low") returns only plants whose light equals "low"
- plantCard returns a jQuery article.card with data-id set to plant.id and its Add button disabled when stock is below 1 or inCart is at least stock
- mount(root) renders the catalog and returns the same cart used by the rendered controls, so adding through the UI updates cart.count and triggers cart.onChange

## Rules
- New dependencies allowed: no
- Public API changes allowed: no
- Tests: existing tests are never edited. Untested modules get characterization tests first (pin tasks).
- One module per migrate task, in the dependency order below.

## Approach
- Convert framework-independent src/format.js, src/catalog.js, and src/cart.js first, preserving the exported money, plural, PLANTS, byLight, and createCart APIs
- Define explicit types for catalog plants and cart lines without changing the mutable cart.lines shape or the createCart return-object contract
- Convert src/view.js with jQuery type declarations, preserving plantCard and cartPanel as functions that return jQuery elements with the same classes, text, attributes, and disabled states
- Convert src/app.js and src/main.js together so mount still accepts a DOM element, wires delegated click handlers, returns the live cart, and keeps the existing import boundary
- Run the existing Vitest suite after each stage and add focused regression tests for cart mutation, notification timing, filtering, DOM rendering, and mount integration
- Update ES module import specifiers and compiler settings only as required by the existing build tool, keeping the public JavaScript exports and runtime behavior unchanged

## Done when
- no JavaScript source files left in scope
- all tests and the typecheck pass

## Commands
- test: `npm test`
- typecheck: `npm run typecheck`
- build: `npm run build`
- Baseline on 2026-11-03: green

## Modules (dependency order: migrate from the top)
| Module | Lines | Imports | Imported by | Tests | Risk |
|---|---|---|---|---|---|
| `src/cart.js` | 40 |  | 1 | none | no tests, critical |
| `src/catalog.js` | 14 |  | 1 | none | no tests, critical |
| `src/format.js` | 9 |  | 1 | test/format.test.js | critical |
| `src/view.js` | 44 | format.js | 1 | none | no tests, critical |
| `src/app.js` | 44 | cart.js, catalog.js, view.js | 1 | none | no tests, critical |
| `src/main.js` | 2 | app.js | 0 | none | no tests |

## Existing tests (what they already cover)
- `test/format.test.js`: format; formats money with two decimals; pluralizes

## Notes from the setup model (MiniMax-M3.1-Flash)
- src/cart.js exposes mutable lines directly and uses this.subtotal, this.shipping, and this.total, so conversion must preserve the receiver-sensitive cart object contract
- The current code relies on many implicit-any callback parameters, especially in src/cart.js, src/catalog.js, src/view.js, and src/app.js
- src/main.js passes document.getElementById("app") to mount, which can be null under strict DOM typing and requires an explicit runtime check or assertion
- jQuery element chains in src/view.js depend on contextual return types and may need explicit jQuery typings or localized annotations under strict mode
- PLANTS and cart lines remain mutable exported data, so strict typing should avoid accidental deep-readonly changes that could alter consumers
- Price arithmetic includes values such as 16.5 and 29.99, so rounding behavior must remain compatible with the existing money implementation
