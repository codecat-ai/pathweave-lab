import { describe, expect, it } from "vitest";
import {
  applyBundleEntry,
  createPresetBundle,
  formatPresetBundleSummary,
  parsePresetBundle,
  serializePresetBundle,
  summarizePresetBundle,
} from "../src/presetBundles";
import type { Grid } from "../src/grid";

type MutableGrid = Omit<Grid, "walls"> & {
  walls: { x: number; y: number }[];
};

describe("lesson preset bundles", () => {
  it("creates an exportable bundle from selected presets in the requested order", () => {
    const bundle = createPresetBundle(
      "Workshop pathfinding sequence",
      ["weighted-detour", "detour-wall"],
      {
        algorithmByPreset: {
          "detour-wall": "bfs",
          "weighted-detour": "dijkstra",
        },
        movementByPreset: {
          "detour-wall": "diagonal",
          "weighted-detour": "orthogonal",
        },
      },
    );

    expect(bundle).toMatchObject({
      schema: "pathweave.lessonPresetBundle",
      version: 1,
      title: "Workshop pathfinding sequence",
      generatedFrom: "Pathweave Lab",
    });
    expect(bundle.entries.map((entry) => entry.id)).toEqual([
      "weighted-detour",
      "detour-wall",
    ]);
    expect(bundle.entries[0]).toMatchObject({
      title: "Weighted detour",
      algorithm: "dijkstra",
      movement: "orthogonal",
      board: {
        width: 4,
        height: 2,
        start: { x: 0, y: 0 },
        goal: { x: 3, y: 0 },
        terrain: [
          { x: 1, y: 0, type: "water" },
          { x: 2, y: 0, type: "water" },
        ],
      },
    });
  });

  it("serializes bundles as deterministic pretty JSON", () => {
    const bundle = createPresetBundle("Sequence", [
      "detour-wall",
      "weighted-detour",
    ]);

    expect(serializePresetBundle(bundle)).toMatchInlineSnapshot(`
      "{
        "schema": "pathweave.lessonPresetBundle",
        "version": 1,
        "title": "Sequence",
        "generatedFrom": "Pathweave Lab",
        "entries": [
          {
            "id": "detour-wall",
            "title": "Detour wall",
            "description": "Two staggered walls force students to trace the reachable opening before BFS finds the route.",
            "algorithm": "bfs",
            "movement": "orthogonal",
            "board": {
              "width": 7,
              "height": 5,
              "start": {
                "x": 0,
                "y": 2
              },
              "goal": {
                "x": 6,
                "y": 2
              },
              "walls": [
                {
                  "x": 4,
                  "y": 0
                },
                {
                  "x": 2,
                  "y": 1
                },
                {
                  "x": 4,
                  "y": 1
                },
                {
                  "x": 2,
                  "y": 2
                },
                {
                  "x": 2,
                  "y": 3
                },
                {
                  "x": 4,
                  "y": 3
                },
                {
                  "x": 4,
                  "y": 4
                }
              ],
              "terrain": []
            }
          },
          {
            "id": "weighted-detour",
            "title": "Weighted detour",
            "description": "Water on the short route shows why Dijkstra may prefer a longer path with lower total cost.",
            "algorithm": "dijkstra",
            "movement": "orthogonal",
            "board": {
              "width": 4,
              "height": 2,
              "start": {
                "x": 0,
                "y": 0
              },
              "goal": {
                "x": 3,
                "y": 0
              },
              "walls": [],
              "terrain": [
                {
                  "x": 1,
                  "y": 0,
                  "type": "water"
                },
                {
                  "x": 2,
                  "y": 0,
                  "type": "water"
                }
              ]
            }
          }
        ]
      }"
    `);
  });

  it("parses a serialized bundle and applies entries as cloned board state", () => {
    const bundle = parsePresetBundle(
      serializePresetBundle(createPresetBundle("Clone check", ["detour-wall"])),
    );
    const entry = firstEntry(bundle);
    const firstGrid = applyBundleEntry(entry) as MutableGrid;
    const secondGrid = applyBundleEntry(entry);

    firstGrid.walls[0] = { x: 99, y: 99 };

    expect(secondGrid.walls[0]).toEqual({ x: 4, y: 0 });
    expect(entry.board.walls[0]).toEqual({ x: 4, y: 0 });
  });

  it("rejects invalid bundle JSON with helpful errors", () => {
    expect(() => parsePresetBundle("{")).toThrow(
      "Lesson bundle must be valid JSON.",
    );
    expect(() => parsePresetBundle("[]")).toThrow(
      "Lesson bundle must be a JSON object.",
    );
    expect(() =>
      parsePresetBundle(
        JSON.stringify({
          schema: "other",
          version: 1,
          title: "Bad",
          generatedFrom: "Pathweave Lab",
          entries: [],
        }),
      ),
    ).toThrow("Lesson bundle schema must be pathweave.lessonPresetBundle.");
    expect(() =>
      parsePresetBundle(
        JSON.stringify({
          schema: "pathweave.lessonPresetBundle",
          version: 2,
          title: "Bad",
          generatedFrom: "Pathweave Lab",
          entries: [],
        }),
      ),
    ).toThrow("Lesson bundle version must be 1.");
    expect(() =>
      parsePresetBundle(
        JSON.stringify({
          schema: "pathweave.lessonPresetBundle",
          version: 1,
          title: "Bad",
          generatedFrom: "Pathweave Lab",
          entries: [],
        }),
      ),
    ).toThrow("Lesson bundle entries must include at least one entry.");
  });

  it("rejects duplicate ids, missing fields, invalid movement, and malformed boards", () => {
    const valid = createPresetBundle("Validation", ["detour-wall"]);
    const entry = firstEntry(valid);

    expect(() =>
      parsePresetBundle(
        JSON.stringify({
          ...valid,
          entries: [entry, entry],
        }),
      ),
    ).toThrow("Lesson bundle entry ids must be unique.");

    expect(() =>
      parsePresetBundle(
        JSON.stringify({
          ...valid,
          entries: [{ ...entry, title: "" }],
        }),
      ),
    ).toThrow("Lesson bundle entry 1 title must be a non-empty string.");

    expect(() =>
      parsePresetBundle(
        JSON.stringify({
          ...valid,
          entries: [{ ...entry, movement: "flying" }],
        }),
      ),
    ).toThrow("Lesson bundle entry 1 movement must be orthogonal or diagonal.");

    expect(() =>
      parsePresetBundle(
        JSON.stringify({
          ...valid,
          entries: [
            {
              ...entry,
              board: { ...entry.board, width: 1 },
            },
          ],
        }),
      ),
    ).toThrow("Lesson bundle entry 1 board is invalid:");
  });

  it("rejects unknown selected preset ids while creating a bundle", () => {
    expect(() => createPresetBundle("Bad", ["detour-wall", "missing"])).toThrow(
      "Unknown lesson preset id: missing",
    );
  });

  it("summarizes mixed bundle metadata for pre-import previews", () => {
    const bundle = createPresetBundle(
      "Classroom sequence",
      ["detour-wall", "weighted-detour", "no-path"],
      {
        algorithmByPreset: {
          "detour-wall": "bfs",
          "weighted-detour": "dijkstra",
          "no-path": "bfs",
        },
        movementByPreset: {
          "detour-wall": "orthogonal",
          "weighted-detour": "diagonal",
          "no-path": "orthogonal",
        },
      },
    );

    expect(summarizePresetBundle(bundle)).toEqual({
      title: "Classroom sequence",
      entryCount: 3,
      algorithms: ["bfs", "dijkstra"],
      movements: ["orthogonal", "diagonal"],
      boardSizes: ["7x5", "4x2", "3x3"],
      hasWeightedTerrain: true,
      entrySummaries: [
        {
          id: "detour-wall",
          title: "Detour wall",
          algorithm: "bfs",
          movement: "orthogonal",
          size: "7x5",
          terrainCount: 0,
        },
        {
          id: "weighted-detour",
          title: "Weighted detour",
          algorithm: "dijkstra",
          movement: "diagonal",
          size: "4x2",
          terrainCount: 2,
        },
        {
          id: "no-path",
          title: "No path",
          algorithm: "bfs",
          movement: "orthogonal",
          size: "3x3",
          terrainCount: 0,
        },
      ],
    });
  });

  it("deduplicates board sizes while preserving first-seen order", () => {
    const first = createPresetBundle("First", ["detour-wall"]);
    const entry = firstEntry(first);
    const repeatedSize = {
      ...entry,
      id: "detour-wall-copy",
      title: "Detour wall copy",
    };

    const summary = summarizePresetBundle({
      ...first,
      title: "Repeated boards",
      entries: [entry, repeatedSize],
    });

    expect(summary.boardSizes).toEqual(["7x5"]);
    expect(summary.entrySummaries.map((entry) => entry.size)).toEqual([
      "7x5",
      "7x5",
    ]);
  });

  it("formats bundle preview text with plural lesson grammar and entry lines", () => {
    const bundle = createPresetBundle(
      "Classroom sequence",
      ["detour-wall", "weighted-detour"],
      {
        algorithmByPreset: {
          "detour-wall": "bfs",
          "weighted-detour": "dijkstra",
        },
        movementByPreset: {
          "detour-wall": "orthogonal",
          "weighted-detour": "diagonal",
        },
      },
    );

    expect(formatPresetBundleSummary(bundle)).toBe(
      [
        "Bundle: Classroom sequence · 2 lessons · algorithms: BFS, Dijkstra · movements: orthogonal, diagonal · board sizes: 7x5, 4x2 · weighted terrain: yes",
        "1. Detour wall (detour-wall): BFS, orthogonal, 7x5, terrain cells: 0",
        "2. Weighted detour (weighted-detour): Dijkstra, diagonal, 4x2, terrain cells: 2",
      ].join("\n"),
    );
  });

  it("formats a single-entry bundle with singular lesson grammar", () => {
    const bundle = createPresetBundle("Solo lesson", ["detour-wall"]);

    expect(formatPresetBundleSummary(bundle)).toBe(
      [
        "Bundle: Solo lesson · 1 lesson · algorithms: BFS · movements: orthogonal · board sizes: 7x5 · weighted terrain: no",
        "1. Detour wall (detour-wall): BFS, orthogonal, 7x5, terrain cells: 0",
      ].join("\n"),
    );
  });
});

function firstEntry(bundle: ReturnType<typeof createPresetBundle>) {
  const entry = bundle.entries[0];

  if (!entry) {
    throw new Error("Expected test bundle to include an entry.");
  }

  return entry;
}
