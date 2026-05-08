import type {
  BreadthFirstSearchResult,
  DijkstraSearchResult,
} from "./algorithms";
import {
  type Grid,
  type MovementMode,
  type Point,
  isWall,
  pointKey,
  samePoint,
  terrainAt,
} from "./grid";

type SearchResult = BreadthFirstSearchResult | DijkstraSearchResult;

export interface BoardSvgOptions {
  readonly grid: Grid;
  readonly result: SearchResult;
  readonly movementMode: MovementMode;
  readonly searchLabel: string;
  readonly title?: string;
  readonly searchOptions?: readonly string[];
}

const cellSize = 34;
const gap = 3;
const padding = 18;
const headerHeight = 78;
const footerHeight = 88;
const labelOffset = 22;
const legendWidth = 512;

export function createBoardSvg(options: BoardSvgOptions): string {
  const boardWidth =
    options.grid.width * cellSize + (options.grid.width - 1) * gap;
  const boardHeight =
    options.grid.height * cellSize + (options.grid.height - 1) * gap;
  const width = Math.max(boardWidth, legendWidth) + padding * 2;
  const height = headerHeight + boardHeight + footerHeight + padding;
  const boardTop = headerHeight;
  const title = options.title ?? "Pathweave Lab Board Snapshot";
  const status = options.result.found ? "Reachable" : "Unreachable";
  const metrics = [
    `Search: ${options.searchLabel}`,
    `Movement: ${movementName(options.movementMode)}`,
    `Status: ${status}`,
    `Distance: ${options.result.distance ?? "n/a"}`,
    `Cost: ${"cost" in options.result ? (options.result.cost ?? "n/a") : "unweighted"}`,
    `Visited: ${options.result.visitedOrder.length}`,
    `Walls: ${options.grid.walls.length}`,
    `Terrain: ${options.grid.terrain.length}`,
    ...(options.searchOptions ?? []),
  ];
  const pathKeys = new Set(options.result.path.map(pointKey));
  const visitedKeys = new Set(options.result.visitedOrder.map(pointKey));

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">`,
    "<style>",
    ".background{fill:#f8fafc;}",
    ".title{font:700 20px system-ui,-apple-system,Segoe UI,sans-serif;fill:#0f172a;}",
    ".meta,.legend{font:12px system-ui,-apple-system,Segoe UI,sans-serif;fill:#334155;}",
    ".cell{fill:#e2e8f0;stroke:#94a3b8;stroke-width:1;}",
    ".cell.mud{fill:#8b5e34;}",
    ".cell.water{fill:#2563eb;}",
    ".cell.wall{fill:#0f172a;stroke:#64748b;}",
    ".cell.visited{stroke:#0891b2;stroke-width:3;}",
    ".cell.path{fill:#facc15;stroke:#92400e;stroke-width:3;}",
    ".cell.start{fill:#22c55e;stroke:#166534;stroke-width:3;}",
    ".cell.goal{fill:#fb7185;stroke:#9f1239;stroke-width:3;}",
    ".label{font:700 15px system-ui,-apple-system,Segoe UI,sans-serif;text-anchor:middle;dominant-baseline:central;fill:#0f172a;}",
    ".wall-label{fill:#f8fafc;}",
    "</style>",
    `<title id="title">${escapeXml(title)}</title>`,
    `<desc id="desc">${escapeXml(`${status} ${options.searchLabel} result on a ${options.grid.width} by ${options.grid.height} grid.`)}</desc>`,
    '<rect class="background" width="100%" height="100%" rx="0"/>',
    `<text class="title" x="${padding}" y="30">${escapeXml(title)}</text>`,
    `<text class="meta" x="${padding}" y="54">${escapeXml(metrics.join(" | "))}</text>`,
    ...renderCells(options.grid, padding, boardTop, visitedKeys, pathKeys),
    ...renderLegend(padding, boardTop + boardHeight + 32),
    "</svg>",
  ].join("\n");
}

function renderCells(
  grid: Grid,
  left: number,
  top: number,
  visitedKeys: ReadonlySet<string>,
  pathKeys: ReadonlySet<string>,
): string[] {
  const lines: string[] = [];

  for (let y = 0; y < grid.height; y += 1) {
    for (let x = 0; x < grid.width; x += 1) {
      const point = { x, y };
      const key = pointKey(point);
      const cellLeft = left + x * (cellSize + gap);
      const cellTop = top + y * (cellSize + gap);
      const classes = cellClasses(
        grid,
        point,
        visitedKeys.has(key),
        pathKeys.has(key),
      );
      const label = cellLabel(grid, point, pathKeys.has(key));
      lines.push(
        `<rect data-cell="${x},${y}" class="${classes}" x="${cellLeft}" y="${cellTop}" width="${cellSize}" height="${cellSize}" rx="4"/>`,
      );

      if (label) {
        const labelClass = isWall(grid, point) ? "label wall-label" : "label";
        lines.push(
          `<text class="${labelClass}" x="${cellLeft + cellSize / 2}" y="${cellTop + labelOffset}">${escapeXml(label)}</text>`,
        );
      }
    }
  }

  return lines;
}

function cellClasses(
  grid: Grid,
  point: Point,
  isVisited: boolean,
  isPath: boolean,
): string {
  const classes = ["cell"];
  const terrain = terrainAt(grid, point);

  if (
    terrain !== "normal" &&
    !samePoint(point, grid.start) &&
    !samePoint(point, grid.goal)
  ) {
    classes.push(terrain);
  }

  if (isWall(grid, point)) classes.push("wall");
  if (samePoint(point, grid.start)) classes.push("start");
  if (samePoint(point, grid.goal)) classes.push("goal");
  if (isVisited) classes.push("visited");
  if (isPath) classes.push("path");

  return classes.join(" ");
}

function cellLabel(grid: Grid, point: Point, isPath: boolean): string {
  if (samePoint(point, grid.start)) return "S";
  if (samePoint(point, grid.goal)) return "G";
  if (isWall(grid, point)) return "#";
  if (isPath) return ".";
  if (terrainAt(grid, point) === "mud") return "M";
  if (terrainAt(grid, point) === "water") return "W";
  return "";
}

function renderLegend(left: number, top: number): string[] {
  const entries = [
    ["Normal", "cell"],
    ["Mud", "cell mud"],
    ["Water", "cell water"],
    ["Wall", "cell wall"],
    ["Visited", "cell visited"],
    ["Path", "cell path"],
    ["Start", "cell start"],
    ["Goal", "cell goal"],
  ] as const;

  return entries.flatMap(([label, classes], index) => {
    const x = left + (index % 4) * 128;
    const y = top + Math.floor(index / 4) * 28;

    return [
      `<rect class="${classes}" x="${x}" y="${y - 14}" width="18" height="18" rx="3"/>`,
      `<text class="legend" x="${x + 26}" y="${y}">${escapeXml(label)}</text>`,
    ];
  });
}

function movementName(movementMode: MovementMode): string {
  return movementMode === "diagonal"
    ? "Diagonal (8-way)"
    : "Orthogonal (4-way)";
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
