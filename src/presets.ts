import {
  type Grid,
  type Point,
  type TerrainCell,
  createGrid,
  setTerrain,
  toggleWall,
} from "./grid";

export type BoardPresetName = "detour-wall" | "weighted-detour" | "no-path";

export interface BoardPreset {
  readonly name: BoardPresetName;
  readonly label: string;
  readonly description: string;
  readonly width: number;
  readonly height: number;
  readonly start: Point;
  readonly goal: Point;
  readonly walls: readonly Point[];
  readonly terrain: readonly TerrainCell[];
}

export const boardPresets = [
  {
    name: "detour-wall",
    label: "Detour wall",
    description:
      "Two staggered walls force students to trace the reachable opening before BFS finds the route.",
    width: 7,
    height: 5,
    start: { x: 0, y: 2 },
    goal: { x: 6, y: 2 },
    walls: [
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      { x: 4, y: 0 },
      { x: 4, y: 1 },
      { x: 4, y: 3 },
      { x: 4, y: 4 },
    ],
    terrain: [],
  },
  {
    name: "weighted-detour",
    label: "Weighted detour",
    description:
      "Water on the short route shows why Dijkstra may prefer a longer path with lower total cost.",
    width: 4,
    height: 2,
    start: { x: 0, y: 0 },
    goal: { x: 3, y: 0 },
    walls: [],
    terrain: [
      { x: 1, y: 0, type: "water" },
      { x: 2, y: 0, type: "water" },
    ],
  },
  {
    name: "no-path",
    label: "No path",
    description:
      "A solid barrier separates start and goal so both searches report an unreachable board.",
    width: 3,
    height: 3,
    start: { x: 0, y: 1 },
    goal: { x: 2, y: 1 },
    walls: [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
    terrain: [],
  },
] as const satisfies readonly BoardPreset[];

export const presetNames = boardPresets.map(({ name }) => name);

export function getPreset(name: string): BoardPreset | undefined {
  return boardPresets.find((preset) => preset.name === name);
}

export function applyPreset(name: BoardPresetName): Grid {
  const preset = getPreset(name);

  if (!preset) {
    throw new Error(`Unknown board preset: ${name}`);
  }

  let grid = createGrid(
    preset.width,
    preset.height,
    clonePoint(preset.start),
    clonePoint(preset.goal),
  );

  for (const wall of preset.walls) {
    grid = toggleWall(grid, clonePoint(wall));
  }

  for (const cell of preset.terrain) {
    grid = setTerrain(grid, clonePoint(cell), cell.type);
  }

  return grid;
}

function clonePoint<T extends Point>(point: T): T {
  return { ...point };
}
