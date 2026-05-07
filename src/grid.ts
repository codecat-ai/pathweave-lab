export interface Point {
  readonly x: number;
  readonly y: number;
}

export type MovementMode = "orthogonal" | "diagonal";
export type TerrainType = "normal" | "mud" | "water";

export interface TerrainCell extends Point {
  readonly type: TerrainType;
}

export interface Grid {
  readonly width: number;
  readonly height: number;
  readonly start: Point;
  readonly goal: Point;
  readonly walls: readonly Point[];
  readonly terrain: readonly TerrainCell[];
}

interface SerializedGrid {
  readonly width: unknown;
  readonly height: unknown;
  readonly start: unknown;
  readonly goal: unknown;
  readonly walls: unknown;
  readonly terrain?: unknown;
}

export function createGrid(
  width: number,
  height: number,
  start: Point,
  goal: Point,
): Grid {
  if (!Number.isInteger(width) || width < 2) {
    throw new Error("Grid width must be an integer of at least 2.");
  }

  if (!Number.isInteger(height) || height < 1) {
    throw new Error("Grid height must be an integer of at least 1.");
  }

  const grid = { width, height, start, goal, walls: [], terrain: [] };
  assertPointInBounds(grid, start, "start");
  assertPointInBounds(grid, goal, "goal");

  if (samePoint(start, goal)) {
    throw new Error("Start and goal must be different cells.");
  }

  return grid;
}

export function toggleWall(grid: Grid, point: Point): Grid {
  assertPointInBounds(grid, point, "wall");

  if (samePoint(point, grid.start) || samePoint(point, grid.goal)) {
    return grid;
  }

  const exists = grid.walls.some((wall) => samePoint(wall, point));
  const walls = exists
    ? grid.walls.filter((wall) => !samePoint(wall, point))
    : [...grid.walls, normalizePoint(point)];
  const terrain = exists
    ? grid.terrain
    : grid.terrain.filter((cell) => !samePoint(cell, point));

  return {
    ...grid,
    walls: sortPoints(uniquePoints(walls)),
    terrain: sortTerrain(terrain),
  };
}

export function setTerrain(grid: Grid, point: Point, type: TerrainType): Grid {
  assertPointInBounds(grid, point, "terrain");

  if (
    samePoint(point, grid.start) ||
    samePoint(point, grid.goal) ||
    isWall(grid, point)
  ) {
    return grid;
  }

  const terrain = grid.terrain.filter((cell) => !samePoint(cell, point));

  if (type !== "normal") {
    terrain.push({ ...normalizePoint(point), type });
  }

  return { ...grid, terrain: sortTerrain(terrain) };
}

export function terrainAt(grid: Grid, point: Point): TerrainType {
  return grid.terrain.find((cell) => samePoint(cell, point))?.type ?? "normal";
}

export function terrainCost(grid: Grid, point: Point): number {
  const type = terrainAt(grid, point);

  if (type === "water") return 5;
  if (type === "mud") return 3;
  return 1;
}

export function serializeGrid(grid: Grid): string {
  validateGrid(grid);
  return JSON.stringify(
    {
      width: grid.width,
      height: grid.height,
      start: grid.start,
      goal: grid.goal,
      walls: sortPoints(uniquePoints(grid.walls)),
      terrain: sortTerrain(grid.terrain),
    },
    null,
    2,
  );
}

export function parseGrid(json: string): Grid {
  let raw: SerializedGrid;

  try {
    raw = JSON.parse(json) as SerializedGrid;
  } catch {
    throw new Error("Board state must be valid JSON.");
  }

  if (!isRecord(raw)) {
    throw new Error("Board state must be a JSON object.");
  }

  if (!Number.isInteger(raw.width) || !Number.isInteger(raw.height)) {
    throw new Error("Board dimensions must be integers.");
  }

  const width = raw.width as number;
  const height = raw.height as number;
  const start = parsePoint(raw.start, "start");
  const goal = parsePoint(raw.goal, "goal");
  const grid = createGrid(width, height, start, goal);

  if (!Array.isArray(raw.walls)) {
    throw new Error("Board walls must be an array.");
  }

  const walls = raw.walls.map((wall, index) =>
    parsePoint(wall, `wall ${index + 1}`),
  );
  const terrain = Array.isArray(raw.terrain)
    ? raw.terrain.map((cell, index) =>
        parseTerrainCell(cell, `terrain ${index + 1}`),
      )
    : [];
  const parsedGrid = {
    ...grid,
    walls: sortPoints(uniquePoints(walls)),
    terrain: sortTerrain(uniqueTerrain(terrain)),
  };
  validateGrid(parsedGrid);

  return parsedGrid;
}

export function pointKey(point: Point): string {
  return `${point.x},${point.y}`;
}

export function samePoint(left: Point, right: Point): boolean {
  return left.x === right.x && left.y === right.y;
}

export function isWall(grid: Grid, point: Point): boolean {
  return grid.walls.some((wall) => samePoint(wall, point));
}

export function neighbors(
  grid: Grid,
  point: Point,
  movementMode: MovementMode = "orthogonal",
): Point[] {
  const orthogonalCandidates = [
    { x: point.x + 1, y: point.y },
    { x: point.x, y: point.y + 1 },
    { x: point.x - 1, y: point.y },
    { x: point.x, y: point.y - 1 },
  ];

  const candidates =
    movementMode === "diagonal"
      ? [
          ...orthogonalCandidates,
          { x: point.x + 1, y: point.y + 1 },
          { x: point.x - 1, y: point.y + 1 },
          { x: point.x - 1, y: point.y - 1 },
          { x: point.x + 1, y: point.y - 1 },
        ]
      : orthogonalCandidates;

  return candidates.filter((candidate) =>
    isPassableNeighbor(grid, point, candidate, movementMode),
  );
}

export function isPointInBounds(
  grid: Pick<Grid, "width" | "height">,
  point: Point,
): boolean {
  return (
    Number.isInteger(point.x) &&
    Number.isInteger(point.y) &&
    point.x >= 0 &&
    point.y >= 0 &&
    point.x < grid.width &&
    point.y < grid.height
  );
}

function validateGrid(grid: Grid): void {
  createGrid(grid.width, grid.height, grid.start, grid.goal);

  for (const wall of grid.walls) {
    assertPointInBounds(grid, wall, "wall");

    if (samePoint(wall, grid.start) || samePoint(wall, grid.goal)) {
      throw new Error("Start and goal cells cannot be walls.");
    }
  }

  for (const cell of grid.terrain) {
    assertPointInBounds(grid, cell, "terrain");

    if (samePoint(cell, grid.start) || samePoint(cell, grid.goal)) {
      throw new Error("Start and goal cells cannot have weighted terrain.");
    }

    if (isWall(grid, cell)) {
      throw new Error("Wall cells cannot have weighted terrain.");
    }
  }
}

function assertPointInBounds(
  grid: Pick<Grid, "width" | "height">,
  point: Point,
  label: string,
): void {
  if (!isPointInBounds(grid, point)) {
    throw new Error(`The ${label} point must be inside the grid.`);
  }
}

function parsePoint(value: unknown, label: string): Point {
  if (
    !isRecord(value) ||
    !Number.isInteger(value.x) ||
    !Number.isInteger(value.y)
  ) {
    throw new Error(`The ${label} point must include integer x and y values.`);
  }

  const x = value.x as number;
  const y = value.y as number;
  return { x, y };
}

function parseTerrainCell(value: unknown, label: string): TerrainCell {
  const point = parsePoint(value, label);

  if (!isRecord(value) || !isTerrainType(value.type)) {
    throw new Error(
      `The ${label} cell must include a terrain type of normal, mud, or water.`,
    );
  }

  return { ...point, type: value.type };
}

function isTerrainType(value: unknown): value is TerrainType {
  return value === "normal" || value === "mud" || value === "water";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizePoint(point: Point): Point {
  return { x: point.x, y: point.y };
}

function uniquePoints(points: readonly Point[]): Point[] {
  const seen = new Set<string>();
  const unique: Point[] = [];

  for (const point of points) {
    const key = pointKey(point);

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(normalizePoint(point));
    }
  }

  return unique;
}

function sortPoints(points: readonly Point[]): Point[] {
  return [...points].sort(
    (left, right) => left.y - right.y || left.x - right.x,
  );
}

function uniqueTerrain(terrain: readonly TerrainCell[]): TerrainCell[] {
  const byKey = new Map<string, TerrainCell>();

  for (const cell of terrain) {
    if (cell.type !== "normal") {
      byKey.set(pointKey(cell), {
        x: cell.x,
        y: cell.y,
        type: cell.type,
      });
    }
  }

  return [...byKey.values()];
}

function sortTerrain(terrain: readonly TerrainCell[]): TerrainCell[] {
  return uniqueTerrain(terrain).sort(
    (left, right) => left.y - right.y || left.x - right.x,
  );
}

function isPassableNeighbor(
  grid: Grid,
  from: Point,
  to: Point,
  movementMode: MovementMode,
): boolean {
  if (!isPointInBounds(grid, to) || isWall(grid, to)) {
    return false;
  }

  const isDiagonal = from.x !== to.x && from.y !== to.y;

  if (movementMode !== "diagonal" || !isDiagonal) {
    return true;
  }

  const horizontalSide = { x: to.x, y: from.y };
  const verticalSide = { x: from.x, y: to.y };

  return !isWall(grid, horizontalSide) || !isWall(grid, verticalSide);
}
