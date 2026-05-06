import { describe, expect, it } from "vitest";
import { parseGrid, serializeGrid, toggleWall, createGrid } from "../src/grid";
import {
  decodeBoardFromHash,
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
