# Pathweave Lab

[English](README.md) | [中文](README-zh.md) | [日本語](README-ja.md)

Pathweave Lab is an interactive, local-first pathfinding playground for explaining grid search algorithms.

## Problem and motivation

Pathfinding is easier to understand when learners can change the board and immediately see what the algorithm explores. Pathweave Lab provides a small static web app for sketching walls, moving start and goal cells, running breadth-first search (BFS), and reading concise metrics without accounts, telemetry, or a backend.

## Features

- Interactive grid for toggling walls and moving start/goal cells.
- Breadth-first search with deterministic shortest paths on unweighted grids.
- Optional orthogonal or diagonal movement lessons, with orthogonal kept as the default.
- Step-by-step BFS playback controls for inspecting one visited cell at a time.
- Visited-cell, distance, movement-mode, wall-count, and reachable/unreachable metrics.
- Plain-language explanation of each search result.
- Deterministic sample boards for repeatable lessons.
- JSON export/import for local sharing and reproducible examples.
- Shareable encoded `#board=` URLs for loading board states and movement mode without a server.
- Copyable classroom worksheet text with board summary, student prompts, compact legend, and BFS answer key.
- Pure TypeScript grid and search functions covered by behavior tests.

## Installation

Pathweave Lab is not published to a package registry. Use the GitHub source checkout:

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
2. Select **Toggle walls** and click cells to reshape the board.
3. Select **Move start** or **Move goal** to reposition endpoints.
4. Switch **Movement** between **Orthogonal (4-way)** and **Diagonal (8-way)** to compare how BFS layers change.
5. Click **Run BFS** and compare the visited cells with the final path.
6. Use **Reset playback**, **Prev**, and **Next** to inspect each visited cell.
7. Copy the JSON state or use **Copy share URL** to share the same board and movement mode locally.
8. Use **Copy worksheet** to place a concise Markdown prompt and answer key into a lesson handout.

## Configuration

There is no runtime configuration file in the MVP. Board dimensions and sample names are defined in `src/app.ts`, while pure grid, worksheet, and sharing behavior lives in `src/grid.ts`, `src/worksheet.ts`, `src/shareUrl.ts`, `src/algorithms.ts`, and `src/samples.ts`.

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

Behavior tests cover shortest-path results, orthogonal and diagonal movement, diagonal corner-cut prevention, BFS playback frames, wall handling, unreachable boards, worksheet export text, JSON round-tripping, share URL encoding, malformed input rejection, and deterministic sample generation.

```bash
npm test -- --run
```

## Roadmap

- Weighted terrain and Dijkstra comparison mode.
- Additional classroom worksheet variants.
- Optional dark/light theme toggle.

## Contributing

Contributions are welcome. Please keep changes small, include behavior tests for new features or bug fixes, and run the full verification commands before opening a pull request. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT License. See [LICENSE](LICENSE).

## Maintenance note

This project is maintained with AI assistance, with tests and CI used to verify changes before publication.
