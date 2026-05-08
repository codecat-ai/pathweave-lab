import { describe, expect, it } from "vitest";
import { runBreadthFirstSearch, runDijkstraSearch } from "../src/algorithms";
import { createGrid, setTerrain, toggleWall } from "../src/grid";
import { createBoardSvg } from "../src/svgExport";

describe("createBoardSvg", () => {
  it("escapes title and labels inserted into the SVG", () => {
    const grid = createGrid(2, 1, { x: 0, y: 0 }, { x: 1, y: 0 });
    const result = runBreadthFirstSearch(grid);

    const svg = createBoardSvg({
      grid,
      result,
      movementMode: "orthogonal",
      searchLabel: `BFS <script>alert("x")</script> & "quoted"`,
      title: `Pathweave <Lab> & "Class"`,
    });

    expect(svg).toContain("Pathweave &lt;Lab&gt; &amp; &quot;Class&quot;");
    expect(svg).toContain(
      "BFS &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &quot;quoted&quot;",
    );
    expect(svg).not.toContain("<script>");
  });

  it("renders an unreachable board without a final path", () => {
    let grid = createGrid(3, 1, { x: 0, y: 0 }, { x: 2, y: 0 });
    grid = toggleWall(grid, { x: 1, y: 0 });
    const result = runBreadthFirstSearch(grid);

    const svg = createBoardSvg({
      grid,
      result,
      movementMode: "orthogonal",
      searchLabel: "BFS",
    });

    expect(svg).toContain("Unreachable");
    expect(svg).toContain('data-cell="1,0" class="cell wall"');
    expect(svg).toContain('data-cell="0,0" class="cell start visited"');
    expect(svg).not.toMatch(/data-cell="[^"]+" class="[^"]* path/);
    expect(svg).not.toContain('class="path');
  });

  it("uses distinct classes and colors for weighted terrain", () => {
    let grid = createGrid(4, 2, { x: 0, y: 0 }, { x: 3, y: 0 });
    grid = setTerrain(grid, { x: 1, y: 0 }, "mud");
    grid = setTerrain(grid, { x: 2, y: 0 }, "water");
    const result = runDijkstraSearch(grid);

    const svg = createBoardSvg({
      grid,
      result,
      movementMode: "orthogonal",
      searchLabel: "Dijkstra",
    });

    expect(svg).toContain('class="cell mud');
    expect(svg).toContain('class="cell water');
    expect(svg).toContain(".cell.mud{fill:#8b5e34;}");
    expect(svg).toContain(".cell.water{fill:#2563eb;}");
    expect(svg).toContain("Mud");
    expect(svg).toContain("Water");
  });

  it("returns deterministic output for the same input", () => {
    let grid = createGrid(4, 2, { x: 0, y: 0 }, { x: 3, y: 1 });
    grid = toggleWall(grid, { x: 1, y: 0 });
    grid = setTerrain(grid, { x: 2, y: 1 }, "mud");
    const result = runBreadthFirstSearch(grid, "diagonal");
    const options = {
      grid,
      result,
      movementMode: "diagonal" as const,
      searchLabel: "BFS",
      title: "Repeatable board",
    };

    expect(createBoardSvg(options)).toBe(createBoardSvg(options));
  });
});
