import { invoke } from "@tauri-apps/api/core";

export const openUrl = (rawUrl: string) => {
  invoke("open_url", { rawUrl }).catch((err) => {
    console.error("Failed to open URL:", err);
  });
};
