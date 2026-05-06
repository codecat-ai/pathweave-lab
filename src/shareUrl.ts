import { type Grid, parseGrid, serializeGrid } from "./grid";

const payloadPattern = /^[A-Za-z0-9_-]+$/;

export function encodeBoard(grid: Grid): string {
  return toBase64Url(serializeGrid(grid));
}

export function decodeBoard(encoded: string): Grid {
  return parseGrid(decodePayload(encoded));
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

export function createShareUrl(currentHref: string, grid: Grid): string {
  const url = new URL(currentHref);
  url.hash = `board=${encodeBoard(grid)}`;
  return url.toString();
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
