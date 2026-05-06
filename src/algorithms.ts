import {
  type Grid,
  type MovementMode,
  type Point,
  neighbors,
  pointKey,
  samePoint,
} from "./grid";

export interface BreadthFirstSearchResult {
  readonly found: boolean;
  readonly path: readonly Point[];
  readonly visitedOrder: readonly Point[];
  readonly distance: number | null;
  readonly explanation: string;
}

export interface PlaybackFrame {
  readonly step: number;
  readonly current: Point;
  readonly visited: readonly Point[];
  readonly pathPrefix: readonly Point[];
}

export function runBreadthFirstSearch(
  grid: Grid,
  movementMode: MovementMode = "orthogonal",
): BreadthFirstSearchResult {
  const queue: Point[] = [grid.start];
  const visited = new Set<string>([pointKey(grid.start)]);
  const previous = new Map<string, Point>();
  const visitedOrder: Point[] = [];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      break;
    }

    visitedOrder.push(current);

    if (samePoint(current, grid.goal)) {
      const path = reconstructPath(previous, grid.start, grid.goal);

      return {
        found: true,
        path,
        visitedOrder,
        distance: path.length - 1,
        explanation: `BFS explored ${visitedOrder.length} cells in ${movementLabel(movementMode)} layers and found a shortest path of ${path.length - 1} steps.`,
      };
    }

    for (const next of neighbors(grid, current, movementMode)) {
      const key = pointKey(next);

      if (!visited.has(key)) {
        visited.add(key);
        previous.set(key, current);
        queue.push(next);
      }
    }
  }

  return {
    found: false,
    path: [],
    visitedOrder,
    distance: null,
    explanation: `BFS explored ${visitedOrder.length} reachable cells using ${movementLabel(movementMode)} movement, but the goal is unreachable from the start.`,
  };
}

export function createPlaybackFrames(
  result: BreadthFirstSearchResult,
): PlaybackFrame[] {
  const goal = result.path.at(-1);

  return result.visitedOrder.map((current, index) => {
    const pathDiscovered = Boolean(goal && samePoint(current, goal));

    return {
      step: index + 1,
      current,
      visited: result.visitedOrder.slice(0, index + 1),
      pathPrefix: pathDiscovered ? result.path : [],
    };
  });
}

function reconstructPath(
  previous: Map<string, Point>,
  start: Point,
  goal: Point,
): Point[] {
  const path = [goal];
  let current = goal;

  while (!samePoint(current, start)) {
    const prior = previous.get(pointKey(current));

    if (!prior) {
      return [];
    }

    path.push(prior);
    current = prior;
  }

  return path.reverse();
}

function movementLabel(movementMode: MovementMode): string {
  return movementMode === "diagonal" ? "diagonal" : "orthogonal";
}
