# Product Requirements Document (PRD)
## Project: MICROVERSE 3.0 — Interactive 3D Microscopic World Explorer
**Product Version:** 3.0 (Mega Specimen Expansion)  
**Author:** Principal Software Architect & Computational Biologist  
**Status:** In Production / Quality Gate Certified  
**Target Release:** Q4 2026  

---

## Table of Contents
1. [Executive Summary & Product Vision](#1-executive-summary--product-vision)
2. [Problem Statement & Market Opportunity](#2-problem-statement--market-opportunity)
3. [Target Personas & User Journeys](#3-target-personas--user-journeys)
4. [Product Features & Functional Specifications](#4-product-features--functional-specifications)
   - 4.1 Onboarding & 3D DNA Double-Helix Stage
   - 4.2 Interactive 3D Microscope Viewport & Lighting
   - 4.3 Multi-Layer Structure Raycasting & Organelle Inspection
   - 4.4 Virtual Optical Cross-Section Slicing
   - 4.5 Logarithmic Comparative Axis (10 nm to 1 cm)
   - 4.6 Gamified Discovery Journal
   - 4.7 Responsive Multi-Platform Layout
5. [Taxonomic Scope & Specimen Library Inventory](#5-taxonomic-scope--specimen-library-inventory)
6. [Design System & User Experience Guidelines](#6-design-system--user-experience-guidelines)
7. [Technical Architecture & Deployment Model](#7-technical-architecture--deployment-model)
8. [Success Metrics & Quality Assurance KPIs](#8-success-metrics--quality-assurance-kpis)
9. [Release Milestones & Future Roadmap](#9-release-milestones--future-roadmap)

---

## 1. Executive Summary & Product Vision

### Product Vision
To democratize computational biology by transforming any standard web browser into an ultra-high-resolution, interactive 3D virtual microscope capable of rendering the microscopic realm with scientific rigor, anatomical depth, and aesthetic wonder.

### Executive Summary
**MICROVERSE 3.0** represents a transformative expansion in educational web graphics. Expanding from an initial 53-specimen prototype to **1,128 fully interactive 3D models**, MICROVERSE enables students, educators, and researchers to explore microscopic life spanning 7 orders of magnitude ($10\,\text{nm}$ to $1\,\text{cm}$).

Built on a zero-dependency, single-file HTML architecture ($2.7\,\text{MB}$), MICROVERSE requires no installation, no app store downloads, and no server connectivity. It operates with 60 FPS fluidity on desktop and mobile devices alike, setting a benchmark for educational web applications.

---

## 2. Problem Statement & Market Opportunity

| Challenge in Traditional Biology Education | The MICROVERSE 3.0 Solution |
| :--- | :--- |
| **Static 2D Textbook Diagrams:** Fail to convey true 3D spatial organization, depth of lipid bilayers, or relative organelle positions. | **Interactive 3D Spatial Models:** Full $360^\circ$ orbital controls with natural lighting, translucent shaders, and multi-layer organelle raycasting. |
| **Physical Microscope Limitations:** Standard educational light microscopes are limited by the diffraction limit of light ($\sim 200\,\text{nm}$), rendering viruses and organelles invisible. | **Full-Spectrum Virtual Microscope:** Seamlessly spans from tiny 20 nm parvoviruses to 10 mm metazoan hydra with continuous zoom. |
| **Fragmented Software / Heavy Installs:** Educational software often demands multi-gigabyte native installers, paid licensing, or fragile server backends. | **Zero-Dependency Single-File HTML:** Instantaneous load in any browser from a local file, USB stick, or static webpage (2.7 MB total). |
| **Lack of Motility Context:** Static micrographs fail to depict flagellar thrust, ciliary beat waves, or the inert nature of virions. | **Biologically Grounded Kinematic Engine:** Accurately models active motility vs. passive fluid suspension and Brownian thermal drift. |

---

## 3. Target Personas & User Journeys

### Persona A: Maya (High School & AP Biology Student)
- **Goal:** Visualize cellular respiration, viral capsid geometry, and bacterial flagellar arrangements for upcoming biology exams.
- **Pain Points:** Struggles to comprehend the internal layout of eukaryotic cells from flat 2D textbook drawings.
- **User Journey:**
  1. Opens `microverse.html` in Chrome; greeted by the smooth 3D DNA double helix.
  2. Clicks **Explore the invisible universe** to enter the microscope bench.
  3. Searches "bacteriophage", rotates the T4 phage, and clicks the icosahedral capsid to read about DNA packaging.
  4. Activates **Cross-section** to observe the hollow sheath and contractile injection core.

### Persona B: Prof. Aris (University Lecturer & Researcher)
- **Goal:** Demonstrate morphological distinctions between Gram-negative bacilli, centric diatoms, and extremophilic archaea during lectures.
- **Pain Points:** Traditional slides are fragile, time-consuming to prepare, and impossible for 100+ students to observe simultaneously in a lecture hall.
- **User Journey:**
  1. Projects MICROVERSE onto the auditorium screen.
  2. Uses the **Compare** view to contrast the scale of *E. coli* ($2\,\mu\text{m}$) against *Pelagibacter ubique* ($0.4\,\mu\text{m}$) and *Thiomargarita magnifica* ($10,000\,\mu\text{m}$).
  3. Switches between motile pennate diatoms and passive centric diatoms, illustrating raphe-based gliding motility.

### Persona C: Lucas (Science Enthusiast & Self-Directed Learner)
- **Goal:** Casual exploration of microscopic life forms on a mobile tablet.
- **Pain Points:** Intimidated by dense academic software with complex UI.
- **User Journey:**
  1. Opens the application on an iPad or smartphone.
  2. Taps through the bottom drawer library to discover *Tardigrades* (water bears).
  3. Pinches to zoom into claw structures, unlocking achievements in the **Discovery Journal**.

---

## 4. Product Features & Functional Specifications

### 4.1 Onboarding & 3D DNA Double-Helix Stage
- **Purpose:** Provide an immersive, cinematic onboarding experience while background resources initialize.
- **Specification:**
  - Renders a double-helix DNA strand with base-pair rungs rotating smoothly along its longitudinal axis.
  - Features real-time viewport adaptation and high-contrast typography.
  - Automatically disposes of its dedicated WebGL canvas upon entering the main application, reclaiming 100% of GPU intro buffers.
![Onboarding Screen](screenshots/desktop-welcome.png)

### 4.2 Interactive 3D Microscope Viewport & Lighting
- **Purpose:** Deliver a scientifically informed, laboratory-grade microscope viewing experience.
- **Specification:**
  - Three-point lighting system with directional key light, ambient fill, and a soft rim light mimicking dark-field / phase-contrast microscopy.
  - Floating physical scale bar in the bottom-right corner automatically computes real-world dimensions (nm, $\mu\text{m}$, mm) matching camera zoom.
  - Reticle crosshair and focus controls provide realistic microscope interaction.
![Microscope Viewport](screenshots/desktop-explorer.png)

### 4.3 Multi-Layer Structure Raycasting & Organelle Inspection
- **Purpose:** Allow users to identify, isolate, and understand individual anatomical structures.
- **Specification:**
  - Frustum-based raycasting tests intersections against all meshes and nested groups.
  - Clicking an exterior membrane selects it; clicking again at the same point penetrates to interior organelles (e.g., mitochondria, nucleoid, chloroplasts).
  - Selected parts trigger a golden emissive pulse shader and display a structured anatomical summary card.
![Structure Selection Modal](screenshots/desktop-about.png)

### 4.4 Virtual Optical Cross-Section Slicing
- **Purpose:** Simulate confocal optical sectioning to reveal internal ultrastructures without destructive geometry slicing.
- **Specification:**
  - Powered by GPU clipping planes (`material.clippingPlanes`).
  - Smooth planar cut reveals inner organelle distribution while maintaining front-face and back-face material capping.
  - Real-time slice plane position slider adjusts cut depth.

### 4.5 Logarithmic Comparative Axis (10 nm to 1 cm)
- **Purpose:** Contextualize the immense scale variance across the microscopic kingdom.
- **Specification:**
  - Interactive logarithmic scale ranging from $0.01\,\mu\text{m}$ ($10\,\text{nm}$) to $10,000\,\mu\text{m}$ ($1\,\text{cm}$).
  - Categorized rows plot all 1,127 specimens as interactive nodes.
  - Clicking any node navigates directly to that specimen in the 3D explorer.
  - Standard biological references included: DNA width ($2.3\,\text{nm}$), Ribosome ($25\,\text{nm}$), Human Hair ($70\,\mu\text{m}$), and Grain of Salt ($400\,\mu\text{m}$).
![Logarithmic Size Comparison](screenshots/desktop-compare.png)

### 4.6 Gamified Discovery Journal
- **Purpose:** Encourage curiosity, active exploration, and structured learning.
- **Specification:**
  - Automatically logs discovered specimens and inspected organelles to `localStorage`.
  - Calculates category-wise completion percentages and displays unlocked badge chips.
  - Operates completely client-side without user tracking, accounts, or analytics cookies.
![Discovery Journal](screenshots/desktop-journal.png)

### 4.7 Responsive Multi-Platform Layout
- **Purpose:** Provide an optimal user experience across desktops, laptops, tablets, and smartphones.
- **Specification:**
  - Desktop view offers collapsible panels to expand the 3D canvas to full screen.
  - Mobile layouts convert sidebars into accessible bottom-sheet drawers with touch gestures.
<p align="center">
  <img src="screenshots/desktop-collapsed.png" width="48%" alt="Collapsed Desktop View" />
  <img src="screenshots/phone-library-open.png" width="48%" alt="Mobile Drawer View" />
</p>

---

## 5. Taxonomic Scope & Specimen Library Inventory

MICROVERSE 3.0 houses **1,128 interactive 3D models**, verified across global taxonomic authorities:

| Category | Specimen Count | Example Taxa Included | Key Anatomical Structures |
| :--- | :---: | :--- | :--- |
| **Protozoa & Protists** | 170 | *Amoeba proteus*, *Paramecium caudatum*, *Stentor coeruleus*, *Giardia lamblia* | Cilia, Pellicle, Contractile Vacuoles, Macronucleus, Pseudopodia |
| **Marine Microorganisms** | 148 | *Noctiluca scintillans*, *Coscinodiscus*, *Emiliania huxleyi*, *Radiolaria* | Silica Frustules, Flagellar Sulcus, Bioluminescent Scintillons, Axopodia |
| **Microscopic Animals** | 134 | *Hypsibius dujardini* (Tardigrade), *Brachionus*, *Daphnia pulex*, *Hydra* | Chitinous Cuticle, Bucco-Pharyngeal Bulb, Corona Cilia, Ocellus Eye |
| **Bacteria** | 225 | *Escherichia coli*, *Bacillus anthracis*, *Helicobacter pylori*, *Treponema pallidum* | Peptidoglycan Cell Wall, Flagella, Pili, Nucleoid, Endospores |
| **Archaea** | 94 | *Haloferax volcanii*, *Sulfolobus yangmingensis*, *Methanocaldococcus*, *Pyrococcus* | S-Layer Protein Lattice, Ether Lipid Bilayer, Archflagella |
| **Microscopic Fungi** | 94 | *Saccharomyces cerevisiae*, *Penicillium chrysogenum*, *Aspergillus niger* | Chitinous Wall, Budding Scars, Conidiophores, Phialides, Conidia |
| **Microscopic Algae** | 100 | *Chlamydomonas reinhardtii*, *Volvox carteri*, *Micrasterias*, *Spirogyra* | Chloroplasts, Pyrenoid, Eye Spot, Pectic Sheath, Spiral Chloroplast Ribbon |
| **Viruses (Acellular)** | 63 | *Enterobacteria phage T4*, *SARS-CoV-2*, *Influenza A*, *Ebolavirus*, *HIV-1* | Icosahedral Capsid, Tail Fibers, Glycoprotein Spikes, Viral Genome Core |
| **Cell Biology & Somatic** | 99 | Human Erythrocyte, Neuron, Macrophage, Osteocyte, *Chloroplast* | Biconcave Plasma Membrane, Dendrites, Axon, Phagosomes, Thylakoid Grana |
| **Multi-Organelle Anatomy** | 1 | Dedicated *Eukaryotic Animal Cell* Anatomy Model | Nucleus, Rough & Smooth ER, Golgi Apparatus, Mitochondria, Centrosomes |
| **TOTAL** | **1,128** | **Comprehensive Microscopic Biodiversity** | **Zero NaN/Infinity Coordinates Across All 1,128 Models** |

---

## 6. Design System & User Experience Guidelines

### 6.1 Color Palette & Theme Tokens
The visual design reflects an authentic scientific laboratory bench: clean ivory backgrounds, crisp typography, and subtle sage-green accents.

```css
:root {
  --bg0: #FFFFFF;          /* Pure white canvas container */
  --bg1: #F7F6F0;          /* Ivory specimen shelf & tray background */
  --sage-bg: #EEF2E9;      /* Light sage active container tint */
  --panel: #FFFFFF;        /* Inspection card background */
  --fg: #252923;           /* Charcoal primary typography */
  --dim: #5F655D;          /* Slate secondary descriptions */
  --mute: #777D75;         /* Muted technical metadata */
  --accent: #789477;       /* Sage green active UI interactive state */
  --accent-d: #5A7659;     /* Deep sage brand mark */
  --terra: #C98770;        /* Terracotta warning / diagnostic highlight */
  --amber: #D5AA60;        /* Golden amber organelle focus pulse */
}
```

### 6.2 Typography Hierarchy
- **Primary Interface Font:** `'IBM Plex Sans'`, system-ui, -apple-system, sans-serif (clean scientific legibility).
- **Technical & Metric Font:** `'IBM Plex Mono'`, ui-monospace, Menlo, Consolas, monospace (used for scale bars, magnification, and coordinates).

---

## 7. Technical Architecture & Deployment Model

```
+----------------------------------------------------------------------------------+
|                            SOURCE CODE (ES MODULES)                              |
|  src/main.js  -->  src/explorer.js  -->  src/engine/*  -->  src/specimens/*      |
+-----------------------------------------+----------------------------------------+
                                          |
                         [esbuild Bundler + Minifier]
                                          |
+-----------------------------------------v----------------------------------------+
|                      SINGLE-FILE INLINING PIPELINE                               |
|  scripts/build.mjs concatenates:                                                 |
|    1. src/index.template.html (Markup skeleton)                                  |
|    2. styles/*.css (Pre-processed CSS stylesheets)                               |
|    3. Minified Three.js r160 Runtime + Application Engine                        |
+-----------------------------------------+----------------------------------------+
                                          |
                                          v
+----------------------------------------------------------------------------------+
|               DISTRIBUTABLE ARTIFACT: dist/microverse.html (2.7 MB)              |
|          Runs 100% offline, zero runtime dependencies, instant execution         |
+----------------------------------------------------------------------------------+
```

---

## 8. Success Metrics & Quality Assurance KPIs

MICROVERSE adheres to strict automated quality benchmarks enforced before any release:

| KPI Category | Target Metric | Achieved Metric | Verification Harness | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Model Generation** | 1,128 valid models | **1,128 / 1,128 models** | `tests/audit-all-models.mjs` | **100% PASS** |
| **Vertex Integrity** | 0 NaN or $\infty$ values | **0 NaN, 0 $\infty$ vertices** | `tests/audit-all-models.mjs` | **100% PASS** |
| **Raycast Selection** | 100% structure pick | **Verified 3D intersections** | `tests/audit-raycasting-and-cleanup.mjs` | **100% PASS** |
| **Memory Delta** | $\le 0.5\,\text{MB}$ across 50 loads | **0.00 MB delta (0 leaks)** | `tests/audit-raycasting-and-cleanup.mjs` | **100% PASS** |
| **Visual Regression** | 0 differing pixels | **10/10 states with 0 diff px** | `tests/visual-compare.mjs` | **100% PASS** |
| **Style Regression** | 0 CSS property diffs | **1,855 element groups match** | `tests/computed-styles-compare.mjs` | **100% PASS** |
| **Single-File Bundle** | $<3.0\,\text{MB}$ total | **2.7 MB standalone HTML** | `scripts/build.mjs` | **100% PASS** |

---

## 9. Release Milestones & Future Roadmap

```
+-----------------------------------------------------------------------------------+
| RELEASE MILESTONES                                                                |
|                                                                                   |
|  [v1.0] Core Virtual Microscope (53 Baseline Specimens)                - COMPLETE|
|  [v2.0] Specimen Expansion & Slicing Controls (117 Specimens)           - COMPLETE|
|  [v3.0] Mega Expansion (1,128 Models, Kinematics, 100% Quality Gate)    - RELEASED|
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| FUTURE PRODUCT ROADMAP                                                            |
|                                                                                   |
|  [v3.1] Spatial Audio & Fluid Acoustic Synthesis: Synthesize fluid micro-acoustics|
|         for ciliary swimming and flagellar vortex resonance.                      |
|  [v3.2] WebXR Immersive Microscope Mode: Native 6-DoF VR/AR inspection for Meta  |
|         Quest and Apple Vision Pro spatial headsets.                              |
|  [v3.3] Procedural Mutation & Viral Evolution Simulator: Simulate real-time amino|
|         acid spike substitutions on virion envelopes.                             |
|  [v3.4] Multi-User Collaborative Bench: WebRTC peer-to-peer shared inspection     |
|         for remote university laboratory classrooms.                              |
+-----------------------------------------------------------------------------------+
```

---
**Document Sign-Off:**  
*Product Management & Computational Biology Team*  
*MICROVERSE Interactive Biological Computing Group*
