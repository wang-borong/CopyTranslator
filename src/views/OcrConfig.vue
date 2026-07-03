<template>
  <div class="ocr-config">
    <Action identifier="enableOCR"></Action>
    <v-alert type="info" variant="tonal" density="compact" class="mt-3 mb-3">
      {{
        trans["ocrTauriNote"] ||
        "Tauri 版本使用百度 OCR REST API。截图后复制图片到剪贴板，或使用系统截图工具复制图片，即可触发 OCR 翻译。"
      }}
    </v-alert>
    <v-expansion-panels variant="accordion">
      <v-expansion-panel v-for="ocr in ocrList" :key="ocr.id" :value="ocr.id">
        <v-expansion-panel-title>{{ ocr.name }}</v-expansion-panel-title>
        <v-expansion-panel-text>
          <KeyConfig :identifier="ocr.id"></KeyConfig>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
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
  max-width: 720px;
  text-align: left;
}
</style>
