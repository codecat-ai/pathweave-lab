import { runBreadthFirstSearch } from "./algorithms";
import {
  type Point,
  isWall,
  parseGrid,
  serializeGrid,
  toggleWall,
} from "./grid";
import { type SampleName, createSampleGrid, sampleNames } from "./samples";
import "./style.css";

const width = 16;
const height = 10;
let mode: "wall" | "start" | "goal" = "wall";
let grid = createSampleGrid("braid", width, height);
let latestResult = runBreadthFirstSearch(grid);

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Application root not found.");

app.innerHTML = `
  <section class="hero">
    <p class="eyebrow">Local-first pathfinding playground</p>
    <h1>Pathweave Lab</h1>
    <p>Sketch walls, move endpoints, and watch breadth-first search weave the shortest route through a grid.</p>
  </section>
  <section class="workspace">
    <aside class="panel controls" aria-label="Controls">
      <h2>Controls</h2>
      <label>Paint mode
        <select id="mode">
          <option value="wall">Toggle walls</option>
          <option value="start">Move start</option>
          <option value="goal">Move goal</option>
        </select>
      </label>
      <label>Sample board
        <select id="sample"></select>
      </label>
      <button id="run">Run BFS</button>
      <button id="clear">Clear walls</button>
      <button id="reset">Reset sample</button>
    </aside>
    <section class="board-card">
      <div id="grid" class="grid" role="grid" aria-label="Pathfinding board"></div>
    </section>
    <aside class="panel" aria-label="Result details">
      <h2>Result</h2>
      <dl id="metrics"></dl>
      <p id="explanation"></p>
    </aside>
  </section>
  <section class="panel share">
    <h2>Share board JSON</h2>
    <textarea id="state" spellcheck="false"></textarea>
    <div class="row">
      <button id="export">Export current board</button>
      <button id="import">Import board</button>
    </div>
    <p id="message" role="status"></p>
  </section>
`;

const gridElement = mustFind<HTMLDivElement>("#grid");
const metricsElement = mustFind<HTMLElement>("#metrics");
const explanationElement = mustFind<HTMLElement>("#explanation");
const stateElement = mustFind<HTMLTextAreaElement>("#state");
const messageElement = mustFind<HTMLElement>("#message");
const modeElement = mustFind<HTMLSelectElement>("#mode");
const sampleElement = mustFind<HTMLSelectElement>("#sample");

sampleElement.innerHTML = sampleNames
  .map((name) => `<option value="${name}">${labelSample(name)}</option>`)
  .join("");

modeElement.addEventListener("change", () => {
  mode = modeElement.value as typeof mode;
});

sampleElement.addEventListener("change", () => {
  grid = createSampleGrid(sampleElement.value as SampleName, width, height);
  recompute();
});

mustFind<HTMLButtonElement>("#run").addEventListener("click", recompute);
mustFind<HTMLButtonElement>("#clear").addEventListener("click", () => {
  grid = { ...grid, walls: [] };
  recompute();
});
mustFind<HTMLButtonElement>("#reset").addEventListener("click", () => {
  grid = createSampleGrid(sampleElement.value as SampleName, width, height);
  recompute();
});
mustFind<HTMLButtonElement>("#export").addEventListener("click", () => {
  stateElement.value = serializeGrid(grid);
  setMessage("Board exported as JSON.");
});
mustFind<HTMLButtonElement>("#import").addEventListener("click", () => {
  try {
    grid = parseGrid(stateElement.value);
    recompute();
    setMessage("Board imported.");
  } catch (error) {
    setMessage(error instanceof Error ? error.message : "Board import failed.");
  }
});

function recompute(): void {
  latestResult = runBreadthFirstSearch(grid);
  render();
}

function render(): void {
  const pathKeys = new Set(latestResult.path.map(key));
  const visitedKeys = new Set(latestResult.visitedOrder.map(key));
  gridElement.style.setProperty("--columns", String(grid.width));
  gridElement.innerHTML = "";

  for (let y = 0; y < grid.height; y += 1) {
    for (let x = 0; x < grid.width; x += 1) {
      const point = { x, y };
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = cellClass(point, pathKeys, visitedKeys);
      cell.textContent = cellLabel(point);
      cell.ariaLabel = `Cell ${x}, ${y}`;
      cell.addEventListener("click", () => updateCell(point));
      gridElement.append(cell);
    }
  }

  metricsElement.innerHTML = `
    <div><dt>Status</dt><dd>${latestResult.found ? "Reachable" : "Unreachable"}</dd></div>
    <div><dt>Distance</dt><dd>${latestResult.distance ?? "—"}</dd></div>
    <div><dt>Visited</dt><dd>${latestResult.visitedOrder.length}</dd></div>
    <div><dt>Walls</dt><dd>${grid.walls.length}</dd></div>
  `;
  explanationElement.textContent = latestResult.explanation;
  stateElement.value = serializeGrid(grid);
}

function updateCell(point: Point): void {
  if (mode === "start" && !sameCell(point, grid.goal) && !isWall(grid, point)) {
    grid = { ...grid, start: point };
  } else if (
    mode === "goal" &&
    !sameCell(point, grid.start) &&
    !isWall(grid, point)
  ) {
    grid = { ...grid, goal: point };
  } else if (mode === "wall") {
    grid = toggleWall(grid, point);
  }
  recompute();
}

function cellClass(
  point: Point,
  pathKeys: Set<string>,
  visitedKeys: Set<string>,
): string {
  const classes = ["cell"];
  if (sameCell(point, grid.start)) classes.push("start");
  if (sameCell(point, grid.goal)) classes.push("goal");
  if (isWall(grid, point)) classes.push("wall");
  if (visitedKeys.has(key(point))) classes.push("visited");
  if (pathKeys.has(key(point))) classes.push("path");
  return classes.join(" ");
}

function cellLabel(point: Point): string {
  if (sameCell(point, grid.start)) return "S";
  if (sameCell(point, grid.goal)) return "G";
  if (isWall(grid, point)) return "";
  if (latestResult.path.some((pathPoint) => sameCell(pathPoint, point)))
    return "·";
  return "";
}

function key(point: Point): string {
  return `${point.x},${point.y}`;
}

function sameCell(left: Point, right: Point): boolean {
  return left.x === right.x && left.y === right.y;
}

function labelSample(name: SampleName): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function setMessage(message: string): void {
  messageElement.textContent = message;
}

function mustFind<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}

render();
