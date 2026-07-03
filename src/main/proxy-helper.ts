import { NetworkProxyConfig } from "../common/rule";

export const updateAxiosProxy = (
  proxyConfig: NetworkProxyConfig,
  enable: boolean
) => {
  // In Tauri, proxy settings are automatically handled by the Rust backend / system network settings.
  // No-op in frontend.
};
