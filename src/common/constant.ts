const githubRepo = "https://github.com/wang-borong/CopyTranslator";
const githubReleases = `${githubRepo}/releases`;

const constants: { [key: string]: string } = {
  appName: "CopyTranslator",
  nickName: "澄明",
  version: "13.1.0",
  stage: "stable",
  githubRepo,
  githubReleases,
  githubLatestReleaseApi:
    "https://api.github.com/repos/wang-borong/CopyTranslator/releases/latest",
  changelogs: `${githubRepo}/blob/master/docs/changelogs/v13.md`,
  wiki: `${githubRepo}/blob/master/docs/guide/13.0.0.md`,
  homepage: githubRepo,
  downloadPage: githubReleases,
  allChangelogs: githubReleases,
  latest: `${githubReleases}/latest`,
  manualDownloadLink: githubReleases,
};
constants[
  "currentChangelog"
] = `${constants.githubReleases}/tag/v${constants.version}`;
const debug = false;
if (debug && process.env.NODE_ENV !== "production") {
  for (const key of Object.keys(constants)) {
    constants[key] = constants[key].replace(
      "https://copytranslator.github.io",
      "http://localhost:8080"
    );
  }
}

export function getChangelogURL(
  targetVersion: string = `v${constants.version}`
) {
  return `${constants.githubReleases}/tag/${targetVersion}`;
}

const terms = ["v" + constants.version, constants.nickName];
if (constants.stage != "stable") {
  terms.push(constants.stage);
}
export const version = terms.join(" ");
export const isDebug = debug || process.env.NODE_ENV !== "production";
const minCompatibleConfigVersion = "v12.1.0";

function version2int(version: string) {
  const infos = version
    .substring(1)
    .split(" ")[0]
    .split(".")
    .map((x) => parseInt(x));
  return infos[0] * 10000 + infos[1] * 100 + infos[2];
}

export function compatible(configVersion: string): boolean {
  if (configVersion.indexOf("beta") != -1 && configVersion != version) {
    return false; //如果是测试版，肯定要更新的
  }
  try {
    const configCount = version2int(configVersion);
    const currentCount = version2int(version);
    if (configCount > currentCount) {
      return false; //回退到旧版本要把整个配置文件重置一下，避免冲突
    }
    const minCount = version2int(minCompatibleConfigVersion);

    if (configCount < minCount) {
      // v12.1.0 之前的版本，不支持当前配置结构
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

export function isLower(
  configVersion: string,
  minimalVersion: string
): boolean {
  if (configVersion.indexOf("beta") != -1 && configVersion != version) {
    return true; //如果是测试版，且版本不一致，则肯定要更新的
  }
  const configInfos = configVersion
    .substring(1)
    .split(" ")[0]
    .split(".")
    .map((x) => parseInt(x));
  const targetInfos = minimalVersion
    .substring(1)
    .split(" ")[0]
    .split(".")
    .map((x) => parseInt(x));
  const configCount =
    configInfos[0] * 10000 + configInfos[1] * 100 + configInfos[2];
  const targetCount =
    targetInfos[0] * 10000 + targetInfos[1] * 100 + targetInfos[2];
  return configCount < targetCount;
}
export { constants };
