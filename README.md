# MICROVERSE 3.0 — Interactive 3D Microscopic World Explorer

[![Three.js](https://img.shields.io/badge/Three.js-r160-black?logo=three.js)](https://threejs.org/)
[![Specimens](https://img.shields.io/badge/Interactive%20Models-1%2C128-success)](file:///C:/Users/SHUBHAM/Desktop/microverse/dist/microverse.html)
[![Taxa Verified](https://img.shields.io/badge/Species%20Taxa-1%2C034-blue)](file:///C:/Users/SHUBHAM/Desktop/microverse/dist/microverse.html)
[![Build](https://img.shields.io/badge/Build-Single--File%20HTML%20(2.7MB)-brightgreen)](file:///C:/Users/SHUBHAM/Desktop/microverse/dist/microverse.html)
[![Regression Tests](https://img.shields.io/badge/Regression%20Gate-100%25%20PASS-brightgreen)](file:///C:/Users/SHUBHAM/Desktop/microverse/tests/run-all.mjs)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

**MICROVERSE** is an interactive, scientific virtual microscope and 3D computational biology visualization engine. Built with Three.js, it models over **1,128 interactive microscopic life forms and anatomical structures** in high-fidelity 3D—spanning 7 orders of magnitude from a 20-nanometre parvovirus to a centimetre-long freshwater hydra.

Every specimen is scientifically informed, featuring animated biological motility (or passive Brownian suspension drift), multi-layer selectable organelles, real-time optical sectioning, logarithmic size comparison, and a gamified discovery journal.

The entire application bundles into a **single, zero-dependency 2.7 MB HTML file** (`dist/microverse.html`), capable of running fully offline on any modern browser.

---

## Visual Preview

### 1. Interactive 3D Microscope Stage
Explore organisms with natural lighting, translucent membrane shaders, internal organelles, and real-time physical scale bars.
![Interactive 3D Stage](docs/screenshots/desktop-explorer.png)

### 2. Double-Helix DNA Onboarding Screen
Welcoming 3D double-helix animation introducing users to the microscopic realm before transitioning seamlessly into the laboratory bench viewport.
![Welcome Screen](docs/screenshots/desktop-welcome.png)

### 3. Multi-Layer Structure Raycasting & Organelle Inspection
Select any anatomical structure to read its biological function. Clicking the same region penetrates deeper into internal organelle layers.
![Organelle Inspection](docs/screenshots/specimen-inspection.png)

### 4. Dynamic Optical Cross-Section Slicing
Slice through cell walls and lipid bilayers in real time using GPU clipping planes to expose interior ultrastructures.
![Optical Cross Section](docs/screenshots/specimen-cross-section.png)

### 5. Logarithmic Scale & Dimension Comparator
Compare biological structures across 7 orders of magnitude (10 nm to 1 cm) with interactive relative sizing.
![Size Comparison](docs/screenshots/desktop-compare.png)

### 6. Discovery Journal & Specimen Progress
Track inspected specimens and discovered organelles with persistent browser storage.
![Discovery Journal](docs/screenshots/desktop-journal.png)

### 7. Responsive Mobile & Small-Screen Optimization
Adaptive interface optimized for smartphones, tablets, and compact screens with touch gestures, collapsible side drawers, responsive overlays, and full safe-area inset handling—all seamlessly packaged within the single HTML file.
<p align="center">
  <img src="docs/screenshots/phone-explorer.png" width="31%" alt="Mobile Stage" />
  <img src="docs/screenshots/phone-library-open.png" width="31%" alt="Mobile Species Drawer" />
  <img src="docs/screenshots/phone-welcome.png" width="31%" alt="Mobile Welcome Screen" />
</p>
<p align="center">
  <img src="docs/screenshots/compact-scale-compare.png" width="48%" alt="Mobile Scale Comparator" />
  <img src="docs/screenshots/compact-welcome.png" width="48%" alt="Mobile Onboarding Stage" />
</p>

---

## Single-File Unified Architecture

MICROVERSE is built as a **100% self-contained single-file HTML application** (`index.html` / `dist/microverse.html`):

| File | Size | Target Environment | Highlights |
| :--- | :--- | :--- | :--- |
| **`index.html`** | 2.7 MB | All Devices (Desktop, Tablet, Mobile) | Zero external dependencies, self-adapting responsive 3D layout, offline-capable, embedded shaders & textures. |

---

## Key Features

- **1,128 Interactive 3D Models**:
  - **1,127 Catalogue Specimens** across 9 major scientific categories.
  - **1 Dedicated High-Resolution Multi-Organelle Anatomy Model** (*Eukaryotic Animal Cell*).
- **Biologically Grounded Kinematic Engine**:
  - Differentiates active biological locomotion (ciliary swimming, flagellar thrust, raphe gliding, amoeboid streaming) from inert fluid suspension and Brownian thermal agitation.
  - Non-motile bacteria and inert virions drift passively without artificial locomotion.
- **Raycasting & Multi-Layer Internal Inspection**:
  - Direct camera frustum raycasting intersects outer shells and nested internal organelles.
  - Clicking a structure reveals its biological function; clicking the same spot penetrates to deeper anatomical layers.
- **Dynamic Optical Cross-Section Slicing**:
  - Real-time GPU clipping planes slice through cell walls and lipid bilayers to expose internal ultrastructures like optical sectioning under a confocal microscope.
- **Logarithmic Comparative Axis**:
  - Dynamic scaling from $10\,\text{nm}$ to $1\,\text{cm}$ allows side-by-side scale comparison with familiar reference scales (DNA width, Ribosome, Human hair, Grain of salt).
- **Gamified Discovery Journal**:
  - Tracks explored taxa and morphological discoveries in `localStorage` without tracking cookies or external analytics.
- **Single-File Zero-Dependency Architecture**:
  - Compiled and minified into one self-contained HTML file embedding all JavaScript, CSS, procedural textures, and WebGL shaders. No external CDN or server assets required.

---

## Specimen Inventory Breakdown

Audited against NCBI Taxonomy, LPSN, WoRMS, AlgaeBase, and the ICTV Master Species List:

| Category | Specimen Count | Valid Species Taxa | Genera / Organism Groups | Acellular / Somatic / Organelles |
| :--- | :---: | :---: | :---: | :---: |
| **Protozoa & Protists** | 170 | 166 | 4 (*Paramecium*, *Arcella*, etc.) | 0 |
| **Marine Microorganisms** | 148 | 143 | 5 (*Coscinodiscus*, *Navicula*, etc.) | 0 |
| **Microscopic Animals** | 134 | 131 | 3 (*Brachionus*, *Philodina*, etc.) | 0 |
| **Bacteria** | 225 | 221 | 4 (*Streptomyces*, *Bacillus*, etc.) | 0 |
| **Archaea** | 94 | 93 | 1 (*Thermococcus*) | 0 |
| **Microscopic Fungi** | 94 | 93 | 1 (*Penicillium*) | 0 |
| **Microscopic Algae** | 100 | 97 | 3 (*Closterium*, *Pediastrum*, etc.) | 0 |
| **Viruses (Acellular)** | 63 | 0 | 0 | 63 ICTV viral lineages |
| **Cell Biology & Somatic** | 99 | 90 | 0 | 8 Somatic Cells + 1 Organelle (*Chloroplast*) |
| **Multi-Organelle Anatomy** | 1 | 0 | 0 | 1 Dedicated Animal Cell Anatomy |
| **TOTAL** | **1,128** | **1,034** | **21** | **73** |

*All 1,128 models possess 100% unique identifiers and 100% unique scientific binomials with 0 NaN/Infinity vertex coordinates.*

---

## Navigation & Microscope Controls

| Control | Mouse / Pointer | Touchscreen | Keyboard Shortcut |
| :--- | :--- | :--- | :--- |
| **Rotate** | Left-click + drag | 1-finger drag | Drag on canvas |
| **Pan** | Right-click + drag / Shift + drag | 2-finger drag | — |
| **Zoom** | Mouse wheel / Zoom slider | Pinch in / out | `+` / `-` slider |
| **Inspect Structure** | Left-click on any part | Tap on part | Click again to penetrate deeper |
| **Optical Cross-Section** | Toggle "Cross section" button | Tap "Cross section" | `S` or inspector toggle |
| **Reset View** | Reset button | Tap Reset | `R` |
| **Pause Animation** | Play/Pause toggle | Tap Play/Pause | `Space` |
| **Next / Previous Specimen** | Nav buttons | Swipe / Nav buttons | `→` / `←` Arrow keys |
| **Switch View** | Top nav bar buttons | Top nav bar buttons | `Explore`, `Library`, `Compare`, `Journal`, `About` |

---

## Project Architecture

```
microverse/
├── src/
│   ├── index.template.html       # HTML skeleton (inlines all CSS & JS at build)
│   ├── main.js                   # Main application entry point
│   ├── welcome-screen.js         # Dedicated 3D DNA double-helix intro renderer
│   ├── explorer.js               # Core app: viewport, camera, raycasting, UI states
│   ├── engine/                   # Reusable computational 3D engine components
│   │   ├── math.js               # Fibonacci distribution, seeded RNG, simplex noise
│   │   ├── textures.js           # Procedural canvas textures (flagella, membranes)
│   │   ├── materials.js          # Shaders: Fresnel shells, sub-surface scattering, glass
│   │   ├── geometry-helpers.js   # Extrusions, parallel-transport tubes, instancing
│   │   ├── specimen.js           # Specimen wrapper (meshes, parts, animations)
│   │   └── organelles.js         # Procedural organelle constructors
│   └── specimens/                # Specimen definitions and builders
│       ├── catalogue.js          # Specimen registry metadata & search index
│       ├── mega-species-engine.js# Procedural biology generator for 1,000+ species
│       ├── bacteria-and-archaea.js
│       ├── marine-microorganisms.js
│       ├── microscopic-animals.js
│       └── ...
├── styles/                       # Modular CSS stylesheets
│   ├── base.css                  # Core typography, resets, accessibility
│   ├── tokens.css                # Color scheme, fonts, theme variables
│   ├── viewer-stage.css          # Microscope canvas, scale bar, reticle
│   ├── info-panel.css            # Specimen details & organelle inspect card
│   └── ...
├── scripts/
│   └── build.mjs                 # esbuild bundler + single-file HTML inliner
├── tests/                        # Comprehensive quality gate test suite
│   ├── run-all.mjs               # Master regression orchestrator
│   ├── behaviour.mjs             # Fingerprint & geometry integrity audit
│   ├── visual-capture.mjs        # Playwright multi-viewport screenshot recorder
│   ├── visual-compare.mjs        # Pixelmatch screenshot comparison
│   ├── computed-styles.mjs       # CSS computed style recorder
│   ├── computed-styles-compare.mjs # 1,855-rule computed style verifier
│   └── baseline/                 # Verified ground-truth baselines
├── dist/
│   └── microverse.html           # Production single-file distributable (2.7 MB)
└── docs/                         # Specifications & Reports
    ├── SRS.md                    # Software Requirements Specification (IEEE 830)
    ├── PRD.md                    # Product Requirements Document
    ├── PROJECT_REPORT.md         # Full Scientific & Engineering Report
    └── screenshots/              # High-resolution application screenshots
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- Chromium (installed automatically via Playwright or system browser)

### Installation & Build

```bash
# Clone or navigate to the repository
cd C:/Users/SHUBHAM/Desktop/microverse

# Install dependencies
npm install

# Build the unified single-file HTML distribution
npm run build          # Generates dist/microverse.html (2.7 MB, synced to micro/index.html)

# Build development version for debugging
npm run build:dev      # Generates unminified dist/microverse.html with sourcemaps
```

### Running the Application
Simply double-click or open `index.html` (or `dist/microverse.html`) in any modern web browser (Chrome, Edge, Firefox, Safari). No web server, node runtime, backend service, or internet connection is required. The single HTML file self-adapts to desktops, laptops, tablets, and mobile phones.

---

## Verification & Quality Assurance

MICROVERSE enforces strict production quality gates via `npm test`.

```bash
# Run the complete regression test suite
npm test
```

### Test Suite Execution Output
```
=== Summary ===
PASS  build
PASS  behaviour
PASS  fingerprint comparison
PASS  screenshots
PASS  visual comparison
PASS  computed styles
PASS  style comparison
```

1. **Fingerprint Verification**: Evaluates geometry vertex counts, bounding radii, and face counts for all 1,128 specimens against baseline checksums.
2. **Visual Regression Verification**: Pixel-by-pixel image comparison across 10 distinct UI and viewport states (`0 differing pixels`).
3. **Computed Style Regression**: Verifies 1,855 element groups to ensure zero accessibility or visual styling regressions.
4. **Stress & Memory Leak Audit**: 50 consecutive specimen switches yield a **0.00 MB memory delta** and zero orphaned scene graph objects.

---

## Related Documentation

- [Software Requirements Specification (SRS)](docs/SRS.md) — Formal IEEE 830 specification covering functional, non-functional, and interface requirements.
- [Product Requirements Document (PRD)](docs/PRD.md) — Product vision, target personas, user journeys, feature specifications, and roadmap.
- [Comprehensive Project Report](docs/PROJECT_REPORT.md) — Academic and engineering report detailing computational biology algorithms, Three.js shaders, and performance benchmarks.

---

## License

This project is open-source under the [MIT License](LICENSE). 3D models and educational biological definitions are scientifically curated for educational and research use.
