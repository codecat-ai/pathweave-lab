import {
  type Grid,
  type MovementMode,
  parseGrid,
  serializeGrid,
} from "./grid";

const payloadPattern = /^[A-Za-z0-9_-]+$/;

export interface AppState {
  readonly grid: Grid;
  readonly movementMode: MovementMode;
}

export function encodeBoard(grid: Grid): string {
  return toBase64Url(serializeGrid(grid));
}

export function decodeBoard(encoded: string): Grid {
  return decodeAppState(encoded).grid;
}

export function encodeAppState(state: AppState): string {
  return toBase64Url(serializeAppState(state));
}

export function decodeAppState(encoded: string): AppState {
  return parseAppState(decodePayload(encoded));
}

export function decodeAppStateFromHash(hash: string): AppState {
  const encoded = parseBoardHash(hash);

  if (encoded === null) {
    throw new Error("Board share URL payload is missing.");
  }

  return decodeAppState(encoded);
}

export function decodeBoardFromHash(hash: string): string {
  const encoded = parseBoardHash(hash);

  if (encoded === null) {
    throw new Error("Board share URL payload is missing.");
  }

  const json = decodePayload(encoded);
  parseGrid(json);
  return json;
}

export function parseBoardHash(hash: string): string | null {
  const normalized = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(normalized);
  const encoded = params.get("board");

  if (encoded === null) {
    return null;
  }

  if (encoded.length === 0) {
    throw new Error("Board share URL payload is missing.");
  }

  return encoded;
}

export function createShareUrl(
  currentHref: string,
  grid: Grid,
  movementMode: MovementMode = "orthogonal",
): string {
  const url = new URL(currentHref);
  url.hash = `board=${encodeAppState({ grid, movementMode })}`;
  return url.toString();
}

export function createAppStateShareUrl(
  currentHref: string,
  state: AppState,
): string {
  const url = new URL(currentHref);
  url.hash = `board=${encodeAppState(state)}`;
  return url.toString();
}

function serializeAppState(state: AppState): string {
  const grid = JSON.parse(serializeGrid(state.grid)) as unknown;

  return JSON.stringify(
    {
      grid,
      movementMode: state.movementMode,
    },
    null,
    2,
  );
}

function parseAppState(json: string): AppState {
  const board = tryParseBoardOnly(json);

  if (board) {
    return { grid: board, movementMode: "orthogonal" };
  }

  let raw: unknown;

  try {
    raw = JSON.parse(json) as unknown;
  } catch {
    throw new Error("Board state must be valid JSON.");
  }

  if (!isRecord(raw)) {
    throw new Error("Board state must be a JSON object.");
  }

  if (!("grid" in raw)) {
    throw new Error("Shared app state must include a grid.");
  }

  return {
    grid: parseGrid(JSON.stringify(raw.grid)),
    movementMode: parseMovementMode(raw.movementMode),
  };
}

function tryParseBoardOnly(json: string): Grid | null {
  try {
    return parseGrid(json);
  } catch {
    return null;
  }
}

function parseMovementMode(value: unknown): MovementMode {
  if (value === "orthogonal" || value === "diagonal") {
    return value;
  }

  throw new Error("Movement mode must be either orthogonal or diagonal.");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function decodePayload(encoded: string): string {
  if (!payloadPattern.test(encoded)) {
    throw new Error("Board share URL payload is malformed.");
  }

  try {
    return fromBase64Url(encoded);
  } catch {
    throw new Error("Board share URL payload is malformed.");
  }
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/u, "");
}

function fromBase64Url(value: string): string {
  const padded = value.padEnd(
    value.length + ((4 - (value.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}
