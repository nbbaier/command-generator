// Open URL/app operation handler

import { open } from "@raycast/api";
import { OpenConfig } from "../../../types/command-spec";

export async function executeOpen(config: OpenConfig): Promise<void> {
  await open(config.target);
}
