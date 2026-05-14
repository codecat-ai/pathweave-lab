# Pathweave Lab

[English](README.md) | [中文](README-zh.md) | [日本語](README-ja.md)

Pathweave Lab is an interactive, local-first pathfinding playground for explaining grid search algorithms.

## Problem and motivation

Pathfinding is easier to understand when learners can change the board and immediately see what the algorithm explores. Pathweave Lab provides a small static web app for sketching walls, painting weighted terrain, moving start and goal cells, comparing breadth-first search (BFS) with Dijkstra search, and reading concise metrics without accounts, telemetry, or a backend.

## Features

- Interactive grid for toggling walls and moving start/goal cells.
- Keyboard-first board cursor shortcuts for moving across the grid and applying the selected paint mode without mouse input.
- Weighted terrain painting with normal, mud, and water cells.
- Breadth-first search with deterministic shortest paths on unweighted grids.
- Deterministic Dijkstra search for lowest-cost paths on weighted terrain.
- BFS vs Dijkstra comparison summaries that explain steps versus weighted cost.
- Optional orthogonal or diagonal movement lessons, with orthogonal kept as the default.
- Step-by-step playback controls for inspecting one visited cell at a time.
- Optional light theme toggle, with dark mode kept as the default and saved per browser.
- Visited-cell, distance, weighted-cost, movement-mode, wall-count, terrain-count, and reachable/unreachable metrics.
- Plain-language explanation of each search result.
- Deterministic sample boards for repeatable lessons.
- Named teacher lesson presets such as **Detour wall**, **Weighted detour**, and **No path** for quickly loading focused board states.
- Importable and exportable lesson preset bundles for sharing deterministic workshop sequences across classrooms.
- JSON export/import for local sharing and reproducible examples.
- Shareable encoded `#board=` URLs for loading board states, terrain, and movement mode without a server.
- Copyable classroom worksheet variants: concise default handouts or guided handouts with extra prediction and reflection prompts.
- Printable worksheet layout previews with escaped deterministic HTML and a print action for classroom handout review.
- Copyable standalone SVG board snapshots with title, legend, metrics, terrain, visited cells, and final path.
- Pure TypeScript grid and search functions covered by behavior tests.

## Installation

Use the GitHub source checkout:

```bash
git clone https://github.com/codecat-ai/pathweave-lab.git
cd pathweave-lab
npm ci
```

## Quick start

Start the local Vite development server:

```bash
npm run dev
```

Then open the local URL printed by Vite in your browser.

## Examples

1. Choose the **Braid**, **Rooms**, or **Corridor** sample board.
2. Choose **Detour wall**, **Weighted detour**, or **No path** from **Lesson preset** to load a focused teaching board.
3. Select **Toggle walls** and click cells to reshape the board.
4. Select **Cycle terrain** to paint normal, mud, and water cells.
5. Select **Move start** or **Move goal** to reposition endpoints.
6. Focus the board and use Arrow keys, Home/End, PageUp/PageDown, Space/Enter, and Escape to edit from the keyboard.
7. Switch **Search** between **BFS (unweighted)**, **Dijkstra (weighted)**, and **Compare BFS and Dijkstra**.
8. Switch **Movement** between **Orthogonal (4-way)** and **Diagonal (8-way)** to compare how movement rules change the result.
9. Use **Light mode** or **Dark mode** to switch the browser theme.
10. Click **Run search** and compare visited cells, steps, weighted cost, and the final path.
11. Use **Reset playback**, **Prev**, and **Next** to inspect each visited cell.
12. Copy the JSON state or use **Copy share URL** to share the same board, terrain, and movement mode locally.
13. Use **Copy built-in bundle** to copy the built-in lesson preset sequence as deterministic JSON, or paste a shared bundle into **Bundle JSON** and choose **Import bundle**.
14. Select an imported lesson from **Imported lesson** and use **Apply imported lesson** to load its board, movement mode, and search mode.
15. Use **Copy SVG** to copy a standalone board snapshot for slides, worksheets, LMS pages, or bug reports.
16. Choose **Concise** or **Guided** next to the worksheet control to update the visible worksheet preview.
17. Use **Print worksheet** for a paper-ready handout, or **Copy worksheet** to copy the selected Markdown prompt and answer key.

## Configuration

There is no runtime configuration file in the MVP. Board dimensions, sample names, lesson preset controls, lesson bundle controls, keyboard shortcut wiring, worksheet variant controls, and worksheet preview wiring are defined in `src/app.ts`, while pure grid, keyboard shortcut, preset, preset bundle, theme, worksheet, printable worksheet HTML, SVG export, and sharing behavior lives in `src/grid.ts`, `src/keyboardShortcuts.ts`, `src/presets.ts`, `src/presetBundles.ts`, `src/theme.ts`, `src/worksheet.ts`, `src/worksheetPrint.ts`, `src/svgExport.ts`, `src/shareUrl.ts`, `src/algorithms.ts`, and `src/samples.ts`. Lesson presets are typed definitions in `src/presets.ts`; `applyPreset` returns a complete cloned board state so teachers can load examples without mutating the source preset. Lesson preset bundles are deterministic schema-versioned JSON in `src/presetBundles.ts`, including cloned board state plus algorithm and movement metadata for classroom import/export. Worksheet variants are deterministic TypeScript formatter options in `src/worksheet.ts`, and printable layout formatting is kept in `src/worksheetPrint.ts` for testable HTML escaping and print dependency injection.

## Development

This project uses Node.js 24, Vite, TypeScript, Vitest, ESLint, and Prettier. A `.mise-tool-versions` file records the local Node toolchain used for autonomous development.

```bash
npm ci
npm run lint
npm run typecheck
npm run format
npm test -- --run
npm run build
```

## Testing

Behavior tests cover shortest-path results, weighted terrain costs, Dijkstra lower-cost path selection, BFS-vs-Dijkstra explanations, orthogonal and diagonal movement, diagonal corner-cut prevention, playback frames, wall handling, keyboard board cursor shortcuts, unreachable boards, named lesson preset lookup and cloning, weighted preset terrain, lesson preset bundle creation, deterministic bundle serialization, bundle validation, imported bundle clone safety, concise and guided worksheet export text, printable worksheet HTML escaping and variant previews, injected worksheet print behavior, deterministic SVG export, JSON round-tripping, share URL encoding, theme preference storage, malformed input rejection, and deterministic sample generation.

```bash
npm test -- --run
```

## Roadmap

- Add classroom timer and prompt sequencing controls for pacing live tracing exercises.
- Add bundle preview summaries before import so teachers can inspect sequence length, algorithms, and board sizes.
- Add optional worksheet language packs while preserving deterministic local formatting.

## Contributing

Contributions are welcome. Please keep changes small, include behavior tests for new features or bug fixes, and run the full verification commands before opening a pull request. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT License. See [LICENSE](LICENSE).

## Maintenance note

This project is maintained with AI assistance, with tests and CI used to verify changes before publication.
