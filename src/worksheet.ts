import type { BreadthFirstSearchResult } from "./algorithms";
import {
  type Grid,
  type MovementMode,
  type Point,
  isWall,
  samePoint,
} from "./grid";

export function createWorksheetText(
  grid: Grid,
  movementMode: MovementMode,
  result: BreadthFirstSearchResult,
): string {
  const reachableSummary = result.found
    ? `Reachable in ${result.distance ?? 0} steps`
    : "Unreachable";
  const studentTask = result.found
    ? [
        "Trace BFS from S to G. Mark cells in the order they are visited, then circle one shortest path.",
        alternateMovementPrompt(movementMode),
      ]
    : [
        "Trace BFS from S to G. Mark cells in the order they are visited, then explain why the search stops.",
        "Identify which wall or region prevents the goal from being reached.",
      ];
  const answerKey = result.found
    ? [
        `- Visited cells: ${result.visitedOrder.length}`,
        `- Shortest path length: ${result.distance ?? 0} steps`,
        `- Path: ${formatPath(result.path)}`,
        "- Observation: BFS explores by distance layers, so the first path to the goal is shortest for this movement mode.",
      ]
    : [
        `- Visited cells: ${result.visitedOrder.length}`,
        `- Explanation: BFS visited every cell reachable from the start using ${movementTerm(movementMode)} movement, but none of those cells is the goal.`,
        `- Unreached goal: ${formatPoint(grid.goal)}`,
      ];

  return [
    "# Pathweave Lab Worksheet",
    "",
    "## Board Summary",
    `- Size: ${grid.width} x ${grid.height}`,
    `- Start: ${formatPoint(grid.start)}`,
    `- Goal: ${formatPoint(grid.goal)}`,
    `- Movement: ${movementName(movementMode)}`,
    `- Walls: ${grid.walls.length}`,
    `- Reachability: ${reachableSummary}`,
    "",
    "## Student Task",
    ...studentTask,
    "",
    "## Board Legend",
    "S = start, G = goal, # = wall, . = open",
    "",
    "```",
    ...formatBoard(grid),
    "```",
    "",
    "## Answer Key",
    ...answerKey,
  ].join("\n");
}

function formatBoard(grid: Grid): string[] {
  const rows: string[] = [];

  for (let y = 0; y < grid.height; y += 1) {
    let row = "";

    for (let x = 0; x < grid.width; x += 1) {
      row += cellSymbol(grid, { x, y });
    }

    rows.push(row);
  }

  return rows;
}

function cellSymbol(grid: Grid, point: Point): string {
  if (samePoint(point, grid.start)) return "S";
  if (samePoint(point, grid.goal)) return "G";
  if (isWall(grid, point)) return "#";
  return ".";
}

function movementName(movementMode: MovementMode): string {
  return movementMode === "diagonal"
    ? "Diagonal (8-way)"
    : "Orthogonal (4-way)";
}

function movementTerm(movementMode: MovementMode): string {
  return movementMode === "diagonal" ? "diagonal" : "orthogonal";
}

function alternateMovementPrompt(movementMode: MovementMode): string {
  return movementMode === "diagonal"
    ? "Predict how the answer would change if only orthogonal movement were allowed."
    : "Predict how the answer would change if diagonal movement were allowed.";
}

function formatPath(path: readonly Point[]): string {
  return path.map(formatPoint).join(" -> ");
}

function formatPoint(point: Point): string {
  return `(${point.x}, ${point.y})`;
}
