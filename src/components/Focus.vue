<template>
  <div
    :style="focusContainerStyle"
    @wheel="wheelHandler($event, 'result')"
    @keydown.ctrl.187="keyboardFontHandler($event, 'result')"
    @keydown.ctrl.189="keyboardFontHandler($event, 'result')"
  >
    <div
      class="max"
      @keyup.ctrl.enter.capture="translate"
      @keyup.ctrl.g.capture="google"
      @keyup.ctrl.b.capture="baidu"
      @keyup.ctrl.p.capture="command"
      @drop="dragTranslate"
    >
      <div
        v-if="(mode === 'normal'|| mode==='none')"
        class="focusPadding"
        style="height: 100%;"
        v-bind:style="focusStyle"
        @contextmenu.prevent="base.openMenu('focusContext')"
      >
        <div v-if="(config.focusSource && mode=='normal')">
          <div>原文：</div>
          <div class="focusText" id="focusSource" contenteditable="true">
            {{ sharedResult ? sharedResult.text : '' }}
          </div>
          <div>译文：</div>
          <div class="focusText" contenteditable="true">
            {{ sharedResult ? sharedResult.translation : '' }}
          </div>
        </div>
        <textarea
          v-else
          class="focusText max focusPadding"
          v-model="translationText"
          v-bind:style="focusStyle"
        ></textarea>
      </div>
      <DiffTextArea
        v-else-if="mode == 'diff'"
        class="focusText max focusPadding"
        id="diffText"
      ></DiffTextArea>
      <DictResultPanel
        v-else-if="mode === 'dict'"
        id="dictResultPanel"
        class="max focusPadding"
      ></DictResultPanel>
    </div>
    <div style="font-size: 15px; position: absolute; right: 0px; bottom: 5px;">
      <div
        v-if="
          status !== 'Translating' &&
          mode === 'normal' &&
          sharedResult &&
          sharedResult.engine !== '' &&
          sharedResult.engine !== currentEngine
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
import { computed } from "vue";
import { useBaseView } from "./useBaseView";
import DictResultPanel from "./DictResult.vue";
import DiffTextArea from "./DiffTextArea.vue";

const base = useBaseView(() => getModifiedText());
const status = base.status;
const currentEngine = base.currentEngine;
const mode = base.mode;
const trans = base.trans;
const config = base.config;
const fontColor = base.fontColor;
const contentPadding = base.contentPadding;
const contentLineHeight = base.contentLineHeight;
const toKeyan = base.toKeyan;
const toStepfun = base.toStepfun;
const resultSize = base.resultSize;
const wheelHandler = base.wheelHandler;
const keyboardFontHandler = base.keyboardFontHandler;
const translate = base.translate;
const google = base.google;
const baidu = base.baidu;
const command = base.command;

const sharedResult = base.sharedResult;

const translationText = computed({
  get: () => base.sharedResult.value?.translation || "",
  set: (val: string) => {
    if (base.sharedResult.value) {
      base.sharedResult.value.translation = val;
    }
  }
});

const dragTranslate = (event: DragEvent) => {
  console.log(event.dataTransfer?.getData("text/plain"));
};

const focusStyle = computed(() => ({
  fontSize: `${resultSize.value}px`,
  color: fontColor.value,
}));

const focusContainerStyle = computed(() => ({
  "--content-padding": `${contentPadding.value}px`,
  "--content-line-height": contentLineHeight.value.toString(),
}));

const getTextById = (id: string) => {
  const e = document.getElementById(id);
  return e ? e.innerText : "";
};

const getModifiedText = () => {
  let text: string | undefined;
  switch (mode.value) {
    case "diff":
      text = getTextById("diffText");
      break;
    case "dict":
      text = getTextById("dictResultPanel");
      break;
    case "normal":
      if (config.value.focusSource) {
        text = getTextById("focusSource");
      } else {
        text = translationText.value;
      }
      break;
    case "none":
      text = translationText.value;
      break;
  }
  return text;
};
</script>

<style scoped>
.focusText {
  resize: none;
  line-height: var(--content-line-height);
}
.max {
  height: 100%;
  width: 100%;
}
.focusPadding {
  padding: var(--content-padding);
  box-sizing: border-box;
}
</style>
