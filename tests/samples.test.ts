import { describe, expect, it } from "vitest";
import { createSampleGrid } from "../src/samples";

describe("sample maze generation", () => {
  it("is deterministic for the same dimensions and name", () => {
    const first = createSampleGrid("braid", 12, 8);
    const second = createSampleGrid("braid", 12, 8);

    expect(second).toEqual(first);
  });

  it("keeps sample start and goal open", () => {
    const grid = createSampleGrid("rooms", 10, 7);

    expect(grid.walls).not.toContainEqual(grid.start);
    expect(grid.walls).not.toContainEqual(grid.goal);
  });
});
