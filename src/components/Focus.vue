<template>
  <div
    class="focus-container"
    :style="focusContainerStyle"
    @wheel="wheelHandler($event, 'result')"
    @keydown.ctrl.187="keyboardFontHandler($event, 'result')"
    @keydown.ctrl.189="keyboardFontHandler($event, 'result')"
  >
    <div
      class="focus-body max"
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
          <div class="focus-label">{{ trans["source"] }}</div>
          <div class="focusText focus-block" id="focusSource" contenteditable="true">
            {{ sharedResult ? sharedResult.text : '' }}
          </div>
          <div class="focus-label">{{ trans["result"] }}</div>
          <div class="focusText focus-block" contenteditable="true">
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
    <div
      v-if="engineNotice"
      class="engine-notice"
      :class="{ clickable: engineNoticeClickable }"
      :title="engineNotice"
      @click="openEngineNotice"
    >
      {{ engineNotice }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useBaseView } from "./useBaseView";
import DictResultPanel from "./DictResult.vue";
import DiffTextArea from "./DiffTextArea.vue";

const base = useBaseView(() => getModifiedText());
const mode = base.mode;
const trans = base.trans;
const config = base.config;
const fontColor = base.fontColor;
const contentPadding = base.contentPadding;
const contentLineHeight = base.contentLineHeight;
const resultSize = base.resultSize;
const wheelHandler = base.wheelHandler;
const keyboardFontHandler = base.keyboardFontHandler;
const translate = base.translate;
const google = base.google;
const baidu = base.baidu;
const command = base.command;
const sharedResult = base.sharedResult;
const engineNotice = base.engineNotice;
const engineNoticeClickable = base.engineNoticeClickable;
const openEngineNotice = base.openEngineNotice;

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
.focus-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
.focus-body {
  flex: 1 1 auto;
  min-height: 0;
}
.focusText {
  resize: none;
  line-height: var(--content-line-height);
  background: transparent;
  border: 0;
  box-sizing: border-box;
  color: inherit;
  outline: none;
  word-break: break-word;
}
.focusText:focus {
  box-shadow: inset 0 0 0 1px var(--ct-focus-ring, rgba(142, 36, 170, 0.42));
}
.focus-block {
  border: 1px solid var(--ct-panel-border, rgba(128, 128, 128, 0.16));
  border-radius: 8px;
  min-height: 82px;
  padding: 8px 10px;
  white-space: pre-wrap;
}
.focus-block + .focus-label {
  margin-top: 12px;
}
.focus-label {
  color: var(--ct-muted-color, rgba(128, 128, 128, 0.9));
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
  margin-bottom: 6px;
  user-select: none;
}
.max {
  height: 100%;
  width: 100%;
}
.focusPadding {
  padding: var(--content-padding);
  box-sizing: border-box;
}
.engine-notice {
  flex: 0 0 auto;
  margin: 0 var(--content-padding) 4px var(--content-padding);
  padding-top: 4px;
  border-top: 1px solid rgba(128, 128, 128, 0.18);
  color: currentColor;
  font-size: 12px;
  line-height: 1.35;
  opacity: 0.72;
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  user-select: none;
  white-space: nowrap;
}
.engine-notice.clickable {
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
