import { readFileSync, writeFileSync } from "node:fs";

const rawVersion = process.argv[2] || process.env.GITHUB_REF_NAME || "";
const version = rawVersion.trim().replace(/^refs\/tags\//, "").replace(/^v/, "");

if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`Invalid release version: ${rawVersion || "<empty>"}`);
  process.exit(1);
}

function updateJson(path, updater) {
  const data = JSON.parse(readFileSync(path, "utf8"));
  updater(data);
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

function replaceInFile(path, replacements) {
  let content = readFileSync(path, "utf8");
  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement);
  }
  writeFileSync(path, content);
}

updateJson("package.json", (data) => {
  data.version = version;
});

updateJson("package-lock.json", (data) => {
  data.version = version;
  if (data.packages?.[""]) {
    data.packages[""].version = version;
  }
});

updateJson("src-tauri/tauri.conf.json", (data) => {
  data.version = version;
});

replaceInFile("src-tauri/Cargo.toml", [
  [/^version = ".*"$/m, `version = "${version}"`],
]);

replaceInFile("src-tauri/Cargo.lock", [
  [
    /(\[\[package\]\]\nname = "copytranslator"\nversion = ").*(")/,
    `$1${version}$2`,
  ],
]);

replaceInFile("src/common/constant.ts", [
  [/version: ".*",/, `version: "${version}",`],
]);

console.log(`Release version set to ${version}`);
