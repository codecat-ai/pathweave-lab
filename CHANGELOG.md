# Changelog

All notable changes to Pathweave Lab will be documented in this file.

## Unreleased

- Added named teacher lesson presets for detour walls, weighted detours, and no-path boards, with typed preset helpers and UI loading controls.
- Added behavior tests for preset lookup, cloned preset application, weighted preset terrain, and no-path search results.
- Added an optional browser theme toggle with dark mode as the default, light mode support, and localStorage persistence.
- Added behavior tests for theme preference loading, invalid stored values, storage failures, persistence, and toggling.
- Added weighted terrain painting with normal, mud, and water cells.
- Added deterministic Dijkstra search and BFS-vs-Dijkstra comparison summaries for teaching weighted path cost.
- Preserved weighted terrain in JSON export/import and share URLs while keeping old shared boards compatible.
- Added behavior tests for weighted terrain, Dijkstra path selection, comparison explanations, and terrain share-state round-trips.
- Added copyable classroom worksheet export with board summary, movement mode, student prompts, compact legend, and BFS answer key.
- Added behavior tests for reachable and unreachable worksheet output.
- Added optional diagonal BFS movement mode while keeping orthogonal movement as the default.
- Added diagonal corner-cut prevention so blocked adjacent side cells stop invalid diagonal steps.
- Added UI movement controls, movement metrics, and share URL preservation for movement mode.
- Added shareable encoded `#board=` URLs for local board state sharing.
- Added startup loading and helpful invalid-hash feedback for shared board URLs.
- Added behavior tests for URL-safe board encoding and malformed share payloads.

## 0.1.0 - 2026-05-05

- Initial local-first BFS pathfinding playground.
- Added interactive grid, deterministic samples, BFS playback controls, JSON import/export, multilingual documentation, tests, and CI.
