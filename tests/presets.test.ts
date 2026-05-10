import { describe, expect, it } from "vitest";
import { runBreadthFirstSearch, runDijkstraSearch } from "../src/algorithms";
import {
  applyPreset,
  getPreset,
  presetNames,
  type BoardPresetName,
} from "../src/presets";

type MutablePoint = { x: number; y: number };
type MutableTerrain = MutablePoint & { type: "mud" | "water" };

describe("board presets", () => {
  it("looks up named teaching presets by stable id", () => {
    expect(presetNames).toEqual(["detour-wall", "weighted-detour", "no-path"]);

    const preset = getPreset("detour-wall");

    if (!preset) {
      throw new Error("Expected detour-wall preset to exist.");
    }

    expect(preset.name).toBe("detour-wall");
    expect(preset.label).toBe("Detour wall");
    expect(getPreset("missing" as BoardPresetName)).toBeUndefined();
  });

  it("applies a preset as a complete cloned board without mutating the source preset", () => {
    const preset = getPreset("detour-wall");

    if (!preset) {
      throw new Error("Expected detour-wall preset to exist.");
    }

    const firstGrid = applyPreset("detour-wall");
    const firstWall = (firstGrid.walls as MutablePoint[])[0];

    if (!firstWall) {
      throw new Error("Expected detour-wall preset to include walls.");
    }

    firstWall.x = 99;
    (firstGrid.terrain as MutableTerrain[]).push({ x: 1, y: 1, type: "water" });

    const secondGrid = applyPreset("detour-wall");

    expect(secondGrid).toEqual({
      width: 7,
      height: 5,
      start: { x: 0, y: 2 },
      goal: { x: 6, y: 2 },
      walls: [
        { x: 4, y: 0 },
        { x: 2, y: 1 },
        { x: 4, y: 1 },
        { x: 2, y: 2 },
        { x: 2, y: 3 },
        { x: 4, y: 3 },
        { x: 4, y: 4 },
      ],
      terrain: [],
    });
    expect(preset.walls[0]).toEqual({ x: 2, y: 1 });
    expect(preset.terrain).toEqual([]);
  });

  it("preserves weighted terrain for the weighted detour lesson", () => {
    const grid = applyPreset("weighted-detour");
    const bfs = runBreadthFirstSearch(grid);
    const dijkstra = runDijkstraSearch(grid);

    expect(grid.terrain).toEqual([
      { x: 1, y: 0, type: "water" },
      { x: 2, y: 0, type: "water" },
    ]);
    expect(bfs.path).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ]);
    expect(dijkstra.path).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 3, y: 0 },
    ]);
    expect(dijkstra.cost).toBeLessThan(10);
  });

  it("loads a no-path lesson that stays unreachable for BFS and Dijkstra", () => {
    const grid = applyPreset("no-path");

    const bfs = runBreadthFirstSearch(grid);
    const dijkstra = runDijkstraSearch(grid);

    expect(bfs.found).toBe(false);
    expect(bfs.path).toEqual([]);
    expect(dijkstra.found).toBe(false);
    expect(dijkstra.path).toEqual([]);
  });
});
