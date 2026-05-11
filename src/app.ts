import {
  comparePathfinding,
  createPlaybackFrames,
  type BreadthFirstSearchResult,
  type DijkstraSearchResult,
  type PlaybackFrame,
  runBreadthFirstSearch,
  runDijkstraSearch,
} from "./algorithms";
import {
  type MovementMode,
  type Point,
  isWall,
  parseGrid,
  serializeGrid,
  terrainAt,
} from "./grid";
import {
  applyBoardEdit,
  applyBoardShortcut,
  type BoardEditMode,
} from "./keyboardShortcuts";
import { applyPreset, boardPresets, type BoardPresetName } from "./presets";
import { type SampleName, createSampleGrid, sampleNames } from "./samples";
import {
  createAppStateShareUrl,
  decodeAppStateFromHash,
  parseBoardHash,
} from "./shareUrl";
import { nextTheme, persistTheme, readStoredTheme, type Theme } from "./theme";
import { createBoardSvg } from "./svgExport";
import {
  createWorksheetText,
  worksheetVariants,
  type WorksheetVariant,
} from "./worksheet";
import {
  createWorksheetPrintHtml,
  printWorksheetPreview,
  renderWorksheetPreview,
} from "./worksheetPrint";
import "./style.css";

const width = 16;
const height = 10;
type SearchMode = "bfs" | "dijkstra" | "compare";
type SearchResult = BreadthFirstSearchResult | DijkstraSearchResult;

let mode: BoardEditMode = "wall";
let searchMode: SearchMode = "bfs";
let movementMode: MovementMode = "orthogonal";
let worksheetVariant: WorksheetVariant = "concise";
let grid = createSampleGrid("braid", width, height);
let boardCursor: Point = grid.start;
let latestResult: SearchResult = runBreadthFirstSearch(grid, movementMode);
let comparisonExplanation = "";
let playbackFrames = createPlaybackFrames(latestResult);
let playbackIndex = Math.max(0, playbackFrames.length - 1);
let theme: Theme = readStoredTheme(readLocalStorage());

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Application root not found.");

applyTheme(theme);

app.innerHTML = `
  <section class="hero">
    <div>
      <p class="eyebrow">Local-first pathfinding playground</p>
      <h1>Pathweave Lab</h1>
      <p>Sketch walls, move endpoints, and watch breadth-first search weave the shortest route through a grid.</p>
    </div>
    <button id="theme-toggle" class="theme-toggle" type="button" aria-label="Switch to light mode" aria-pressed="false">
      Dark mode
    </button>
  </section>
  <section class="workspace">
    <aside class="panel controls" aria-label="Controls">
      <h2>Controls</h2>
      <label>Paint mode
        <select id="mode">
          <option value="wall">Toggle walls</option>
          <option value="terrain">Cycle terrain</option>
          <option value="start">Move start</option>
          <option value="goal">Move goal</option>
        </select>
      </label>
      <label>Sample board
        <select id="sample"></select>
      </label>
      <label>Lesson preset
        <select id="preset">
          <option value="">Custom board</option>
        </select>
      </label>
      <label>Movement
        <select id="movement-mode">
          <option value="orthogonal">Orthogonal (4-way)</option>
          <option value="diagonal">Diagonal (8-way)</option>
        </select>
      </label>
      <label>Search
        <select id="search-mode">
          <option value="bfs">BFS (unweighted)</option>
          <option value="dijkstra">Dijkstra (weighted)</option>
          <option value="compare">Compare BFS and Dijkstra</option>
        </select>
      </label>
      <button id="run">Run search</button>
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
      <p class="keyboard-help" id="keyboard-help">
        Keyboard: focus the board, move with arrows, Home/End, PageUp/PageDown; press Space or Enter to apply the selected paint mode; Escape returns to start.
      </p>
      <div id="grid" class="grid" role="grid" tabindex="0" aria-label="Pathfinding board" aria-describedby="keyboard-help"></div>
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
      <button id="copy-share-url">Copy share URL</button>
      <button id="copy-svg">Copy SVG</button>
      <label class="inline-control">Worksheet
        <select id="worksheet-variant"></select>
      </label>
      <button id="copy-worksheet">Copy worksheet</button>
      <button id="print-worksheet">Print worksheet</button>
    </div>
    <p id="message" role="status"></p>
  </section>
  <section class="panel worksheet-preview-panel" aria-labelledby="worksheet-preview-title">
    <div class="worksheet-preview-panel__header">
      <h2 id="worksheet-preview-title">Worksheet preview</h2>
    </div>
    <div id="worksheet-preview" class="worksheet-preview"></div>
  </section>
`;

const gridElement = mustFind<HTMLDivElement>("#grid");
const metricsElement = mustFind<HTMLElement>("#metrics");
const explanationElement = mustFind<HTMLElement>("#explanation");
const stateElement = mustFind<HTMLTextAreaElement>("#state");
const messageElement = mustFind<HTMLElement>("#message");
const modeElement = mustFind<HTMLSelectElement>("#mode");
const movementModeElement = mustFind<HTMLSelectElement>("#movement-mode");
const searchModeElement = mustFind<HTMLSelectElement>("#search-mode");
const worksheetVariantElement =
  mustFind<HTMLSelectElement>("#worksheet-variant");
const worksheetPreviewElement = mustFind<HTMLDivElement>("#worksheet-preview");
const sampleElement = mustFind<HTMLSelectElement>("#sample");
const presetElement = mustFind<HTMLSelectElement>("#preset");
const playbackStatusElement = mustFind<HTMLOutputElement>("#playback-status");
const playbackPreviousElement = mustFind<HTMLButtonElement>("#playback-prev");
const playbackNextElement = mustFind<HTMLButtonElement>("#playback-next");
const playbackResetElement = mustFind<HTMLButtonElement>("#playback-reset");
const themeToggleElement = mustFind<HTMLButtonElement>("#theme-toggle");

sampleElement.innerHTML = sampleNames
  .map((name) => `<option value="${name}">${labelSample(name)}</option>`)
  .join("");
presetElement.innerHTML += boardPresets
  .map(
    ({ name, label, description }) =>
      `<option value="${name}" title="${description}">${label}</option>`,
  )
  .join("");
worksheetVariantElement.innerHTML = worksheetVariants
  .map(({ value, label }) => `<option value="${value}">${label}</option>`)
  .join("");

modeElement.addEventListener("change", () => {
  mode = modeElement.value as BoardEditMode;
});

movementModeElement.addEventListener("change", () => {
  movementMode = movementModeElement.value as MovementMode;
  recompute();
});

searchModeElement.addEventListener("change", () => {
  searchMode = searchModeElement.value as SearchMode;
  recompute();
});

worksheetVariantElement.addEventListener("change", () => {
  worksheetVariant = worksheetVariantElement.value as WorksheetVariant;
  render();
});

sampleElement.addEventListener("change", () => {
  presetElement.value = "";
  grid = createSampleGrid(sampleElement.value as SampleName, width, height);
  boardCursor = grid.start;
  recompute();
});

presetElement.addEventListener("change", () => {
  const presetName = presetElement.value as BoardPresetName | "";

  if (!presetName) {
    return;
  }

  grid = applyPreset(presetName);
  boardCursor = grid.start;
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
themeToggleElement.addEventListener("click", () => {
  theme = nextTheme(theme);
  applyTheme(theme);
  persistTheme(readLocalStorage(), theme);
  renderThemeToggle();
});
mustFind<HTMLButtonElement>("#clear").addEventListener("click", () => {
  presetElement.value = "";
  grid = { ...grid, walls: [] };
  recompute();
});
mustFind<HTMLButtonElement>("#reset").addEventListener("click", () => {
  presetElement.value = "";
  grid = createSampleGrid(sampleElement.value as SampleName, width, height);
  boardCursor = grid.start;
  recompute();
});
mustFind<HTMLButtonElement>("#export").addEventListener("click", () => {
  stateElement.value = serializeGrid(grid);
  setMessage("Board exported as JSON.");
});
mustFind<HTMLButtonElement>("#import").addEventListener("click", () => {
  try {
    grid = parseGrid(stateElement.value);
    boardCursor = grid.start;
    presetElement.value = "";
    recompute();
    setMessage("Board imported.");
  } catch (error) {
    setMessage(error instanceof Error ? error.message : "Board import failed.");
  }
});
mustFind<HTMLButtonElement>("#copy-share-url").addEventListener(
  "click",
  () => void copyShareUrl(),
);
mustFind<HTMLButtonElement>("#copy-svg").addEventListener(
  "click",
  () => void copySvg(),
);
mustFind<HTMLButtonElement>("#copy-worksheet").addEventListener(
  "click",
  () => void copyWorksheet(),
);
mustFind<HTMLButtonElement>("#print-worksheet").addEventListener("click", () =>
  printWorksheetPreview({
    print: () => window.print(),
    setMessage,
    variantLabel: worksheetVariantLabel(worksheetVariant),
  }),
);

gridElement.addEventListener("keydown", (event) => {
  const result = applyBoardShortcut(
    { grid, cursor: boardCursor, mode },
    { key: event.key },
  );

  if (!result.handled) {
    return;
  }

  event.preventDefault();
  grid = result.state.grid;
  boardCursor = result.state.cursor;

  if (result.edited) {
    presetElement.value = "";
    recompute();
    return;
  }

  render();
});

function recompute(): void {
  comparisonExplanation = "";

  if (searchMode === "dijkstra") {
    latestResult = runDijkstraSearch(grid, movementMode);
  } else if (searchMode === "compare") {
    const comparison = comparePathfinding(grid, movementMode);
    latestResult = comparison.dijkstra;
    comparisonExplanation = comparison.explanation;
  } else {
    latestResult = runBreadthFirstSearch(grid, movementMode);
  }

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
      cell.tabIndex = -1;
      cell.className = cellClass(point, frame, pathKeys, visitedKeys);
      cell.textContent = cellLabel(point, pathKeys);
      cell.ariaLabel = cellAriaLabel(point);
      cell.ariaSelected = String(sameCell(point, boardCursor));
      cell.addEventListener("click", () => updateCell(point));
      gridElement.append(cell);
    }
  }

  metricsElement.innerHTML = `
    <div><dt>Status</dt><dd>${latestResult.found ? "Reachable" : "Unreachable"}</dd></div>
    <div><dt>Distance</dt><dd>${latestResult.distance ?? "—"}</dd></div>
    <div><dt>Cost</dt><dd>${"cost" in latestResult ? (latestResult.cost ?? "—") : "Unweighted"}</dd></div>
    <div><dt>Search</dt><dd>${searchLabel(searchMode)}</dd></div>
    <div><dt>Movement</dt><dd>${movementMode === "diagonal" ? "Diagonal" : "Orthogonal"}</dd></div>
    <div><dt>Visited</dt><dd>${latestResult.visitedOrder.length}</dd></div>
    <div><dt>Walls</dt><dd>${grid.walls.length}</dd></div>
    <div><dt>Terrain</dt><dd>${grid.terrain.length}</dd></div>
  `;
  explanationElement.textContent =
    comparisonExplanation || latestResult.explanation;
  stateElement.value = serializeGrid(grid);
  playbackStatusElement.value = `${frame?.step ?? 0} / ${playbackFrames.length} steps`;
  playbackPreviousElement.disabled = playbackIndex <= 0;
  playbackNextElement.disabled = playbackIndex >= playbackFrames.length - 1;
  playbackResetElement.disabled = playbackIndex <= 0;
  renderWorksheetPreview(
    worksheetPreviewElement,
    createWorksheetPrintHtml(grid, movementMode, latestResult, {
      variant: worksheetVariant,
      searchLabel: searchLabel(searchMode),
    }),
  );
}

function renderThemeToggle(): void {
  const isDark = theme === "dark";
  themeToggleElement.textContent = isDark ? "Dark mode" : "Light mode";
  themeToggleElement.ariaLabel = isDark
    ? "Switch to light mode"
    : "Switch to dark mode";
  themeToggleElement.ariaPressed = String(!isDark);
}

function applyTheme(nextTheme: Theme): void {
  document.documentElement.dataset.theme = nextTheme;
  document.documentElement.style.colorScheme = nextTheme;
}

function readLocalStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function updateCell(point: Point): void {
  boardCursor = point;
  presetElement.value = "";
  grid = applyBoardEdit(grid, point, mode);
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
  classes.push(terrainAt(grid, point));
  if (isWall(grid, point)) classes.push("wall");
  if (visitedKeys.has(key(point))) classes.push("visited");
  if (pathKeys.has(key(point))) classes.push("path");
  if (frame && sameCell(point, frame.current)) classes.push("current");
  if (sameCell(point, boardCursor)) classes.push("cursor");
  return classes.join(" ");
}

function cellLabel(point: Point, pathKeys: Set<string>): string {
  if (sameCell(point, grid.start)) return "S";
  if (sameCell(point, grid.goal)) return "G";
  if (isWall(grid, point)) return "";
  if (pathKeys.has(key(point))) return "·";
  if (terrainAt(grid, point) === "mud") return "M";
  if (terrainAt(grid, point) === "water") return "W";
  return "";
}

function cellAriaLabel(point: Point): string {
  const markers = [`Cell ${point.x}, ${point.y}`];

  if (sameCell(point, boardCursor)) markers.push("keyboard cursor");
  if (sameCell(point, grid.start)) markers.push("start");
  if (sameCell(point, grid.goal)) markers.push("goal");
  if (isWall(grid, point)) markers.push("wall");
  if (!isWall(grid, point)) markers.push(`${terrainAt(grid, point)} terrain`);

  return markers.join(", ");
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

function searchLabel(mode: SearchMode): string {
  if (mode === "dijkstra") return "Dijkstra";
  if (mode === "compare") return "Compare";
  return "BFS";
}

function worksheetVariantLabel(variant: WorksheetVariant): string {
  return (
    worksheetVariants.find(({ value }) => value === variant)?.label ?? "Concise"
  );
}

function setMessage(message: string): void {
  messageElement.textContent = message;
}

async function copyShareUrl(): Promise<void> {
  const shareUrl = createAppStateShareUrl(window.location.href, {
    grid,
    movementMode,
  });
  window.history.replaceState(null, "", shareUrl);

  if (!navigator.clipboard?.writeText) {
    setMessage("Share URL added to the address bar. Clipboard is unavailable.");
    return;
  }

  try {
    await navigator.clipboard.writeText(shareUrl);
    setMessage("Share URL copied to clipboard.");
  } catch {
    setMessage("Share URL added to the address bar. Clipboard copy failed.");
  }
}

async function copyWorksheet(): Promise<void> {
  const worksheet = createWorksheetText(grid, movementMode, latestResult, {
    variant: worksheetVariant,
  });
  const variantLabel = worksheetVariantLabel(worksheetVariant);

  if (!navigator.clipboard?.writeText) {
    stateElement.value = worksheet;
    setMessage(
      `${variantLabel} worksheet text placed in the board text area because clipboard is unavailable.`,
    );
    return;
  }

  try {
    await navigator.clipboard.writeText(worksheet);
    setMessage(`${variantLabel} worksheet copied to clipboard.`);
  } catch {
    stateElement.value = worksheet;
    setMessage(
      `${variantLabel} worksheet text placed in the board text area because clipboard copy failed.`,
    );
  }
}

async function copySvg(): Promise<void> {
  const svg = createBoardSvg({
    grid,
    result: latestResult,
    movementMode,
    searchLabel: searchLabel(searchMode),
    searchOptions: comparisonExplanation ? [comparisonExplanation] : [],
  });

  if (!navigator.clipboard?.writeText) {
    stateElement.value = svg;
    setMessage(
      "SVG placed in the board text area because clipboard is unavailable.",
    );
    return;
  }

  try {
    await navigator.clipboard.writeText(svg);
    setMessage("SVG copied to clipboard.");
  } catch {
    stateElement.value = svg;
    setMessage(
      "SVG placed in the board text area because clipboard copy failed.",
    );
  }
}

function loadBoardFromLocationHash(): string | null {
  try {
    const encoded = parseBoardHash(window.location.hash);

    if (encoded === null) {
      return null;
    }

    const appState = decodeAppStateFromHash(window.location.hash);
    grid = appState.grid;
    movementMode = appState.movementMode;
    movementModeElement.value = movementMode;
    boardCursor = grid.start;
    presetElement.value = "";
    return "Board loaded from share URL.";
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Board share URL is invalid.";
    return `Share URL ignored: ${message}`;
  }
}

function currentPlaybackFrame(): PlaybackFrame | undefined {
  return playbackFrames[playbackIndex];
}

function mustFind<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}

const startupMessage = loadBoardFromLocationHash();
recompute();
renderThemeToggle();

if (startupMessage) {
  setMessage(startupMessage);
}
