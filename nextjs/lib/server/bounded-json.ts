import type { NextRequest } from "next/server";

async function readBoundedBytes(request: NextRequest, maxBytes: number) {
  if (!request.body) throw new Error("EMPTY_REQUEST_BODY");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error("PAYLOAD_TOO_LARGE");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function readBoundedText(request: NextRequest, maxBytes: number) {
  return new TextDecoder().decode(await readBoundedBytes(request, maxBytes));
}

export async function readBoundedJson<T = unknown>(request: NextRequest, maxBytes: number): Promise<T> {
  return JSON.parse(await readBoundedText(request, maxBytes)) as T;
}
