<template>
  <div
    contenteditable="true"
    class="dict"
    v-bind:style="dictStyle"
    v-if="dictResult && dictResult.valid"
    @contextmenu.prevent="base.openMenu('contrastContext')"
  >
    <div class="dict-word">{{ dictResult.words }}</div>
    <div
      v-if="dictResult.phonetics && dictResult.phonetics.length != 0"
      class="dict-section"
    >
      <div class="notation">{{ trans["phonetic"] }}</div>
      <div class="dict-phonetics">
        <span
          class="dictPhonetic"
          v-for="item in dictResult.phonetics"
          :key="item.type + item.value"
        >
          <span class="dict-phonetic-type">{{ item.type }}</span>
          {{ item.value }}
        </span>
      </div>
    </div>
    <div
      v-if="dictResult.explains && dictResult.explains.length > 0"
      class="dict-section"
    >
      <div class="notation">{{ trans["basicExplains"] }}</div>
      <div
        class="dictExp noMargin"
        v-for="item in dictResult.explains"
        :key="item.type + item.trans"
      >
        <span v-if="item.type.length > 0" class="dict-type">{{ item.type }}</span>
        <span>{{ item.trans }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useBaseView } from "./useBaseView";

const base = useBaseView(() => undefined);
const dictResult = base.dictResult;
const fontColor = base.fontColor;
const dictSize = base.dictSize;
const trans = base.trans;

const dictStyle = computed(() => {
  return {
    fontSize: `${dictSize.value}px`,
    height: "100%",
    color: fontColor.value,
  };
});
</script>

<style scoped>
.dict {
  text-align: left;
  height: 100%;
  overflow: auto;
  padding: 10px 12px;
  box-sizing: border-box;
}

.notation {
  color: var(--ct-muted-color, rgba(128, 128, 128, 0.9));
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 18px;
  margin-bottom: 6px;
}

.dict-word {
  color: rgb(var(--v-theme-primary));
  font-size: 1.22em;
  font-weight: 700;
  line-height: 1.35;
  margin-bottom: 10px;
  word-break: break-word;
}

.dict-section {
  border-top: 1px solid var(--ct-panel-border, rgba(128, 128, 128, 0.16));
  padding-top: 10px;
}

.dict-section + .dict-section {
  margin-top: 10px;
}

.dictExp {
  overflow: hidden;
  display: flex;
  gap: 8px;
  line-height: 1.6;
  padding: 3px 0;
}

.dict-phonetics {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.dictPhonetic,
.dict-type {
  align-items: center;
  background: var(--ct-hover-soft, rgba(128, 128, 128, 0.1));
  border: 1px solid var(--ct-panel-border, rgba(128, 128, 128, 0.16));
  border-radius: 6px;
  display: inline-flex;
  line-height: 18px;
  padding: 2px 6px;
}

.dict-type {
  color: var(--ct-muted-color, rgba(128, 128, 128, 0.9));
  flex: 0 0 auto;
  font-size: 0.88em;
  margin-top: 2px;
}

.dict-phonetic-type {
  color: var(--ct-muted-color, rgba(128, 128, 128, 0.9));
  font-size: 0.86em;
  margin-right: 4px;
}
.noMargin {
  margin: 0px;
}
</style>
