<template>
  <div class="multi-select">
    <div class="multi-select-label">{{ trans[identifier] || identifier }}</div>
    <v-select
      v-model="value"
      :items="translatorItems"
      item-title="label"
      item-value="value"
      density="compact"
      variant="outlined"
      hide-details
      multiple
      chips
    >
    </v-select>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Identifier } from "../common/types";
import { useBase } from "./useBase";
import { TranslatorNameResolver } from "@/common/translate/translator-name-resolver";

const props = defineProps<{
  identifier: Identifier;
}>();

const base = useBase();
const trans = base.trans;

const action = computed(() =>
  (window as any).$controller.action.getAction(props.identifier)
);

const translatorItems = computed(() => {
  return (action.value.submenu || []).map((item: any) => {
    const value = String(item.id).split("|").pop() || item.id;
    const resolvedLabel = TranslatorNameResolver.getDisplayName(
      value,
      trans.value
    );
    return {
      label: item.label && item.label !== value ? item.label : resolvedLabel,
      value,
    };
  });
});

const visibleValues = computed(
  () => new Set(translatorItems.value.map((item) => item.value))
);

const normalizedValue = computed(() => {
  return (base.config.value[props.identifier] || []).filter((item: string) =>
    visibleValues.value.has(item)
  );
});

const value = computed({
  get: () => normalizedValue.value,
  set: (val: any) => {
    base.callback(props.identifier, val);
  }
});
</script>

<style scoped>
.multi-select {
  text-align: left;
}

.multi-select-label {
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
  margin-bottom: 6px;
}
</style>
