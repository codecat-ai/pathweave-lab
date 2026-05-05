import {
  type Grid,
  type Point,
  createGrid,
  samePoint,
  toggleWall,
} from "./grid";

export type SampleName = "braid" | "rooms" | "corridor";

export const sampleNames: readonly SampleName[] = [
  "braid",
  "rooms",
  "corridor",
];

export function createSampleGrid(
  name: SampleName,
  width: number,
  height: number,
): Grid {
  const start = { x: 1, y: Math.floor(height / 2) };
  const goal = { x: width - 2, y: Math.floor(height / 2) };
  let grid = createGrid(width, height, start, goal);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const point = { x, y };

      if (shouldPlaceWall(name, point, width, height, start, goal)) {
        grid = toggleWall(grid, point);
      }
    }
  }

  return grid;
}

function shouldPlaceWall(
  name: SampleName,
  point: Point,
  width: number,
  height: number,
  start: Point,
  goal: Point,
): boolean {
  if (
    samePoint(point, start) ||
    samePoint(point, goal) ||
    point.y === start.y
  ) {
    return false;
  }

  if (name === "corridor") {
    return (
      point.x > 1 &&
      point.x < width - 2 &&
      point.y !== start.y &&
      point.x % 3 === 0
    );
  }

  if (name === "rooms") {
    const verticalRoomWall =
      point.x === Math.floor(width / 2) && point.y % 3 !== 1;
    const horizontalRoomWall =
      point.y === Math.floor(height / 2) && point.x % 4 === 0;
    return verticalRoomWall || horizontalRoomWall;
  }

  const hash = stableHash(`${name}:${width}:${height}:${point.x}:${point.y}`);
  return (
    hash % 5 === 0 &&
    point.x > 0 &&
    point.y > 0 &&
    point.x < width - 1 &&
    point.y < height - 1
  );
}

function stableHash(value: string): number {
  let hash = 2166136261;

  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}
