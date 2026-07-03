<template>
  <v-tooltip location="bottom" open-delay="100" :disabled="(!tooltipText||!onContrast)">
    <template v-slot:activator="{ props }">
      <v-btn
        v-bind="props"
        color="primary"
        size="small"
        depressed
        tile
        :variant="config.transparency > 0.5 && onContrast ? 'outlined' : 'flat'"
        class="btn"
        :style="{ height: btnSize.height, width: btnSize.width }"
        @click="handle(left_click, true)"
        @contextmenu.prevent="handle(right_click, false)"
      >
        <v-icon :size="btnSize.font">{{ icon }}</v-icon>
      </v-btn>
    </template>
    <span>{{ tooltipText }}</span>
  </v-tooltip>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useBase } from "./useBase";
import bus from "../common/event-bus";
import { PredefinedActionButton } from "../common/types";

const props = withDefaults(defineProps<{
  icon?: string;
  left_click?: string;
  right_click?: string;
  tooltip?: string;
  predefined?: PredefinedActionButton;
  onContrast?: boolean;
}>(), {
  onContrast: true
});

const base = useBase();
const trans = base.trans;
const config = base.config;

const tooltipText = computed(() => {
  if (props.tooltip === undefined) {
    let descs = [];
    if (props.left_click !== undefined) {
      descs.push(
        `${trans.value["left_click"] || "左击"}${getActionName(props.left_click)}`
      );
    }
    if (props.right_click !== undefined) {
      descs.push(
        `${trans.value["right_click"] || "右击"}${getActionName(props.right_click)}`
      );
    }
    return descs.join("，");
  } else {
    if (trans.value[props.tooltip] !== undefined) {
      return trans.value[props.tooltip];
    } else {
      return props.tooltip;
    }
  }
});

const getActionName = (name: string) => {
  if (trans.value[name]) {
    return trans.value[name];
  } else {
    return name;
  }
};

const handle = (identifier: string | undefined, isLeft: boolean) => {
  if (identifier === undefined) return;
  bus.at("dispatch", identifier);
};

const btnSize = computed(() => {
  return {
    height: base.titlebarHeight.value,
    width: `${base.titlebarHeightVal.value + 8}px`,
    font: Math.ceil(base.titlebarHeightVal.value * 0.7),
  };
});
</script>

<style scoped>
.btn {
  padding: 0px !important;
  min-width: 0px !important;
}
</style>
