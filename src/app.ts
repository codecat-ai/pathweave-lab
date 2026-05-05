import {
  createPlaybackFrames,
  type PlaybackFrame,
  runBreadthFirstSearch,
} from "./algorithms";
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
let playbackFrames = createPlaybackFrames(latestResult);
let playbackIndex = Math.max(0, playbackFrames.length - 1);

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
      <div class="playback" aria-label="BFS playback controls">
        <div class="playback-buttons">
          <button id="playback-prev" type="button" aria-label="Previous BFS step">Prev</button>
          <button id="playback-next" type="button" aria-label="Next BFS step">Next</button>
          <button id="playback-reset" type="button">Reset playback</button>
        </div>
        <output id="playback-status" aria-live="polite"></output>
      </div>
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
const playbackStatusElement = mustFind<HTMLOutputElement>("#playback-status");
const playbackPreviousElement = mustFind<HTMLButtonElement>("#playback-prev");
const playbackNextElement = mustFind<HTMLButtonElement>("#playback-next");
const playbackResetElement = mustFind<HTMLButtonElement>("#playback-reset");

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
playbackPreviousElement.addEventListener("click", () => {
  playbackIndex = Math.max(0, playbackIndex - 1);
  render();
});
playbackNextElement.addEventListener("click", () => {
  playbackIndex = Math.min(playbackFrames.length - 1, playbackIndex + 1);
  render();
});
playbackResetElement.addEventListener("click", () => {
  playbackIndex = 0;
  render();
});
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
  playbackFrames = createPlaybackFrames(latestResult);
  playbackIndex = Math.max(0, playbackFrames.length - 1);
  render();
}

function render(): void {
  const frame = currentPlaybackFrame();
  const pathKeys = new Set(frame?.pathPrefix.map(key) ?? []);
  const visitedKeys = new Set(frame?.visited.map(key) ?? []);
  gridElement.style.setProperty("--columns", String(grid.width));
  gridElement.innerHTML = "";

  for (let y = 0; y < grid.height; y += 1) {
    for (let x = 0; x < grid.width; x += 1) {
      const point = { x, y };
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = cellClass(point, frame, pathKeys, visitedKeys);
      cell.textContent = cellLabel(point, pathKeys);
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
  playbackStatusElement.value = `${frame?.step ?? 0} / ${playbackFrames.length} steps`;
  playbackPreviousElement.disabled = playbackIndex <= 0;
  playbackNextElement.disabled = playbackIndex >= playbackFrames.length - 1;
  playbackResetElement.disabled = playbackIndex <= 0;
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
  frame: PlaybackFrame | undefined,
  pathKeys: Set<string>,
  visitedKeys: Set<string>,
): string {
  const classes = ["cell"];
  if (sameCell(point, grid.start)) classes.push("start");
  if (sameCell(point, grid.goal)) classes.push("goal");
  if (isWall(grid, point)) classes.push("wall");
  if (visitedKeys.has(key(point))) classes.push("visited");
  if (pathKeys.has(key(point))) classes.push("path");
  if (frame && sameCell(point, frame.current)) classes.push("current");
  return classes.join(" ");
}

function cellLabel(point: Point, pathKeys: Set<string>): string {
  if (sameCell(point, grid.start)) return "S";
  if (sameCell(point, grid.goal)) return "G";
  if (isWall(grid, point)) return "";
  if (pathKeys.has(key(point))) return "·";
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

function currentPlaybackFrame(): PlaybackFrame | undefined {
  return playbackFrames[playbackIndex];
}

function mustFind<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}

render();
