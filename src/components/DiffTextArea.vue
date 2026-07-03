<template>
  <div
    class="diffTextArea"
    contenteditable="true"
    :style="colorStyle"
    @contextmenu.prevent="base.openMenu('diffContext')"
  >
    <div class="diff-list">
      <div
        v-for="engine in sortedEngines"
        :key="engine"
        class="diff-engine-block"
      >
        <div class="diff-engine-header">
          <v-btn
            v-bind:class="[engineClass(engine), 'engineBtnBase']"
            variant="plain"
            icon
            width="22px"
            height="22px"
          ></v-btn>
          <span class="engineSpan">
            {{ getEngineName(engine) }}
          </span>
          <v-btn
            color="primary"
            variant="plain"
            icon
            class="btn"
            width="22px"
            height="22px"
            @click="base.callback('copyResult', engine)"
            v-if="resultBuffer[engine]?.status !== 'Translating'"
          >
            <v-icon size="22px"> mdi-content-copy </v-icon>
          </v-btn>
          <v-progress-circular
            v-else
            :size="20"
            :width="2"
            color="primary"
            indeterminate
          >
          </v-progress-circular>
          <a
            v-if="engine === 'keyan'"
            @click="toKeyan()"
            class="engine-link"
          >
            <span>{{ trans["keyanSlogan"] }}</span>
          </a>
          <a
            v-if="engine === 'stepfun'"
            @click="toStepfun()"
            class="engine-link"
          >
            <span>{{ trans["stepfunShortSlogan"] }}</span>
          </a>
        </div>

        <div class="diff-result" v-bind:style="diffStyle">
          <div v-if="compareResult[engine]">
            <div v-for="(line, k) in compareResult[engine]" :key="k">
              <span
                v-for="(p, k2) in line"
                :key="`${k}-${k2}`"
                :style="getStyle(p)"
                >{{ p.value }}</span
              >
            </div>
          </div>
          <div v-else>{{ resultBuffer[engine]?.translation || '' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useBaseView } from "./useBaseView";
import { ResultBuffer } from "@/common/translate/types";
import { compareAll, CompareResult } from "@/renderer/comparator";
import { TranslatorNameResolver } from "@/common/translate/translator-name-resolver";
import "@/css/shared-styles.css";

const base = useBaseView(() => undefined);
const trans = base.trans;
const diffSize = base.diffSize;
const fontColor = base.fontColor;
const toKeyan = base.toKeyan;
const toStepfun = base.toStepfun;

const engineClass = (engineId: string) => {
  return TranslatorNameResolver.getEngineClass(engineId);
};

const getEngineName = (engineId: string): string => {
  return TranslatorNameResolver.getDisplayName(engineId, trans.value);
};

const resultBuffer = computed<ResultBuffer>(() => {
  // Use store resultBuffer directly
  return (window as any).$controller.transCon.resultBuffer || {};
});

const sortedEngines = computed(() => {
  const configOrder = base.config.value["translator-compare"] || [];
  const bufferKeys = Object.keys(resultBuffer.value);
  const sorted = configOrder.filter((key: string) =>
    bufferKeys.includes(key)
  );
  const remaining = bufferKeys.filter((key: string) => !sorted.includes(key));
  return [...sorted, ...remaining];
});

const validResults = computed(() => {
  const valids: ResultBuffer = {};
  Object.entries(resultBuffer.value).forEach(([key, item]) => {
    if (item.status !== "Translating") {
      valids[key] = item;
    }
  });
  return valids;
});

const compareResult = computed<CompareResult>(() => {
  if (Object.keys(validResults.value).length > 1) {
    return compareAll(resultBuffer.value);
  } else {
    return {};
  }
});

const diffStyle = computed(() => ({
  fontSize: `${diffSize.value}px`,
}));

const colorStyle = computed(() => ({
  color: fontColor.value,
}));

const getStyle = (p: any) => {
  if (p.added) {
    return { color: "rgb(var(--v-theme-success))", fontWeight: 600 };
  }
  return {};
};
</script>

<style scoped>
.btn {
  padding: 0px !important;
  min-width: 0px !important;
}
.engineSpan {
  color: currentColor;
  font-size: 16px;
  font-weight: 600;
  text-transform: capitalize;
  line-height: 22px;
  min-width: 0;
  overflow: hidden;
  padding-left: 4px;
  padding-right: 6px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.diffTextArea {
  height: 100%;
  width: 100%;
  overflow: auto;
  outline: none;
  padding: 6px;
  box-sizing: border-box;
}
.diff-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.diff-engine-block {
  border: 1px solid var(--ct-panel-border, rgba(128, 128, 128, 0.16));
  border-radius: 8px;
  overflow: hidden;
}
.diff-engine-header {
  align-items: center;
  background: var(--ct-panel-header-bg, transparent);
  border-bottom: 1px solid var(--ct-panel-border, rgba(128, 128, 128, 0.16));
  display: flex;
  gap: 2px;
  min-height: 32px;
  padding: 4px 8px;
}
.diff-result {
  line-height: var(--content-line-height, 1.6);
  padding: 8px 10px 10px;
  white-space: pre-wrap;
  word-break: break-word;
}
.engine-link {
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
  flex: 1 1 auto;
  font-size: 13px;
  line-height: 18px;
  margin-left: 4px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
