import { describe, expect, it } from "vitest";
import {
  createGrid,
  parseGrid,
  serializeGrid,
  setTerrain,
  terrainCost,
  terrainAt,
  toggleWall,
} from "../src/grid";

describe("grid model", () => {
  it("prevents start and goal cells from becoming walls", () => {
    const grid = createGrid(3, 3, { x: 0, y: 0 }, { x: 2, y: 2 });

    expect(toggleWall(grid, grid.start).walls).toEqual([]);
    expect(toggleWall(grid, grid.goal).walls).toEqual([]);
  });

  it("round-trips board state through JSON", () => {
    let grid = createGrid(5, 4, { x: 1, y: 1 }, { x: 4, y: 3 });
    grid = toggleWall(grid, { x: 2, y: 1 });
    grid = toggleWall(grid, { x: 2, y: 2 });

    expect(parseGrid(serializeGrid(grid))).toEqual(grid);
  });

  it("stores weighted terrain while keeping normal terrain implicit", () => {
    let grid = createGrid(4, 2, { x: 0, y: 0 }, { x: 3, y: 0 });
    grid = setTerrain(grid, { x: 1, y: 0 }, "mud");
    grid = setTerrain(grid, { x: 2, y: 0 }, "water");
    grid = setTerrain(grid, { x: 1, y: 0 }, "normal");

    expect(grid.terrain).toEqual([{ x: 2, y: 0, type: "water" }]);
    expect(terrainAt(grid, { x: 1, y: 0 })).toBe("normal");
    expect(terrainAt(grid, { x: 2, y: 0 })).toBe("water");
    expect(terrainCost(grid, { x: 1, y: 0 })).toBe(1);
    expect(terrainCost(grid, { x: 2, y: 0 })).toBeGreaterThan(1);
  });

  it("loads old board JSON without terrain as normal terrain", () => {
    const grid = parseGrid(
      JSON.stringify({
        width: 3,
        height: 2,
        start: { x: 0, y: 0 },
        goal: { x: 2, y: 0 },
        walls: [],
      }),
    );

    expect(grid.terrain).toEqual([]);
    expect(terrainAt(grid, { x: 1, y: 0 })).toBe("normal");
  });

  it("rejects malformed JSON and invalid board state", () => {
    expect(() => parseGrid("{not json")).toThrow(/valid JSON/);
    expect(() =>
      parseGrid(
        JSON.stringify({
          width: 2,
          height: 2,
          start: { x: 0, y: 0 },
          goal: { x: 0, y: 0 },
          walls: [],
        }),
      ),
    ).toThrow(/different cells/);
  });
});
