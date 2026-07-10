const CHUNK_SIZE = 1600;
const CHUNK_OVERLAP = 200;
const MAX_CHUNKS = 60;

export function chunkText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
  if (!normalized) return [];
  if (normalized.length <= CHUNK_SIZE) return [normalized];

  const chunks: string[] = [];
  let position = 0;

  while (position < normalized.length && chunks.length < MAX_CHUNKS) {
    let end = Math.min(position + CHUNK_SIZE, normalized.length);

    if (end < normalized.length) {
      const paragraphBreak = normalized.lastIndexOf("\n\n", end);
      const sentenceBreak = normalized.lastIndexOf(". ", end);
      const breakpoint = Math.max(paragraphBreak, sentenceBreak);
      if (breakpoint > position + CHUNK_SIZE * 0.5) {
        end = breakpoint + 1;
      }
    }

    const chunk = normalized.slice(position, end).trim();
    if (chunk) chunks.push(chunk);

    if (end >= normalized.length) break;
    position = end - CHUNK_OVERLAP;
  }

  return chunks;
}

export function estimateReadingMinutes(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
