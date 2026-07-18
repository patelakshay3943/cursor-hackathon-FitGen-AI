/**
 * Placeholder for future HTTP client wiring (e.g. fetch wrapper).
 * This static demo does not call real APIs.
 */
export async function apiGet<T>(_path: string): Promise<T> {
  throw new Error("apiGet is not used in the static demo.");
}
