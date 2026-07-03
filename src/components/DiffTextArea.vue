<template>
  <div
    class="diffTextArea"
    contenteditable="true"
    :style="colorStyle"
    @contextmenu.prevent="base.openMenu('diffContext')"
  >
    <div>
      <div
        v-for="engine in sortedEngines"
        :key="engine"
        style="margin-left: 2px;"
      >
        <div style="height: 22px; display: flex; align-items: center;">
          <v-btn
            v-bind:class="[engineClass(engine), 'engineBtnBase']"
            variant="plain"
            icon
            width="22px"
            height="22px"
            style="margin-top: auto; margin-bottom: auto;"
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
            style="margin-top: auto; margin-bottom: auto;"
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
            style="margin-top: auto; margin-bottom: auto;"
          >
          </v-progress-circular>
          <a
            v-if="engine === 'keyan'"
            @click="toKeyan()"
            style="font-size: 15px; margin-left: 5px;"
          >
            <span>&nbsp;&nbsp; {{ trans["keyanSlogan"] }}</span>
          </a>
          <a
            v-if="engine === 'stepfun'"
            @click="toStepfun()"
            style="font-size: 15px; margin-left: 5px;"
          >
            <span>&nbsp;&nbsp; {{ trans["stepfunShortSlogan"] }}</span>
          </a>
        </div>

        <div v-bind:style="diffStyle">
          <div v-if="compareResult[engine]">
            <div v-for="(line, k) in compareResult[engine]" :key="k">
              <span
                v-for="(p, k2) in line"
                :key="k + k2"
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
import { computed, ref } from "vue";
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
    return { color: "green" };
  }
  return {};
};

const targetIdx = ref(-1);
</script>

<style scoped>
.btn {
  padding: 0px !important;
  min-width: 0px !important;
}
.engineSpan {
  color: #333;
  font-size: 16px;
  font-weight: 600;
  text-transform: capitalize;
  padding-left: 2px;
  padding-right: 2px;
  text-align: center;
  min-width: 65px;
}
.diffTextArea {
  height: 100%;
  width: 100%;
  overflow: auto;
}
</style>
