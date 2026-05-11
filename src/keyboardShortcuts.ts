import {
  type Grid,
  type Point,
  type TerrainType,
  isWall,
  samePoint,
  setTerrain,
  terrainAt,
  toggleWall,
} from "./grid";

export type BoardEditMode = "wall" | "terrain" | "start" | "goal";

export interface KeyboardBoardState {
  readonly grid: Grid;
  readonly cursor: Point;
  readonly mode: BoardEditMode;
}

export interface BoardShortcutInput {
  readonly key: string;
}

export interface BoardShortcutResult {
  readonly handled: boolean;
  readonly edited?: boolean;
  readonly state: KeyboardBoardState;
}

export function applyBoardShortcut(
  state: KeyboardBoardState,
  input: BoardShortcutInput,
): BoardShortcutResult {
  const cursor = nextCursor(state, input.key);

  if (cursor) {
    return {
      handled: true,
      edited: false,
      state: samePoint(cursor, state.cursor) ? state : { ...state, cursor },
    };
  }

  if (input.key === "Enter" || input.key === " ") {
    const grid = applyBoardEdit(state.grid, state.cursor, state.mode);

    return {
      handled: true,
      edited: grid !== state.grid,
      state: grid === state.grid ? state : { ...state, grid },
    };
  }

  return { handled: false, state };
}

export function applyBoardEdit(
  grid: Grid,
  point: Point,
  mode: BoardEditMode,
): Grid {
  if (mode === "wall") {
    return toggleWall(grid, point);
  }

  if (mode === "terrain") {
    return setTerrain(grid, point, nextTerrain(terrainAt(grid, point)));
  }

  if (mode === "start") {
    if (
      samePoint(point, grid.start) ||
      samePoint(point, grid.goal) ||
      isWall(grid, point)
    ) {
      return grid;
    }

    return {
      ...grid,
      start: point,
      terrain: grid.terrain.filter((cell) => !samePoint(cell, point)),
    };
  }

  if (
    samePoint(point, grid.start) ||
    samePoint(point, grid.goal) ||
    isWall(grid, point)
  ) {
    return grid;
  }

  return {
    ...grid,
    goal: point,
    terrain: grid.terrain.filter((cell) => !samePoint(cell, point)),
  };
}

function nextCursor(
  { grid, cursor }: KeyboardBoardState,
  key: string,
): Point | undefined {
  if (key === "ArrowLeft") {
    return { ...cursor, x: Math.max(0, cursor.x - 1) };
  }

  if (key === "ArrowRight") {
    return { ...cursor, x: Math.min(grid.width - 1, cursor.x + 1) };
  }

  if (key === "ArrowUp") {
    return { ...cursor, y: Math.max(0, cursor.y - 1) };
  }

  if (key === "ArrowDown") {
    return { ...cursor, y: Math.min(grid.height - 1, cursor.y + 1) };
  }

  if (key === "Home") {
    return { ...cursor, x: 0 };
  }

  if (key === "End") {
    return { ...cursor, x: grid.width - 1 };
  }

  if (key === "PageUp") {
    return { ...cursor, y: 0 };
  }

  if (key === "PageDown") {
    return { ...cursor, y: grid.height - 1 };
  }

  if (key === "Escape") {
    return grid.start;
  }

  return undefined;
}

function nextTerrain(type: TerrainType): TerrainType {
  if (type === "normal") return "mud";
  if (type === "mud") return "water";
  return "normal";
}
