import type { Grid, MovementMode } from "./grid";
import { parseGrid, serializeGrid } from "./grid";
import {
  applyPreset,
  getPreset,
  type BoardPresetName,
  type BoardPreset,
} from "./presets";

export const lessonBundleSchema = "pathweave.lessonPresetBundle";
export const lessonBundleVersion = 1;
export const lessonBundleAppName = "Pathweave Lab";

export type LessonBundleAlgorithm = "bfs" | "dijkstra" | "compare";

export interface LessonPresetBundle {
  readonly schema: typeof lessonBundleSchema;
  readonly version: typeof lessonBundleVersion;
  readonly title: string;
  readonly generatedFrom: typeof lessonBundleAppName;
  readonly entries: readonly LessonPresetBundleEntry[];
}

export interface LessonPresetBundleEntry {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly algorithm: LessonBundleAlgorithm;
  readonly movement: MovementMode;
  readonly board: Grid;
}

export interface CreatePresetBundleOptions {
  readonly algorithmByPreset?: Partial<
    Record<BoardPresetName, LessonBundleAlgorithm>
  >;
  readonly movementByPreset?: Partial<Record<BoardPresetName, MovementMode>>;
}

interface RawLessonPresetBundle {
  readonly schema?: unknown;
  readonly version?: unknown;
  readonly title?: unknown;
  readonly generatedFrom?: unknown;
  readonly entries?: unknown;
}

interface RawLessonPresetBundleEntry {
  readonly id?: unknown;
  readonly title?: unknown;
  readonly description?: unknown;
  readonly algorithm?: unknown;
  readonly movement?: unknown;
  readonly board?: unknown;
}

export function createPresetBundle(
  title: string,
  presetIds: readonly string[],
  options: CreatePresetBundleOptions = {},
): LessonPresetBundle {
  if (!title.trim()) {
    throw new Error("Lesson bundle title must be a non-empty string.");
  }

  if (presetIds.length === 0) {
    throw new Error("Lesson bundle entries must include at least one entry.");
  }

  const seen = new Set<string>();
  const entries = presetIds.map((presetId) => {
    if (seen.has(presetId)) {
      throw new Error("Lesson bundle entry ids must be unique.");
    }

    seen.add(presetId);
    const preset = getPreset(presetId);

    if (!preset) {
      throw new Error(`Unknown lesson preset id: ${presetId}`);
    }

    return createBundleEntry(preset, options);
  });

  return {
    schema: lessonBundleSchema,
    version: lessonBundleVersion,
    title: title.trim(),
    generatedFrom: lessonBundleAppName,
    entries,
  };
}

export function serializePresetBundle(bundle: LessonPresetBundle): string {
  return JSON.stringify(normalizeBundle(bundle), null, 2);
}

export function parsePresetBundle(json: string): LessonPresetBundle {
  let raw: RawLessonPresetBundle;

  try {
    raw = JSON.parse(json) as RawLessonPresetBundle;
  } catch {
    throw new Error("Lesson bundle must be valid JSON.");
  }

  if (!isRecord(raw)) {
    throw new Error("Lesson bundle must be a JSON object.");
  }

  if (raw.schema !== lessonBundleSchema) {
    throw new Error(`Lesson bundle schema must be ${lessonBundleSchema}.`);
  }

  if (raw.version !== lessonBundleVersion) {
    throw new Error(`Lesson bundle version must be ${lessonBundleVersion}.`);
  }

  const title = parseRequiredString(raw.title, "Lesson bundle title");

  if (raw.generatedFrom !== lessonBundleAppName) {
    throw new Error(
      `Lesson bundle generatedFrom must be ${lessonBundleAppName}.`,
    );
  }

  if (!Array.isArray(raw.entries)) {
    throw new Error("Lesson bundle entries must be an array.");
  }

  if (raw.entries.length === 0) {
    throw new Error("Lesson bundle entries must include at least one entry.");
  }

  const seen = new Set<string>();
  const entries = raw.entries.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new Error(`Lesson bundle entry ${index + 1} must be an object.`);
    }

    const parsedEntry = parseBundleEntry(
      entry as RawLessonPresetBundleEntry,
      index + 1,
    );

    if (seen.has(parsedEntry.id)) {
      throw new Error("Lesson bundle entry ids must be unique.");
    }

    seen.add(parsedEntry.id);
    return parsedEntry;
  });

  return {
    schema: lessonBundleSchema,
    version: lessonBundleVersion,
    title,
    generatedFrom: lessonBundleAppName,
    entries,
  };
}

export function applyBundleEntry(entry: LessonPresetBundleEntry): Grid {
  return cloneGrid(entry.board);
}

function createBundleEntry(
  preset: BoardPreset,
  options: CreatePresetBundleOptions,
): LessonPresetBundleEntry {
  return {
    id: preset.name,
    title: preset.label,
    description: preset.description,
    algorithm:
      options.algorithmByPreset?.[preset.name] ?? defaultAlgorithm(preset),
    movement: options.movementByPreset?.[preset.name] ?? "orthogonal",
    board: cloneGrid(applyPreset(preset.name)),
  };
}

function parseBundleEntry(
  raw: RawLessonPresetBundleEntry,
  index: number,
): LessonPresetBundleEntry {
  const prefix = `Lesson bundle entry ${index}`;
  const id = parseRequiredString(raw.id, `${prefix} id`);
  const title = parseRequiredString(raw.title, `${prefix} title`);
  const description = parseRequiredString(
    raw.description,
    `${prefix} description`,
  );
  const algorithm = parseAlgorithm(raw.algorithm, index);
  const movement = parseMovement(raw.movement, index);

  if (raw.board === undefined) {
    throw new Error(`${prefix} board is required.`);
  }

  let board: Grid;

  try {
    board = parseGrid(JSON.stringify(raw.board));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Board validation failed.";
    throw new Error(`${prefix} board is invalid: ${message}`);
  }

  return { id, title, description, algorithm, movement, board };
}

function normalizeBundle(bundle: LessonPresetBundle): LessonPresetBundle {
  return {
    schema: lessonBundleSchema,
    version: lessonBundleVersion,
    title: bundle.title,
    generatedFrom: lessonBundleAppName,
    entries: bundle.entries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      description: entry.description,
      algorithm: entry.algorithm,
      movement: entry.movement,
      board: cloneGrid(entry.board),
    })),
  };
}

function cloneGrid(grid: Grid): Grid {
  return parseGrid(serializeGrid(grid));
}

function defaultAlgorithm(preset: BoardPreset): LessonBundleAlgorithm {
  return preset.terrain.length > 0 ? "dijkstra" : "bfs";
}

function parseRequiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string.`);
  }

  return value.trim();
}

function parseAlgorithm(value: unknown, index: number): LessonBundleAlgorithm {
  if (value === "bfs" || value === "dijkstra" || value === "compare") {
    return value;
  }

  throw new Error(
    `Lesson bundle entry ${index} algorithm must be bfs, dijkstra, or compare.`,
  );
}

function parseMovement(value: unknown, index: number): MovementMode {
  if (value === "orthogonal" || value === "diagonal") {
    return value;
  }

  throw new Error(
    `Lesson bundle entry ${index} movement must be orthogonal or diagonal.`,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
