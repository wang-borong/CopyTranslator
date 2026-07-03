import axios_, { AxiosRequestConfig } from "axios";
import { invoke } from "@tauri-apps/api/core";

export const getProxyAxios = (info?: boolean, googleMirror?: string) => {
  const axiosOptions: AxiosRequestConfig = {
    timeout: 10000,
    adapter: async (config: AxiosRequestConfig) => {
      const headers: Record<string, string> = {};
      if (config.headers) {
        Object.keys(config.headers).forEach((key) => {
          const val = config.headers[key];
          if (val !== undefined && val !== null) {
            headers[key] = String(val);
          }
        });
      }

      let body: string | null = null;
      if (config.data) {
        if (typeof config.data === "string") {
          body = config.data;
        } else {
          body = JSON.stringify(config.data);
        }
      }

      try {
        const response: any = await invoke("fetch_http_proxy", {
          req: {
            url: config.url,
            method: config.method || "GET",
            headers,
            body,
          },
        });

        let data = response.body;
        try {
          data = JSON.parse(response.body);
        } catch (_) {}

        return {
          data,
          status: response.status,
          statusText: "OK",
          headers: {},
          config,
        } as any;
      } catch (error) {
        throw new Error(String(error));
      }
    },
  };
  return axios_.create(axiosOptions);
};

export const axios: any = getProxyAxios(true);
