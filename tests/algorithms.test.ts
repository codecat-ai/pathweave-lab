import { describe, expect, it } from "vitest";
import {
  comparePathfinding,
  createPlaybackFrames,
  runBreadthFirstSearch,
  runDijkstraSearch,
} from "../src/algorithms";
import { createGrid, setTerrain, toggleWall } from "../src/grid";

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

  it("keeps orthogonal movement as the default search behavior", () => {
    const grid = createGrid(3, 3, { x: 0, y: 0 }, { x: 2, y: 2 });

    const result = runBreadthFirstSearch(grid);

    expect(result.found).toBe(true);
    expect(result.distance).toBe(4);
    expect(result.path).toHaveLength(5);
  });

  it("finds shorter paths when diagonal movement is enabled", () => {
    const grid = createGrid(3, 3, { x: 0, y: 0 }, { x: 2, y: 2 });

    const result = runBreadthFirstSearch(grid, "diagonal");

    expect(result.found).toBe(true);
    expect(result.distance).toBe(2);
    expect(result.path).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ]);
    expect(result.explanation).toContain("diagonal");
  });

  it("prevents diagonal movement through a blocked corner", () => {
    let grid = createGrid(3, 3, { x: 0, y: 0 }, { x: 2, y: 2 });
    grid = toggleWall(grid, { x: 1, y: 0 });
    grid = toggleWall(grid, { x: 0, y: 1 });

    const result = runBreadthFirstSearch(grid, "diagonal");

    expect(result.found).toBe(false);
    expect(result.visitedOrder).not.toContainEqual({ x: 1, y: 1 });
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

describe("runDijkstraSearch", () => {
  it("chooses a lower-cost weighted path over a shorter expensive path", () => {
    let grid = createGrid(4, 2, { x: 0, y: 0 }, { x: 3, y: 0 });
    grid = setTerrain(grid, { x: 1, y: 0 }, "water");
    grid = setTerrain(grid, { x: 2, y: 0 }, "water");

    const bfs = runBreadthFirstSearch(grid);
    const dijkstra = runDijkstraSearch(grid);

    expect(bfs.found).toBe(true);
    expect(bfs.distance).toBe(3);
    expect(bfs.path).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ]);
    expect(dijkstra.found).toBe(true);
    expect(dijkstra.distance).toBe(5);
    expect(dijkstra.cost).toBe(5);
    expect(dijkstra.path).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 3, y: 0 },
    ]);
    expect(dijkstra.explanation).toContain("Dijkstra");
    expect(dijkstra.explanation).toContain("weighted cost of 5");
  });

  it("matches BFS step distance on unweighted terrain", () => {
    const grid = createGrid(4, 1, { x: 0, y: 0 }, { x: 3, y: 0 });

    const result = runDijkstraSearch(grid);

    expect(result.found).toBe(true);
    expect(result.distance).toBe(3);
    expect(result.cost).toBe(3);
    expect(result.path).toEqual(runBreadthFirstSearch(grid).path);
  });
});

describe("comparePathfinding", () => {
  it("summarizes BFS steps against Dijkstra weighted cost in plain language", () => {
    let grid = createGrid(4, 2, { x: 0, y: 0 }, { x: 3, y: 0 });
    grid = setTerrain(grid, { x: 1, y: 0 }, "water");
    grid = setTerrain(grid, { x: 2, y: 0 }, "water");

    const comparison = comparePathfinding(grid);

    expect(comparison.bfs.distance).toBe(3);
    expect(comparison.dijkstra.cost).toBe(5);
    expect(comparison.explanation).toContain("BFS reaches the goal in 3 steps");
    expect(comparison.explanation).toContain(
      "Dijkstra chooses a route with weighted cost 5",
    );
    expect(comparison.explanation).toContain("weighted terrain");
  });
});

describe("createPlaybackFrames", () => {
  it("creates deterministic successful playback frames one visited cell at a time", () => {
    const grid = createGrid(4, 1, { x: 0, y: 0 }, { x: 3, y: 0 });
    const result = runBreadthFirstSearch(grid);

    const frames = createPlaybackFrames(result);

    expect(frames).toEqual([
      {
        step: 1,
        current: { x: 0, y: 0 },
        visited: [{ x: 0, y: 0 }],
        pathPrefix: [],
      },
      {
        step: 2,
        current: { x: 1, y: 0 },
        visited: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ],
        pathPrefix: [],
      },
      {
        step: 3,
        current: { x: 2, y: 0 },
        visited: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
        ],
        pathPrefix: [],
      },
      {
        step: 4,
        current: { x: 3, y: 0 },
        visited: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 },
        ],
        pathPrefix: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 },
        ],
      },
    ]);
  });

  it("keeps unreachable playback frames pathless while preserving visited history", () => {
    let grid = createGrid(3, 1, { x: 0, y: 0 }, { x: 2, y: 0 });
    grid = toggleWall(grid, { x: 1, y: 0 });

    const result = runBreadthFirstSearch(grid);
    const frames = createPlaybackFrames(result);

    expect(result.found).toBe(false);
    expect(frames).toEqual([
      {
        step: 1,
        current: { x: 0, y: 0 },
        visited: [{ x: 0, y: 0 }],
        pathPrefix: [],
      },
    ]);
  });
});
