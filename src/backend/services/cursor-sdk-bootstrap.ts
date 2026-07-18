import { mkdir } from "node:fs/promises";
import { join } from "node:path";

let sdkPromise: Promise<typeof import("@cursor/sdk")> | null = null;

/**
 * Load @cursor/sdk with JsonlLocalAgentStore so local agents work on Node < 22.13
 * (default SQLite storage needs built-in node:sqlite).
 */
export function loadCursorSdk() {
  if (!sdkPromise) {
    sdkPromise = (async () => {
      const sdk = await import("@cursor/sdk");
      const rootDir = join(process.cwd(), ".cursor-sdk-store");
      await mkdir(rootDir, { recursive: true });
      sdk.Cursor.configure({
        local: { store: new sdk.JsonlLocalAgentStore(rootDir) },
      });
      return sdk;
    })();
  }
  return sdkPromise;
}
