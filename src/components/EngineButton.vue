<template>
  <v-tooltip location="bottom" open-delay="100" :disabled="!tooltipText">
    <template v-slot:activator="{ props }">
      <v-btn
        v-bind:class="[engineClass, 'engineBtnBase']"
        v-bind="props"
        @click="switchTranslator"
        color="white"
        icon
        :style="{ height: buttonSize, width: buttonSize }"
      ></v-btn>
    </template>
    <span>{{ tooltipText }}</span>
  </v-tooltip>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useBase } from "./useBase";
import { TranslatorNameResolver } from "@/common/translate/translator-name-resolver";
import "@/css/shared-styles.css";

const props = withDefaults(defineProps<{
  engine: string;
  valid?: boolean;
  tooltip?: string;
  enable?: boolean;
}>(), {
  valid: false,
  enable: true
});

const base = useBase();
const trans = base.trans;

const engineClass = computed(() => {
  return TranslatorNameResolver.getEngineClass(props.engine);
});

const buttonSize = computed(() => {
  return `${base.titlebarHeightVal.value - 2}px`;
});

const tooltipText = computed(() => {
  if (props.tooltip !== undefined) {
    return props.tooltip;
  }
  return TranslatorNameResolver.getDisplayName(props.engine, trans.value);
});

const switchTranslator = () => {
  if (!props.enable) return;
  if (props.valid) {
    base.callback("dictionaryType", props.engine);
  } else {
    if (props.engine === "copytranslator") {
      base.callback("multiSource", true);
    } else {
      base.callback("multiSource", false);
      base.callback("translatorType", props.engine);
    }
  }
};
</script>

<style scoped>
.engineBtnBase {
  border-radius: 8px !important;
  transition:
    filter 0.12s ease,
    opacity 0.12s ease,
    transform 0.12s ease;
}

.engineBtnBase:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.inactive {
  filter: grayscale(90%);
}
</style>
