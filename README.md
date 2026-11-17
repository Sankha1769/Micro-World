# MICROVERSE

A full-screen, interactive virtual microscope built with Three.js. It ships 53 specimens (cells, microorganisms, bacteria, viruses, fungi and more), a rotating DNA welcome screen, a size-comparison view, a journal and collapsible library / details panels.

The production build is a single self-contained HTML file (`dist/microverse.html`).

## Getting started

```bash
npm install
npm run build        # minified single-file build  -> dist/microverse.html
npm run build:dev    # unminified build for debugging
```

## Scripts

| Script                 | Purpose                                                        |
| ---------------------- | -------------------------------------------------------------- |
| `npm run format`       | Format the whole repository with Prettier                      |
| `npm run format:check` | Fail if anything is not Prettier-formatted                     |
| `npm run lint`         | ESLint (JavaScript) and Stylelint (CSS)                        |
| `npm test`             | Build, then run the regression suite against `tests/baseline/` |
| `npm run check`        | Format check, lint, build and tests in one go                  |

The tests need Playwright with Chromium. If it is installed globally, run them with `NODE_PATH=$(npm root -g)`.

## Project layout

```
src/
  index.template.html   Page skeleton (markup only; styles and script are injected by the build)
  main.js               Entry point; imports modules in the order their side effects require
  welcome-screen.js     DNA intro screen (own renderer, disposed after use)
  explorer.js           Main application: scene, UI panels, views, animation loop
  engine/               Reusable 3D building blocks
    math.js               Constants, seeded random, noise, vector helpers
    textures.js           Procedural textures
    materials.js          Material factory (shell, glass, soft, grain, emit)
    geometry-helpers.js   Tubes, flagella, instancing helpers, clipping plane
    specimen.js           Specimen container (meshes, selectable parts, animations)
    organelles.js         Shared organelle builders
  specimens/            One module per family of specimens plus the catalogue
styles/                 One stylesheet per component, concatenated in a fixed order by the build
scripts/build.mjs       esbuild bundling + HTML inlining
tests/                  Behaviour, visual and computed-style regression tests and their baselines
```

## Conventions

- **Formatting** is owned by Prettier (`.prettierrc.json`); never hand-format around it.
- **CSS**: one selector block per rule, one declaration per line, properties grouped (positioning, box model, typography, visual, motion), organised by component. Custom properties live in `styles/tokens.css` and follow `--color-*`, `--font-*` naming.
- **JavaScript**: ES modules, descriptive names, `const` by default, no chained assignments, no nested ternaries, braces always. ESLint enforces this (`eslint.config.js`); short names such as `i`, `x`, `t` are allowed only for conventional loop and coordinate use.
- **Documentation**: public engine APIs and the main application functions carry JSDoc. Non-obvious algorithms (parallel-transport tubes, value noise, Fibonacci sphere) are explained where they live.
- **Determinism**: specimen models use `createSeededRandom`. The _order_ of random draws is part of a model's identity, so do not reorder or remove draws when refactoring.

## Regression tests

`npm test` guards against accidental changes:

1. **Model fingerprints**: geometry statistics for every specimen, including library order.
2. **Screenshots**: ten reference views (desktop, narrow, phone) compared pixel by pixel.
3. **Computed styles**: every element group's computed CSS across all views.

The baselines in `tests/baseline/` were captured from the pre-refactor build. If you change the appearance on purpose, regenerate them with the capture scripts in `tests/`.
