<template>
  <div
    class="co-textarea"
    contenteditable="true"
    @contextmenu.prevent="base.openMenu('contrastContext')"
  >
    <div style="height: 100%;">
      <div v-if="chineseStyle">
        <span
          v-for="(val, key) in (sentences as string[])"
          :key="key"
          @mouseover="mouseOver(key)"
          style="display: block;"
        >
          {{ val }}
        </span>
      </div>
      <div v-else>
        <div
          v-for="(val, key) in (sentences as string[])"
          :key="key"
          @mouseover="mouseOver(key)"
        >
          <span style="display: block; padding-bottom: 5px;">
            {{ val }}
          </span>
        </div>
      </div>
    </div>
    <div style="font-size: 15px; position: absolute; right: 0px; bottom: 5px;">
      <div
        v-if="
          status !== 'Translating' &&
          sharedResult &&
          sharedResult.engine !== '' &&
          sharedResult.engine !== currentEngine &&
          mode === 'normal'
        "
      >
        <a>
          <span>
            {{ currentEngine }}&nbsp;{{ trans["fallbackPrompt1"]
            }}{{ sharedResult.engine }}{{ trans["fallbackPrompt2"] }}
          </span>
        </a>
      </div>
      <div v-else-if="currentEngine === 'keyan'">
        <a @click="toKeyan()">
          <span>{{ trans["keyanSlogan"] }}</span>
        </a>
      </div>
      <div v-else-if="currentEngine === 'stepfun'">
        <a @click="toStepfun()">
          <span>{{ trans["stepfunSlogan"] }}</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useBaseView } from "./useBaseView";

const props = defineProps<{
  sentences: any;
  chineseStyle: boolean;
}>();

const base = useBaseView(() => undefined);
const status = base.status;
const currentEngine = base.currentEngine;
const mode = base.mode;
const trans = base.trans;
const toKeyan = base.toKeyan;
const toStepfun = base.toStepfun;

const sharedResult = base.sharedResult;

const targetIdx = ref(-1);
const mouseOver = (idx: number) => {
  targetIdx.value = idx;
};
</script>

<style scoped>
.co-textarea {
  box-sizing: border-box;
  height: 100%;
  position: relative;
}
</style>
