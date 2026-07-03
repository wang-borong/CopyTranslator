<template>
  <div :style="maxParent">
    <Focus
      class="maxNoPad areaWarpper focusArea"
      v-if="layoutType === 'focus'"
    ></Focus>
    <div
      v-else-if="layoutType === 'horizontal'"
      class="maxNoPad"
      style="margin: 0px; display: flex;"
    >
      <div
        class="areaWarpper"
        v-bind:style="leftStyle"
        @wheel="wheelHandler($event, 'source')"
        @keydown.ctrl.187="keyboardFontHandler($event, 'source')"
        @keydown.ctrl.189="keyboardFontHandler($event, 'source')"
      >
        <textarea
          v-bind:style="sourceFontStyle"
          class="hArea"
          :placeholder="trans['source'] || 'Source'"
          @keyup.ctrl.enter="translate"
          @keyup.ctrl.g="google"
          @keyup.ctrl.b="baidu"
          @keyup.ctrl.p="command"
          @select="onSelect"
          @blur="deSelect"
          @click="deSelect"
          @keydown="deSelect"
          @mousemove="mouseMove"
          v-model="sourceText"
          @contextmenu.prevent="base.openMenu('contrastContext')"
        ></textarea>
      </div>
      <div
        id="hDrag"
        class="resizer"
        style="width: 4px; cursor: col-resize;"
        @mousedown="mousedown"
      ></div>
      <div
        class="areaWarpper"
        v-bind:style="rightStyle"
        @wheel="wheelHandler($event, 'result')"
        tabindex="-1"
        @keydown.ctrl.187="keyboardFontHandler($event, 'result')"
        @keydown.ctrl.189="keyboardFontHandler($event, 'result')"
      >
        <DiffTextArea v-if="multiSource" class="hArea"></DiffTextArea>
        <CoTextArea
          v-else-if="!base.config.value['contrastDict'] || !dictResult.valid"
          class="hArea"
          v-bind:style="resultFontStyle"
          :sentences="sharedResult ? sharedResult.transPara : []"
          :chineseStyle="sharedResult ? sharedResult.chineseStyle : false"
          ref="myhead"
        ></CoTextArea>
        <DictResultPanel
          v-else-if="base.config.value['contrastDict'] && dictResult.valid"
          class="hArea"
        ></DictResultPanel>
      </div>
    </div>
    <div v-else class="maxNoPad">
      <div
        :style="topStyle"
        class="areaWarpper"
        @wheel="wheelHandler($event, 'source')"
        @keydown.ctrl.187="keyboardFontHandler($event, 'source')"
        @keydown.ctrl.189="keyboardFontHandler($event, 'source')"
        @keyup.ctrl.enter="translate"
        @contextmenu.prevent="base.openMenu('contrastContext')"
      >
        <textarea
          v-bind:style="sourceFontStyle"
          :placeholder="trans['source'] || 'Source'"
          @keyup.ctrl.enter="translate"
          @keyup.ctrl.g="google"
          @keyup.ctrl.b="baidu"
          @keyup.ctrl.p="command"
          class="vArea"
          v-model="sourceText"
        ></textarea>
      </div>
      <div
        id="vDrag"
        class="resizer"
        style="height: 4px; cursor: row-resize;"
        @mousedown="vMousedown"
      ></div>
      <div
        :style="bottomStyle"
        class="areaWarpper"
        @wheel="wheelHandler($event, 'result')"
        @keydown.ctrl.187="keyboardFontHandler($event, 'result')"
        @keydown.ctrl.189="keyboardFontHandler($event, 'result')"
        tabindex="-1"
      >
        <DiffTextArea v-if="multiSource" class="vArea"></DiffTextArea>
        <CoTextArea
          class="vArea"
          v-else-if="!base.config.value['contrastDict'] || !dictResult.valid"
          v-bind:style="resultFontStyle"
          :sentences="sharedResult ? sharedResult.transPara : []"
          :chineseStyle="sharedResult ? sharedResult.chineseStyle : false"
          ref="myhead"
        ></CoTextArea>
        <DictResultPanel
          v-else-if="base.config.value['contrastDict'] && dictResult.valid"
          class="vArea"
        ></DictResultPanel>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useBaseView } from "../components/useBaseView";
import Focus from "./Focus.vue";
import CoTextArea from "./CoTextArea.vue";
import DiffTextArea from "./DiffTextArea.vue";
import DictResultPanel from "./DictResult.vue";

const base = useBaseView(() => getModifiedText());

const left = ref(0);
const top = ref(0);
const visible = ref(false);
const funcID = ref<any>(null);
const selectedText = ref("");

const x = ref(0);
const y = ref(0);
const leftWidth = ref(0);
const fullWidth = ref(0);
const fullHeight = ref(0);
const leftHeight = ref(0);

const layoutType = base.layoutType;
const layoutConfig = base.layoutConfig;
const multiSource = base.multiSource;
const dictResult = base.dictResult;
const trans = base.trans;
const fontColor = base.fontColor;
const contentPadding = base.contentPadding;
const contentLineHeight = base.contentLineHeight;
const titlebarHeight = base.titlebarHeight;

const sharedResult = base.sharedResult;

const sourceText = computed({
  get: () => base.sharedResult.value?.text || "",
  set: (val: string) => {
    if (base.sharedResult.value) {
      base.sharedResult.value.text = val;
    }
  }
});

const ratio = computed({
  get: () => base.layoutConfig.value.ratio || 0.5,
  set: (val: number) => {
    base.updateLayoutConfig({ ratio: val });
  }
});

const mousedown = (e: MouseEvent) => {
  x.value = e.clientX;
  const resizer = document.getElementById("hDrag") as any;
  const leftSide = resizer.previousElementSibling;
  const rightSide = resizer.nextElementSibling;
  leftSide.style.userSelect = "none";
  leftSide.style.pointerEvents = "none";
  rightSide.style.userSelect = "none";
  rightSide.style.pointerEvents = "none";
  fullWidth.value = resizer.parentNode.getBoundingClientRect().width;
  leftWidth.value = leftSide.getBoundingClientRect().width;
  document.addEventListener("mousemove", mouseMoveHandler);
  document.addEventListener("mouseup", mouseUpHandler);
};

const mouseMoveHandler = (e: MouseEvent) => {
  const dx = e.clientX - x.value;
  ratio.value = (leftWidth.value + 2 + dx) / fullWidth.value;
};

const mouseUpHandler = () => {
  const resizer = document.getElementById("hDrag") as any;
  const leftSide = resizer.previousElementSibling;
  const rightSide = resizer.nextElementSibling;

  leftSide.style.removeProperty("user-select");
  leftSide.style.removeProperty("pointer-events");

  rightSide.style.removeProperty("user-select");
  rightSide.style.removeProperty("pointer-events");

  document.removeEventListener("mousemove", mouseMoveHandler);
  document.removeEventListener("mouseup", mouseUpHandler);
};

const vMousedown = (e: MouseEvent) => {
  y.value = e.clientY;
  const resizer = document.getElementById("vDrag") as any;
  const leftSide = resizer.previousElementSibling;
  const rightSide = resizer.nextElementSibling;
  leftSide.style.userSelect = "none";
  leftSide.style.pointerEvents = "none";
  rightSide.style.userSelect = "none";
  rightSide.style.pointerEvents = "none";
  fullHeight.value = resizer.parentNode.getBoundingClientRect().height;
  leftHeight.value = leftSide.getBoundingClientRect().height;
  document.addEventListener("mousemove", vMouseMoveHandler);
  document.addEventListener("mouseup", vMouseUpHandler);
};

const vMouseMoveHandler = (e: MouseEvent) => {
  const dy = e.clientY - y.value;
  ratio.value = (leftHeight.value + 2 + dy) / fullHeight.value;
};

const vMouseUpHandler = () => {
  const resizer = document.getElementById("vDrag") as any;
  const leftSide = resizer.previousElementSibling;
  const rightSide = resizer.nextElementSibling;

  leftSide.style.removeProperty("user-select");
  leftSide.style.removeProperty("pointer-events");

  rightSide.style.removeProperty("user-select");
  rightSide.style.removeProperty("pointer-events");

  document.removeEventListener("mousemove", vMouseMoveHandler);
  document.removeEventListener("mouseup", vMouseUpHandler);
};

const leftStyle = computed(() => ({
  width: `calc(${ratio.value * 100}% - 2px)`,
}));

const rightStyle = computed(() => ({
  width: `calc(${(1 - ratio.value) * 100}% - 2px)`,
  "overscroll-behavior": "contain",
  overflow: "auto",
}));

const topStyle = computed(() => ({
  height: `calc(${ratio.value * 100}% - 2px)`,
}));

const bottomStyle = computed(() => ({
  height: `calc(${(1 - ratio.value) * 100}% - 2px)`,
  "overscroll-behavior": "contain",
  overflow: "auto",
}));

const getModifiedText = () => {
  return sourceText.value;
};

const onSelect = (event: Event) => {
  const target = event.target as any;
  const selText = target.value.substring(
    target.selectionStart,
    target.selectionEnd
  );
  selectedText.value = selText;
  visible.value = true;
};

const deSelect = () => {
  visible.value = false;
};

const mouseMove = (event: MouseEvent) => {
  if (!visible.value) {
    left.value = event.clientX + 10;
    top.value = event.clientY - 50;
  }
};

const wheelHandler = base.wheelHandler;
const keyboardFontHandler = base.keyboardFontHandler;
const sourceFontStyle = computed(() => ({
  fontSize: `${base.sourceSize.value}px`,
  height: "100%",
  overflow: "auto",
  color: fontColor.value,
  caretColor: fontColor.value,
}));

const resultFontStyle = computed(() => ({
  fontSize: `${base.resultSize.value}px`,
  height: "100%",
  color: fontColor.value,
  caretColor: fontColor.value,
}));

const maxParent = computed(() => ({
  height: `calc(100vh - ${titlebarHeight.value})`,
  width: "100%",
  padding: "0px",
  "--content-padding": `${contentPadding.value}px`,
  "--content-line-height": contentLineHeight.value.toString(),
}));

const translate = base.translate;
const google = base.google;
const baidu = base.baidu;
const command = base.command;
</script>

<style scoped>
.hArea {
  height: 100%;
  width: 100%;
  resize: none;
  padding: var(--content-padding);
  line-height: var(--content-line-height);
  margin: 0px;
  box-sizing: border-box;
  border: 0;
  outline: none;
  background: transparent;
}
.vArea {
  width: 100%;
  resize: none;
  padding: var(--content-padding);
  line-height: var(--content-line-height);
  margin: 0px;
  box-sizing: border-box;
  border: 0;
  outline: none;
  background: transparent;
}
.hArea:focus,
.vArea:focus {
  box-shadow: inset 0 0 0 1px rgba(142, 36, 170, 0.42);
}
.hArea::placeholder,
.vArea::placeholder {
  color: currentColor;
  opacity: 0.36;
}
.maxNoPad {
  height: 100%;
  width: 100%;
  padding: 0px;
  overflow: hidden;
}

.areaWarpper {
  padding: 0px;
  overflow: hidden;
}
.focusArea {
  overflow: auto;
}

.resizer {
  user-select: none;
  background-color: rgba(142, 36, 170, 0.32);
  transition: background-color 0.12s ease;
}
.resizer:hover {
  background-color: rgba(142, 36, 170, 0.72);
}
</style>
