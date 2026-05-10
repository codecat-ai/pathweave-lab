import { describe, expect, it, vi } from "vitest";
import { runBreadthFirstSearch } from "../src/algorithms";
import { createGrid, toggleWall } from "../src/grid";
import {
  createWorksheetPrintHtml,
  printWorksheetPreview,
  renderWorksheetPreview,
} from "../src/worksheetPrint";

describe("createWorksheetPrintHtml", () => {
  it("formats escaped printable worksheet HTML with metadata, prompts, and answer key", () => {
    let grid = createGrid(3, 3, { x: 0, y: 1 }, { x: 2, y: 1 });
    grid = toggleWall(grid, { x: 1, y: 1 });
    const result = runBreadthFirstSearch(grid, "orthogonal");

    expect(
      createWorksheetPrintHtml(grid, "orthogonal", result, {
        title: "BFS <day 1>",
        variant: "guided",
        searchLabel: "BFS & Dijkstra",
      }),
    )
      .toBe(`<article class="worksheet-print" aria-label="Printable worksheet preview">
  <header class="worksheet-print__header">
    <p class="worksheet-print__eyebrow">Pathweave Lab Worksheet</p>
    <h2>BFS &lt;day 1&gt;</h2>
  </header>
  <section class="worksheet-print__section">
    <h3>Board Metadata</h3>
    <dl class="worksheet-print__metadata">
      <div><dt>Size</dt><dd>3 x 3</dd></div>
      <div><dt>Start</dt><dd>(0, 1)</dd></div>
      <div><dt>Goal</dt><dd>(2, 1)</dd></div>
      <div><dt>Movement</dt><dd>Orthogonal (4-way)</dd></div>
      <div><dt>Search</dt><dd>BFS &amp; Dijkstra</dd></div>
      <div><dt>Worksheet</dt><dd>Guided</dd></div>
      <div><dt>Walls</dt><dd>1</dd></div>
      <div><dt>Reachability</dt><dd>Reachable in 4 steps</dd></div>
    </dl>
  </section>
  <section class="worksheet-print__section">
    <h3>Student Prompts</h3>
    <ol class="worksheet-print__prompts">
      <li>Trace BFS from S to G. Mark cells in the order they are visited, then circle one shortest path.</li>
      <li>Predict how the answer would change if diagonal movement were allowed.</li>
      <li>Before tracing, predict whether the goal is reachable and estimate the shortest path length.</li>
      <li>Circle the first three cells BFS visits after S. What do they have in common?</li>
      <li>After tracing, compare your prediction with the answer key. What changed in your reasoning?</li>
    </ol>
  </section>
  <section class="worksheet-print__section">
    <h3>Board</h3>
    <p class="worksheet-print__legend">S = start, G = goal, # = wall, . = open</p>
    <pre class="worksheet-print__board" aria-label="Worksheet board">...
S#G
...</pre>
  </section>
  <section class="worksheet-print__section worksheet-print__answer-key">
    <h3>Answer Key and Metrics</h3>
    <ul>
      <li>Visited cells: 8</li>
      <li>Shortest path length: 4 steps</li>
      <li>Path: (0, 1) -&gt; (0, 2) -&gt; (1, 2) -&gt; (2, 2) -&gt; (2, 1)</li>
      <li>Observation: BFS explores by distance layers, so the first path to the goal is shortest for this movement mode.</li>
    </ul>
  </section>
</article>`);
  });

  it("changes printable prompts when the selected worksheet variant changes", () => {
    const grid = createGrid(2, 1, { x: 0, y: 0 }, { x: 1, y: 0 });
    const result = runBreadthFirstSearch(grid, "orthogonal");

    const concise = createWorksheetPrintHtml(grid, "orthogonal", result, {
      variant: "concise",
    });
    const guided = createWorksheetPrintHtml(grid, "orthogonal", result, {
      variant: "guided",
    });

    expect(concise).toContain("<div><dt>Worksheet</dt><dd>Concise</dd></div>");
    expect(concise).not.toContain("Before tracing, predict");
    expect(guided).toContain("<div><dt>Worksheet</dt><dd>Guided</dd></div>");
    expect(guided).toContain("Before tracing, predict");
  });
});

describe("worksheet print preview UI helpers", () => {
  it("renders preview HTML into a target element", () => {
    const target = { innerHTML: "" };

    renderWorksheetPreview(target, "<article>Preview</article>");

    expect(target.innerHTML).toBe("<article>Preview</article>");
  });

  it("prints through an injected print function", () => {
    const print = vi.fn();
    const setMessage = vi.fn();

    printWorksheetPreview({
      print,
      setMessage,
      variantLabel: "Guided",
    });

    expect(print).toHaveBeenCalledOnce();
    expect(setMessage).toHaveBeenCalledWith("Guided worksheet sent to print.");
  });
});
