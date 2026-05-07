import { describe, expect, it } from "vitest";
import {
  createGrid,
  parseGrid,
  serializeGrid,
  setTerrain,
  toggleWall,
} from "../src/grid";
import {
  decodeAppStateFromHash,
  decodeBoardFromHash,
  encodeAppState,
  encodeBoard,
  parseBoardHash,
} from "../src/shareUrl";

describe("share URL board encoding", () => {
  it("round-trips a custom grid through a URL-safe payload", () => {
    let grid = createGrid(6, 5, { x: 1, y: 2 }, { x: 5, y: 4 });
    grid = toggleWall(grid, { x: 2, y: 2 });
    grid = toggleWall(grid, { x: 3, y: 2 });
    grid = toggleWall(grid, { x: 3, y: 3 });

    const encoded = encodeBoard(grid);

    expect(parseGrid(decodeBoardFromHash(`#board=${encoded}`))).toEqual(grid);
  });

  it("round-trips movement mode with shared app state", () => {
    let grid = createGrid(6, 5, { x: 1, y: 2 }, { x: 5, y: 4 });
    grid = toggleWall(grid, { x: 2, y: 2 });

    const encoded = encodeAppState({ grid, movementMode: "diagonal" });

    expect(decodeAppStateFromHash(`#board=${encoded}`)).toEqual({
      grid,
      movementMode: "diagonal",
    });
  });

  it("round-trips weighted terrain with shared app state", () => {
    let grid = createGrid(4, 2, { x: 0, y: 0 }, { x: 3, y: 0 });
    grid = setTerrain(grid, { x: 1, y: 0 }, "mud");
    grid = setTerrain(grid, { x: 2, y: 0 }, "water");

    const encoded = encodeAppState({ grid, movementMode: "orthogonal" });

    expect(decodeAppStateFromHash(`#board=${encoded}`)).toEqual({
      grid,
      movementMode: "orthogonal",
    });
  });

  it("defaults old board-only share URLs to orthogonal movement", () => {
    const grid = createGrid(4, 4, { x: 0, y: 0 }, { x: 3, y: 3 });
    const encoded = encodeBoard(grid);

    expect(decodeAppStateFromHash(`#board=${encoded}`)).toEqual({
      grid,
      movementMode: "orthogonal",
    });
  });

  it("keeps the encoded payload safe for standard URL hashes", () => {
    const grid = toggleWall(createGrid(4, 4, { x: 0, y: 0 }, { x: 3, y: 3 }), {
      x: 1,
      y: 2,
    });

    const encoded = encodeBoard(grid);

    expect(encoded).not.toMatch(/[{}[\]:,\s"'/]/);
    expect(encoded).not.toContain(serializeGrid(grid));
  });

  it("ignores unrelated hash fragments", () => {
    expect(parseBoardHash("#section=intro")).toBeNull();
    expect(parseBoardHash("#foo=bar&view=grid")).toBeNull();
  });

  it("throws clear errors for malformed board payloads", () => {
    expect(() => decodeBoardFromHash("#board=")).toThrow(/share URL payload/i);
    expect(() => decodeBoardFromHash("#board=not*url*safe")).toThrow(
      /share URL payload/i,
    );
    expect(() => decodeBoardFromHash("#board=e30")).toThrow(
      /Board dimensions must be integers/,
    );
  });
});
