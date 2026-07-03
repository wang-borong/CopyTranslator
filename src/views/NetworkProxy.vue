<template>
  <div class="network-proxy">
    <section class="settings-panel">
      <div class="settings-panel-header">
        <div>
          <div class="settings-panel-title">
            {{ trans["networkProxy"] || "网络代理" }}
          </div>
          <div class="settings-panel-subtitle">
            {{
              trans["networkProxyTip"] ||
              "为翻译服务配置 HTTP、HTTPS 或 SOCKS5 代理。"
            }}
          </div>
        </div>
        <v-icon size="22" color="primary">mdi-lan</v-icon>
      </div>
      <Action identifier="enableNetworkProxy"></Action>
      <div class="settings-panel-body">
        <KeyConfig identifier="networkProxy" :topSave="true"></KeyConfig>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useBase } from "@/components/useBase";
import KeyConfig from "@/components/KeyConfig.vue";
import Action from "@/components/Action.vue";

const base = useBase();
const trans = base.trans;
</script>

<style scoped>
.network-proxy {
  height: 100%;
  overflow: auto;
  padding-right: 4px;
  text-align: left;
}
.settings-panel {
  background: rgba(var(--v-theme-surface), 0.72);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  padding: 12px;
}
.settings-panel-header {
  align-items: center;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 10px;
}
.settings-panel-title {
  font-size: 15px;
  font-weight: 700;
  line-height: 22px;
}
.settings-panel-subtitle {
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 12px;
  line-height: 18px;
}
.settings-panel-body {
  margin-top: 10px;
}
</style>
