import { describe, expect, it } from "vitest";
import { runBreadthFirstSearch } from "../src/algorithms";
import { createGrid, toggleWall } from "../src/grid";

describe("runBreadthFirstSearch", () => {
  it("returns a direct shortest path on an empty grid", () => {
    const grid = createGrid(4, 1, { x: 0, y: 0 }, { x: 3, y: 0 });

    const result = runBreadthFirstSearch(grid);

    expect(result.found).toBe(true);
    expect(result.distance).toBe(3);
    expect(result.path).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ]);
    expect(result.visitedOrder).toEqual(result.path);
    expect(result.explanation).toContain("BFS");
  });

  it("routes around walls when a route exists", () => {
    let grid = createGrid(3, 3, { x: 0, y: 1 }, { x: 2, y: 1 });
    grid = toggleWall(grid, { x: 1, y: 1 });

    const result = runBreadthFirstSearch(grid);

    expect(result.found).toBe(true);
    expect(result.distance).toBe(4);
    expect(result.path.at(0)).toEqual(grid.start);
    expect(result.path.at(-1)).toEqual(grid.goal);
    expect(result.path).not.toContainEqual({ x: 1, y: 1 });
  });

  it("reports unreachable when walls block the goal", () => {
    let grid = createGrid(3, 3, { x: 0, y: 0 }, { x: 2, y: 2 });
    grid = toggleWall(grid, { x: 1, y: 2 });
    grid = toggleWall(grid, { x: 2, y: 1 });

    const result = runBreadthFirstSearch(grid);

    expect(result.found).toBe(false);
    expect(result.distance).toBeNull();
    expect(result.path).toEqual([]);
    expect(result.visitedOrder).not.toContainEqual(grid.goal);
    expect(result.explanation).toContain("unreachable");
  });
});
