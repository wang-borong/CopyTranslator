import { execFileSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rawVersion = process.argv[2] || "";
const version = rawVersion.trim().replace(/^v/, "");

if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`Invalid Arch package version: ${rawVersion || "<empty>"}`);
  process.exit(1);
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");
const packageDir = join(rootDir, "dist", "archlinux");
const stageDir = join(packageDir, "pkg");
const outputDir = join(rootDir, "dist", "release");
const packageName = "copytranslator";
const packageRelease = "1";
const archPackageVersion = version.replaceAll("-", "_");
const arch = process.env.ARCH_PACKAGE_ARCH || getMachineArch();
const outputFile = join(outputDir, `CopyTranslator_${version}_${arch}.tar.zst`);

function getMachineArch() {
  const machine = execFileSync("uname", ["-m"], { encoding: "utf8" }).trim();
  if (machine === "amd64") {
    return "x86_64";
  }
  if (machine === "arm64") {
    return "aarch64";
  }
  return machine;
}

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function writeFile(destination, content) {
  ensureDir(dirname(destination));
  writeFileSync(destination, content);
}

function copyFile(source, destination, mode) {
  if (!existsSync(source)) {
    throw new Error(`Required package source is missing: ${source}`);
  }
  ensureDir(dirname(destination));
  copyFileSync(source, destination);
  if (mode != null) {
    chmodSync(destination, mode);
  }
}

function findBinary() {
  const candidates = [
    join(rootDir, "src-tauri", "target", "release", "copytranslator"),
    join(
      rootDir,
      "src-tauri",
      "target",
      "release",
      "bundle",
      "deb",
      `CopyTranslator_${version}_amd64`,
      "data",
      "usr",
      "bin",
      "copytranslator"
    ),
  ];

  const binary = candidates.find((candidate) => existsSync(candidate));
  if (!binary) {
    throw new Error(
      `Could not find release binary. Checked:\n${candidates.join("\n")}`
    );
  }
  return binary;
}

function walkFiles(path) {
  const result = [];
  const entries = execFileSync("find", [path, "-type", "f"], {
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .filter(Boolean);

  for (const entry of entries) {
    result.push(entry);
  }
  return result;
}

function installedSize(path) {
  return walkFiles(path)
    .filter((file) => !file.endsWith("/.PKGINFO"))
    .reduce((total, file) => total + statSync(file).size, 0);
}

function packageInfo(size) {
  const buildDate = Math.floor(Date.now() / 1000);
  return [
    `pkgname = ${packageName}`,
    `pkgbase = ${packageName}`,
    `pkgver = ${archPackageVersion}-${packageRelease}`,
    "pkgdesc = Desktop translation assistant powered by Tauri",
    `url = https://github.com/wang-borong/CopyTranslator`,
    `builddate = ${buildDate}`,
    "packager = GitHub Actions <actions@github.com>",
    `size = ${size}`,
    `arch = ${arch}`,
    "license = GPL-2.0-or-later",
    "depend = webkit2gtk-4.1",
    "depend = gtk3",
    "depend = libayatana-appindicator",
    "depend = librsvg",
    "depend = openssl",
    "optdepend = xdotool: simulated copy, paste, and active-window detection on X11",
    "",
  ].join("\n");
}

rmSync(packageDir, { force: true, recursive: true });
ensureDir(stageDir);
ensureDir(outputDir);

copyFile(findBinary(), join(stageDir, "usr", "bin", "copytranslator"), 0o755);

writeFile(
  join(stageDir, "usr", "share", "applications", "copytranslator.desktop"),
  [
    "[Desktop Entry]",
    "Type=Application",
    "Name=CopyTranslator",
    "Comment=CopyTranslator desktop translation assistant",
    "Exec=copytranslator",
    "Icon=copytranslator",
    "Terminal=false",
    "Categories=Utility;Office;",
    "StartupNotify=true",
    "StartupWMClass=copytranslator",
    "",
  ].join("\n")
);

copyFile(
  join(rootDir, "src-tauri", "icons", "32x32.png"),
  join(
    stageDir,
    "usr",
    "share",
    "icons",
    "hicolor",
    "32x32",
    "apps",
    "copytranslator.png"
  )
);
copyFile(
  join(rootDir, "src-tauri", "icons", "128x128.png"),
  join(
    stageDir,
    "usr",
    "share",
    "icons",
    "hicolor",
    "128x128",
    "apps",
    "copytranslator.png"
  )
);
copyFile(
  join(rootDir, "src-tauri", "icons", "128x128@2x.png"),
  join(
    stageDir,
    "usr",
    "share",
    "icons",
    "hicolor",
    "256x256",
    "apps",
    "copytranslator.png"
  )
);
copyFile(
  join(rootDir, "LICENSE"),
  join(stageDir, "usr", "share", "licenses", packageName, "LICENSE")
);

const licenseText = readFileSync(join(rootDir, "readable_license.txt"), "utf8");
writeFile(
  join(stageDir, "usr", "share", "doc", packageName, "README.license"),
  licenseText
);

writeFile(join(stageDir, ".PKGINFO"), packageInfo(installedSize(stageDir)));

rmSync(outputFile, { force: true });
execFileSync(
  "tar",
  [
    "--sort=name",
    "--mtime=@0",
    "--owner=0",
    "--group=0",
    "--numeric-owner",
    "-I",
    "zstd",
    "-cf",
    outputFile,
    "-C",
    stageDir,
    ".PKGINFO",
    "usr",
  ],
  { stdio: "inherit" }
);

console.log(`Arch Linux package created: ${outputFile}`);
