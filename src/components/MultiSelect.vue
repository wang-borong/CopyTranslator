<template>
  <div style="text-align: left;">
    <p>{{ trans[identifier] || identifier }}</p>
    <v-select
      v-model="value"
      :items="translatorTypes"
      style="margin: 0px; padding: 0px;"
      multiple
      chips
    >
    </v-select>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { translatorTypes, Identifier } from "../common/types";
import { useBase } from "./useBase";

const props = defineProps<{
  identifier: Identifier;
}>();

const base = useBase();
const trans = base.trans;

const value = computed({
  get: () => base.config.value[props.identifier] || [],
  set: (val: any) => {
    base.callback(props.identifier, val);
  }
});
</script>

<style scoped></style>
