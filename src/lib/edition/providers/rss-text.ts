const MAX_FEED_BYTES = 1024 * 1024;

export function decodeEntities(text: string): string {
  const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, name: string) => {
    if (!name.startsWith("#")) return named[name.toLowerCase()] ?? entity;
    const code = name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : Number(name.slice(1));
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : "";
  });
}

/** Only the documented WordPress RSS scalar/CDATA subset; no XML entity expansion or HTML rendering. */
export function field(item: string, name: string): string | null {
  const matches = [...item.matchAll(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`, "g"))];
  if (matches.length !== 1) return null;
  const raw = matches[0][1].trim();
  if (raw.startsWith("<![CDATA[") && raw.endsWith("]]>")) return raw.slice(9, -3);
  return raw.includes("<") ? null : decodeEntities(raw);
}

export function withoutMedia(html: string): string {
  return html.replace(/<(figure|blockquote|script|style|iframe|video|audio)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<div\b[^>]*class=["'][^"']*\bwp-caption\b[^"']*["'][^>]*>[\s\S]*?<\/div\s*>/gi, " ")
    .replace(/<img\b[^>]*>/gi, " ");
}

export function plainText(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/[<>\x00-\x1f]/g, " ").replace(/\s+/g, " ").trim();
}

export async function readBoundedFeed(response: Response): Promise<string> {
  if (!response.body || Number(response.headers.get("content-length")) > MAX_FEED_BYTES) throw new Error("Oversized or empty feed");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_FEED_BYTES) throw new Error("Oversized feed");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  return Buffer.concat(chunks).toString("utf8");
}
