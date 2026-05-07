import {
  type Grid,
  type MovementMode,
  type Point,
  neighbors,
  pointKey,
  samePoint,
  terrainCost,
} from "./grid";

export interface BreadthFirstSearchResult {
  readonly found: boolean;
  readonly path: readonly Point[];
  readonly visitedOrder: readonly Point[];
  readonly distance: number | null;
  readonly explanation: string;
}

export interface DijkstraSearchResult extends BreadthFirstSearchResult {
  readonly cost: number | null;
}

export interface PathfindingComparison {
  readonly bfs: BreadthFirstSearchResult;
  readonly dijkstra: DijkstraSearchResult;
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

export function runDijkstraSearch(
  grid: Grid,
  movementMode: MovementMode = "orthogonal",
): DijkstraSearchResult {
  const unsettled = new Set<string>([pointKey(grid.start)]);
  const visited = new Set<string>();
  const costs = new Map<string, number>([[pointKey(grid.start), 0]]);
  const points = new Map<string, Point>([[pointKey(grid.start), grid.start]]);
  const previous = new Map<string, Point>();
  const visitedOrder: Point[] = [];

  while (unsettled.size > 0) {
    const current = lowestCostPoint(unsettled, costs, points);

    if (!current) {
      break;
    }

    const currentKey = pointKey(current);
    unsettled.delete(currentKey);

    if (visited.has(currentKey)) {
      continue;
    }

    visited.add(currentKey);
    visitedOrder.push(current);

    if (samePoint(current, grid.goal)) {
      const path = reconstructPath(previous, grid.start, grid.goal);
      const cost = costs.get(currentKey) ?? 0;

      return {
        found: true,
        path,
        visitedOrder,
        distance: path.length - 1,
        cost,
        explanation: `Dijkstra explored ${visitedOrder.length} cells in ${movementLabel(movementMode)} order and found a lowest weighted cost of ${cost} over ${path.length - 1} steps.`,
      };
    }

    for (const next of neighbors(grid, current, movementMode)) {
      const nextKey = pointKey(next);

      if (visited.has(nextKey)) {
        continue;
      }

      const candidateCost =
        (costs.get(currentKey) ?? 0) + terrainCost(grid, next);
      const knownCost = costs.get(nextKey);

      if (knownCost === undefined || candidateCost < knownCost) {
        costs.set(nextKey, candidateCost);
        points.set(nextKey, next);
        previous.set(nextKey, current);
        unsettled.add(nextKey);
      }
    }
  }

  return {
    found: false,
    path: [],
    visitedOrder,
    distance: null,
    cost: null,
    explanation: `Dijkstra explored ${visitedOrder.length} reachable cells using ${movementLabel(movementMode)} movement, but the goal is unreachable from the start.`,
  };
}

export function comparePathfinding(
  grid: Grid,
  movementMode: MovementMode = "orthogonal",
): PathfindingComparison {
  const bfs = runBreadthFirstSearch(grid, movementMode);
  const dijkstra = runDijkstraSearch(grid, movementMode);

  return {
    bfs,
    dijkstra,
    explanation: comparisonExplanation(bfs, dijkstra),
  };
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

function lowestCostPoint(
  unsettled: Set<string>,
  costs: Map<string, number>,
  points: Map<string, Point>,
): Point | undefined {
  let bestKey: string | undefined;
  let bestCost = Number.POSITIVE_INFINITY;

  for (const key of unsettled) {
    const cost = costs.get(key) ?? Number.POSITIVE_INFINITY;

    if (cost < bestCost) {
      bestKey = key;
      bestCost = cost;
    }
  }

  return bestKey ? points.get(bestKey) : undefined;
}

function comparisonExplanation(
  bfs: BreadthFirstSearchResult,
  dijkstra: DijkstraSearchResult,
): string {
  if (!bfs.found && !dijkstra.found) {
    return "BFS and Dijkstra both report that the goal is unreachable.";
  }

  if (!bfs.found || !dijkstra.found) {
    return "BFS and Dijkstra disagree on reachability, which usually means the board rules need attention.";
  }

  return `BFS reaches the goal in ${bfs.distance ?? 0} steps because it treats every open cell the same. Dijkstra chooses a route with weighted cost ${dijkstra.cost ?? 0}, so it may take more steps to avoid expensive weighted terrain.`;
}
