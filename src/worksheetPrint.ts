import type {
  BreadthFirstSearchResult,
  DijkstraSearchResult,
} from "./algorithms";
import {
  type Grid,
  type MovementMode,
  type Point,
  isWall,
  samePoint,
} from "./grid";
import { worksheetVariants, type WorksheetVariant } from "./worksheet";

type SearchResult = BreadthFirstSearchResult | DijkstraSearchResult;

export interface WorksheetPrintOptions {
  title?: string;
  variant?: WorksheetVariant;
  searchLabel?: string;
}

export interface WorksheetPrintAction {
  print: () => void;
  setMessage: (message: string) => void;
  variantLabel: string;
}

export interface PreviewTarget {
  innerHTML: string;
}

export function createWorksheetPrintHtml(
  grid: Grid,
  movementMode: MovementMode,
  result: SearchResult,
  options: WorksheetPrintOptions = {},
): string {
  const variant = options.variant ?? "concise";
  const variantLabel = worksheetVariantLabel(variant);
  const title = options.title ?? "Pathweave Lab Worksheet";
  const searchLabel = options.searchLabel ?? "BFS";
  const reachableSummary = result.found
    ? `Reachable in ${result.distance ?? 0} steps`
    : "Unreachable";

  return [
    `<article class="worksheet-print" aria-label="Printable worksheet preview">`,
    `  <header class="worksheet-print__header">`,
    `    <p class="worksheet-print__eyebrow">Pathweave Lab Worksheet</p>`,
    `    <h2>${escapeHtml(title)}</h2>`,
    `  </header>`,
    `  <section class="worksheet-print__section">`,
    `    <h3>Board Metadata</h3>`,
    `    <dl class="worksheet-print__metadata">`,
    ...metadataRows([
      ["Size", `${grid.width} x ${grid.height}`],
      ["Start", formatPoint(grid.start)],
      ["Goal", formatPoint(grid.goal)],
      ["Movement", movementName(movementMode)],
      ["Search", searchLabel],
      ["Worksheet", variantLabel],
      ["Walls", String(grid.walls.length)],
      ["Reachability", reachableSummary],
    ]),
    `    </dl>`,
    `  </section>`,
    `  <section class="worksheet-print__section">`,
    `    <h3>Student Prompts</h3>`,
    `    <ol class="worksheet-print__prompts">`,
    ...studentPrompts(result, movementMode, variant).map(
      (prompt) => `      <li>${escapeHtml(prompt)}</li>`,
    ),
    `    </ol>`,
    `  </section>`,
    `  <section class="worksheet-print__section">`,
    `    <h3>Board</h3>`,
    `    <p class="worksheet-print__legend">S = start, G = goal, # = wall, . = open</p>`,
    `    <pre class="worksheet-print__board" aria-label="Worksheet board">${escapeHtml(formatBoard(grid).join("\n"))}</pre>`,
    `  </section>`,
    `  <section class="worksheet-print__section worksheet-print__answer-key">`,
    `    <h3>Answer Key and Metrics</h3>`,
    `    <ul>`,
    ...answerKeyItems(grid, movementMode, result).map(
      (item) => `      <li>${escapeHtml(item)}</li>`,
    ),
    `    </ul>`,
    `  </section>`,
    `</article>`,
  ].join("\n");
}

export function renderWorksheetPreview(
  target: PreviewTarget,
  html: string,
): void {
  target.innerHTML = html;
}

export function printWorksheetPreview({
  print,
  setMessage,
  variantLabel,
}: WorksheetPrintAction): void {
  print();
  setMessage(`${variantLabel} worksheet sent to print.`);
}

function metadataRows(
  rows: ReadonlyArray<readonly [string, string]>,
): string[] {
  return rows.map(
    ([term, description]) =>
      `      <div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(description)}</dd></div>`,
  );
}

function studentPrompts(
  result: SearchResult,
  movementMode: MovementMode,
  variant: WorksheetVariant,
): string[] {
  const prompts = result.found
    ? [
        "Trace BFS from S to G. Mark cells in the order they are visited, then circle one shortest path.",
        alternateMovementPrompt(movementMode),
      ]
    : [
        "Trace BFS from S to G. Mark cells in the order they are visited, then explain why the search stops.",
        "Identify which wall or region prevents the goal from being reached.",
      ];

  if (variant === "concise") {
    return prompts;
  }

  return [
    ...prompts,
    "Before tracing, predict whether the goal is reachable and estimate the shortest path length.",
    "Circle the first three cells BFS visits after S. What do they have in common?",
    "After tracing, compare your prediction with the answer key. What changed in your reasoning?",
  ];
}

function answerKeyItems(
  grid: Grid,
  movementMode: MovementMode,
  result: SearchResult,
): string[] {
  if (result.found) {
    return [
      `Visited cells: ${result.visitedOrder.length}`,
      `Shortest path length: ${result.distance ?? 0} steps`,
      ...costItem(result),
      `Path: ${formatPath(result.path)}`,
      "Observation: BFS explores by distance layers, so the first path to the goal is shortest for this movement mode.",
    ];
  }

  return [
    `Visited cells: ${result.visitedOrder.length}`,
    ...costItem(result),
    `Explanation: BFS visited every cell reachable from the start using ${movementTerm(movementMode)} movement, but none of those cells is the goal.`,
    `Unreached goal: ${formatPoint(grid.goal)}`,
  ];
}

function costItem(result: SearchResult): string[] {
  if (!("cost" in result)) {
    return [];
  }

  return [`Weighted cost: ${result.cost ?? "unreachable"}`];
}

function formatBoard(grid: Grid): string[] {
  const rows: string[] = [];

  for (let y = 0; y < grid.height; y += 1) {
    let row = "";

    for (let x = 0; x < grid.width; x += 1) {
      row += cellSymbol(grid, { x, y });
    }

    rows.push(row);
  }

  return rows;
}

function cellSymbol(grid: Grid, point: Point): string {
  if (samePoint(point, grid.start)) return "S";
  if (samePoint(point, grid.goal)) return "G";
  if (isWall(grid, point)) return "#";
  return ".";
}

function movementName(movementMode: MovementMode): string {
  return movementMode === "diagonal"
    ? "Diagonal (8-way)"
    : "Orthogonal (4-way)";
}

function movementTerm(movementMode: MovementMode): string {
  return movementMode === "diagonal" ? "diagonal" : "orthogonal";
}

function alternateMovementPrompt(movementMode: MovementMode): string {
  return movementMode === "diagonal"
    ? "Predict how the answer would change if only orthogonal movement were allowed."
    : "Predict how the answer would change if diagonal movement were allowed.";
}

function worksheetVariantLabel(variant: WorksheetVariant): string {
  return (
    worksheetVariants.find(({ value }) => value === variant)?.label ?? "Concise"
  );
}

function formatPath(path: readonly Point[]): string {
  return path.map(formatPoint).join(" -> ");
}

function formatPoint(point: Point): string {
  return `(${point.x}, ${point.y})`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
