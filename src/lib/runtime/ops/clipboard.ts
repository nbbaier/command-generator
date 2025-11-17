// Clipboard operation handler

import { Clipboard } from "@raycast/api";
import { ClipboardConfig } from "../../../types/command-spec";

export async function executeClipboard(config: ClipboardConfig): Promise<string | void> {
  if (config.action === "copy") {
    if (!config.text) {
      throw new Error("Clipboard copy requires text parameter");
    }
    await Clipboard.copy(config.text);
  } else if (config.action === "read") {
    const text = await Clipboard.readText();
    return text || "";
  }
}
