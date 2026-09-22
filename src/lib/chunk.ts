export function chunkArray<T>(items: T[], size: number): T[][] {
  if (size < 1) throw new Error("chunk size must be >= 1");

  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
