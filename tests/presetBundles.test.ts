import { describe, expect, it } from "vitest";
import {
  applyBundleEntry,
  createPresetBundle,
  parsePresetBundle,
  serializePresetBundle,
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
});

function firstEntry(bundle: ReturnType<typeof createPresetBundle>) {
  const entry = bundle.entries[0];

  if (!entry) {
    throw new Error("Expected test bundle to include an entry.");
  }

  return entry;
}
