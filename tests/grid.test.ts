import { describe, expect, it } from "vitest";
import { createGrid, parseGrid, serializeGrid, toggleWall } from "../src/grid";

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
