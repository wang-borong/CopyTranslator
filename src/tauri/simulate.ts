import { invoke } from "@tauri-apps/api/core";

async function simulateCopy() {
  try {
    await invoke("simulate_copy");
  } catch (e) {
    console.error("Failed to simulate copy:", e);
  }
}

async function simulatePaste() {
  try {
    await invoke("simulate_paste");
  } catch (e) {
    console.error("Failed to simulate paste:", e);
  }
}

export default {
  copy: simulateCopy,
  paste: simulatePaste,
};
