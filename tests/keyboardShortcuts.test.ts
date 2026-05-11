import { describe, expect, it } from "vitest";

import {
  applyBoardShortcut,
  type KeyboardBoardState,
} from "../src/keyboardShortcuts";
import {
  createGrid,
  isWall,
  setTerrain,
  terrainAt,
  toggleWall,
} from "../src/grid";

function state(
  overrides: Partial<KeyboardBoardState> = {},
): KeyboardBoardState {
  return {
    grid: createGrid(4, 3, { x: 0, y: 1 }, { x: 3, y: 1 }),
    cursor: { x: 1, y: 1 },
    mode: "wall",
    ...overrides,
  };
}

describe("keyboard board shortcuts", () => {
  it("moves the board cursor with arrow keys within bounds", () => {
    let result = applyBoardShortcut(state({ cursor: { x: 0, y: 0 } }), {
      key: "ArrowLeft",
    });
    expect(result.handled).toBe(true);
    expect(result.state.cursor).toEqual({ x: 0, y: 0 });

    result = applyBoardShortcut(result.state, { key: "ArrowRight" });
    expect(result.state.cursor).toEqual({ x: 1, y: 0 });

    result = applyBoardShortcut(result.state, { key: "ArrowDown" });
    expect(result.state.cursor).toEqual({ x: 1, y: 1 });

    result = applyBoardShortcut(result.state, { key: "ArrowUp" });
    expect(result.state.cursor).toEqual({ x: 1, y: 0 });
  });

  it("jumps by row and board edge with navigation keys", () => {
    let result = applyBoardShortcut(state({ cursor: { x: 2, y: 1 } }), {
      key: "Home",
    });
    expect(result.state.cursor).toEqual({ x: 0, y: 1 });

    result = applyBoardShortcut(result.state, { key: "End" });
    expect(result.state.cursor).toEqual({ x: 3, y: 1 });

    result = applyBoardShortcut(result.state, { key: "PageUp" });
    expect(result.state.cursor).toEqual({ x: 3, y: 0 });

    result = applyBoardShortcut(result.state, { key: "PageDown" });
    expect(result.state.cursor).toEqual({ x: 3, y: 2 });
  });

  it("resets the cursor to the start cell on Escape", () => {
    const result = applyBoardShortcut(state({ cursor: { x: 3, y: 2 } }), {
      key: "Escape",
    });

    expect(result.handled).toBe(true);
    expect(result.state.cursor).toEqual({ x: 0, y: 1 });
  });

  it("ignores unknown keys without mutating state", () => {
    const initial = state();
    const result = applyBoardShortcut(initial, { key: "Tab" });

    expect(result).toEqual({ handled: false, state: initial });
    expect(result.state).toBe(initial);
  });

  it("toggles a wall at the cursor with Space or Enter without editing endpoints", () => {
    let result = applyBoardShortcut(state({ cursor: { x: 1, y: 0 } }), {
      key: " ",
    });
    expect(result.handled).toBe(true);
    expect(result.edited).toBe(true);
    expect(isWall(result.state.grid, { x: 1, y: 0 })).toBe(true);

    result = applyBoardShortcut(result.state, { key: "Enter" });
    expect(isWall(result.state.grid, { x: 1, y: 0 })).toBe(false);

    const onStart = state({ cursor: { x: 0, y: 1 } });
    result = applyBoardShortcut(onStart, { key: "Enter" });
    expect(result.edited).toBe(false);
    expect(result.state.grid).toBe(onStart.grid);
  });

  it("cycles terrain at the cursor without editing walls or endpoints", () => {
    let result = applyBoardShortcut(
      state({ cursor: { x: 1, y: 0 }, mode: "terrain" }),
      { key: "Enter" },
    );
    expect(result.edited).toBe(true);
    expect(terrainAt(result.state.grid, { x: 1, y: 0 })).toBe("mud");

    result = applyBoardShortcut(result.state, { key: "Enter" });
    expect(terrainAt(result.state.grid, { x: 1, y: 0 })).toBe("water");

    result = applyBoardShortcut(result.state, { key: "Enter" });
    expect(terrainAt(result.state.grid, { x: 1, y: 0 })).toBe("normal");

    const wallGrid = toggleWall(result.state.grid, { x: 2, y: 0 });
    const wallState = state({
      grid: wallGrid,
      cursor: { x: 2, y: 0 },
      mode: "terrain",
    });
    result = applyBoardShortcut(wallState, { key: "Enter" });
    expect(result.edited).toBe(false);
    expect(result.state.grid).toBe(wallGrid);

    const startState = state({ cursor: { x: 0, y: 1 }, mode: "terrain" });
    result = applyBoardShortcut(startState, { key: "Enter" });
    expect(result.edited).toBe(false);
    expect(result.state.grid).toBe(startState.grid);
  });

  it("moves start or goal at the cursor only onto open non-endpoint cells", () => {
    let result = applyBoardShortcut(
      state({ cursor: { x: 1, y: 0 }, mode: "start" }),
      { key: "Enter" },
    );
    expect(result.edited).toBe(true);
    expect(result.state.grid.start).toEqual({ x: 1, y: 0 });

    result = applyBoardShortcut(
      state({ cursor: { x: 2, y: 2 }, mode: "goal" }),
      { key: " " },
    );
    expect(result.edited).toBe(true);
    expect(result.state.grid.goal).toEqual({ x: 2, y: 2 });

    const gridWithWall = toggleWall(
      createGrid(4, 3, { x: 0, y: 1 }, { x: 3, y: 1 }),
      {
        x: 2,
        y: 0,
      },
    );
    result = applyBoardShortcut(
      state({ grid: gridWithWall, cursor: { x: 2, y: 0 }, mode: "start" }),
      { key: "Enter" },
    );
    expect(result.edited).toBe(false);
    expect(result.state.grid).toBe(gridWithWall);

    result = applyBoardShortcut(
      state({ cursor: { x: 3, y: 1 }, mode: "start" }),
      { key: "Enter" },
    );
    expect(result.edited).toBe(false);

    const weightedGrid = setTerrain(
      createGrid(4, 3, { x: 0, y: 1 }, { x: 3, y: 1 }),
      { x: 1, y: 0 },
      "mud",
    );
    result = applyBoardShortcut(
      state({ grid: weightedGrid, cursor: { x: 1, y: 0 }, mode: "goal" }),
      { key: "Enter" },
    );
    expect(result.edited).toBe(true);
    expect(terrainAt(result.state.grid, { x: 1, y: 0 })).toBe("normal");
  });
});
