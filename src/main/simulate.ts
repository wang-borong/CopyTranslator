import { osType } from "@/common/env";
import { exec } from "child_process";

async function simulateCopy() {
  try {
    const { keyboard, Key } = require("@nut-tree/nut-js");
    const modifier = osType == "Darwin" ? Key.LeftSuper : Key.LeftControl;
    await keyboard.pressKey(modifier, Key.C);
    await keyboard.releaseKey(modifier, Key.C);
  } catch (e) {
    if (osType === "Linux") {
      exec("xdotool key ctrl+c", () => {});
    }
  }
}

async function simulatePaste() {
  try {
    const { keyboard, Key } = require("@nut-tree/nut-js");
    const modifier = osType == "Darwin" ? Key.LeftSuper : Key.LeftControl;
    await keyboard.pressKey(modifier, Key.V);
    await keyboard.releaseKey(modifier, Key.V);
  } catch (e) {
    if (osType === "Linux") {
      exec("xdotool key ctrl+v", () => {});
    }
  }
}

export default {
  copy: simulateCopy,
  paste: simulatePaste,
};
