/**
 * Escapes a string for safe use in MongoDB $regex queries.
 * Prevents regex injection (ReDoS) and unintended pattern matching.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
