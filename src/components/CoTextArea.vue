<template>
  <div
    class="co-textarea"
    contenteditable="true"
    @contextmenu.prevent="base.openMenu('contrastContext')"
  >
    <div class="co-textarea-content">
      <div v-if="chineseStyle">
        <span
          v-for="(val, key) in (sentences as string[])"
          :key="key"
          @mouseover="mouseOver(key)"
          class="co-line"
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
          <span class="co-line co-line-spaced">
            {{ val }}
          </span>
        </div>
      </div>
    </div>
    <div
      v-if="engineNotice"
      class="engine-notice"
      :class="{ clickable: engineNoticeClickable }"
      :title="engineNotice"
      contenteditable="false"
      @click="openEngineNotice"
    >
      {{ engineNotice }}
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
const engineNotice = base.engineNotice;
const engineNoticeClickable = base.engineNoticeClickable;
const openEngineNotice = base.openEngineNotice;

const targetIdx = ref(-1);
const mouseOver = (idx: number) => {
  targetIdx.value = idx;
};
</script>

<style scoped>
.co-textarea {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
.co-textarea-content {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}
.co-line {
  display: block;
  overflow-wrap: anywhere;
}
.co-line-spaced {
  padding-bottom: 5px;
}
.engine-notice {
  flex: 0 0 auto;
  margin-top: 6px;
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
