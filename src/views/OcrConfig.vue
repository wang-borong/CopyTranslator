<template>
  <div class="ocr-config">
    <section class="ocr-panel">
      <div class="ocr-panel-header">
        <div>
          <div class="ocr-title">{{ trans["ocrConfig"] || "OCR" }}</div>
          <div class="ocr-subtitle">
            {{
              trans["ocrTauriNote"] ||
              "Tauri 版本使用百度 OCR REST API。截图后复制图片到剪贴板，或使用系统截图工具复制图片，即可触发 OCR 翻译。"
            }}
          </div>
        </div>
        <v-icon size="22" color="primary">mdi-text-recognition</v-icon>
      </div>
      <Action identifier="enableOCR"></Action>
      <v-expansion-panels variant="accordion" class="ocr-providers">
        <v-expansion-panel
          v-for="ocr in ocrList"
          :key="ocr.id"
          :value="ocr.id"
          class="ocr-provider"
        >
          <v-expansion-panel-title>
            <div class="ocr-provider-title">
              <v-icon size="18" color="primary">mdi-cloud-key-outline</v-icon>
              <span>{{ ocr.name }}</span>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <KeyConfig :identifier="ocr.id"></KeyConfig>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Action from "@/components/Action.vue";
import KeyConfig from "@/components/KeyConfig.vue";
import { recognizerTypes } from "@/common/types";
import { useBase } from "@/components/useBase";

const base = useBase();
const trans = base.trans;

const getRecognizerName = (recognizerId: string): string => {
  switch (recognizerId) {
    case "baidu-ocr":
      return trans.value["baidu-ocr"] || "百度 OCR";
    default:
      return recognizerId;
  }
};

const ocrList = computed(() =>
  recognizerTypes.map((id) => ({
    id,
    name: getRecognizerName(id),
  }))
);
</script>

<style scoped>
.ocr-config {
  height: 100%;
  overflow: auto;
  padding-right: 4px;
  text-align: left;
}
.ocr-panel {
  background: rgba(var(--v-theme-surface), 0.72);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  padding: 12px;
}
.ocr-panel-header {
  align-items: center;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 10px;
}
.ocr-title {
  font-size: 15px;
  font-weight: 700;
  line-height: 22px;
}
.ocr-subtitle {
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 12px;
  line-height: 18px;
  max-width: 760px;
}
.ocr-providers {
  margin-top: 10px;
}
.ocr-provider {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}
.ocr-provider-title {
  align-items: center;
  display: flex;
  gap: 8px;
  font-weight: 600;
}
</style>
