// UI feedback operation handlers (Toast and HUD)

import { showToast, showHUD, Toast } from "@raycast/api";
import { ShowToastConfig, ShowHUDConfig } from "../../../types/command-spec";

export async function executeShowToast(config: ShowToastConfig): Promise<void> {
  const style =
    config.style === "success"
      ? Toast.Style.Success
      : config.style === "failure"
        ? Toast.Style.Failure
        : Toast.Style.Animated;

  await showToast({
    style,
    title: config.title,
    message: config.message,
  });
}

export async function executeShowHUD(config: ShowHUDConfig): Promise<void> {
  await showHUD(config.title);
}
