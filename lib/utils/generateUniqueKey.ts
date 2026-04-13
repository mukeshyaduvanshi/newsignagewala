/**
 * Generate a unique key from a string
 * Converts to lowercase, removes special characters, and replaces spaces with underscores
 */
export function generateUniqueKey(text: string, text1: string, text2: string): string {
  if (!text || !text1 || !text2) return '';

  const part1 = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 50);

  const part2 = text1
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 6);

  const part3 = text2
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 24);

  return `${part1}_${part2}_${part3}`;
}
