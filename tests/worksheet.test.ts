import { describe, expect, it } from "vitest";
import { runBreadthFirstSearch } from "../src/algorithms";
import { createGrid, toggleWall } from "../src/grid";
import { createWorksheetText } from "../src/worksheet";

describe("createWorksheetText", () => {
  it("formats a reachable board with prompts and an answer key", () => {
    let grid = createGrid(3, 3, { x: 0, y: 1 }, { x: 2, y: 1 });
    grid = toggleWall(grid, { x: 1, y: 1 });
    const result = runBreadthFirstSearch(grid, "orthogonal");

    expect(createWorksheetText(grid, "orthogonal", result))
      .toBe(`# Pathweave Lab Worksheet

## Board Summary
- Size: 3 x 3
- Start: (0, 1)
- Goal: (2, 1)
- Movement: Orthogonal (4-way)
- Walls: 1
- Reachability: Reachable in 4 steps

## Student Task
Trace BFS from S to G. Mark cells in the order they are visited, then circle one shortest path.
Predict how the answer would change if diagonal movement were allowed.

## Board Legend
S = start, G = goal, # = wall, . = open

\`\`\`
...
S#G
...
\`\`\`

## Answer Key
- Visited cells: 8
- Shortest path length: 4 steps
- Path: (0, 1) -> (0, 2) -> (1, 2) -> (2, 2) -> (2, 1)
- Observation: BFS explores by distance layers, so the first path to the goal is shortest for this movement mode.`);
  });

  it("formats an unreachable board with an unreachable explanation", () => {
    let grid = createGrid(3, 1, { x: 0, y: 0 }, { x: 2, y: 0 });
    grid = toggleWall(grid, { x: 1, y: 0 });
    const result = runBreadthFirstSearch(grid, "diagonal");

    expect(createWorksheetText(grid, "diagonal", result))
      .toBe(`# Pathweave Lab Worksheet

## Board Summary
- Size: 3 x 1
- Start: (0, 0)
- Goal: (2, 0)
- Movement: Diagonal (8-way)
- Walls: 1
- Reachability: Unreachable

## Student Task
Trace BFS from S to G. Mark cells in the order they are visited, then explain why the search stops.
Identify which wall or region prevents the goal from being reached.

## Board Legend
S = start, G = goal, # = wall, . = open

\`\`\`
S#G
\`\`\`

## Answer Key
- Visited cells: 1
- Explanation: BFS visited every cell reachable from the start using diagonal movement, but none of those cells is the goal.
- Unreached goal: (2, 0)`);
  });
});
