<template>
  <div>
    <Action :identifier="tipName"></Action>
    <Action :identifier="optionName"></Action>
    <br />
    <Action :identifier="modeName"></Action>
    <p v-if="config[modeName] !== globalName" style="color: red;">
      {{ trans[promptName] }}
    </p>
    <div v-if="config[modeName] === whitelistName">
      <p>{{ trans[whitelistName] }}:</p>
      <v-select
        v-model="whitelist"
        :items="config.activeWindows || []"
        style="margin: 0px; padding: 0px;"
        multiple
        chips
      >
      </v-select>
    </div>
    <div v-if="config[modeName] === blacklistName">
      <p>{{ trans[blacklistName] }}:</p>
      <v-select
        v-model="blacklist"
        :items="config.activeWindows || []"
        style="margin: 0px; padding: 0px;"
        multiple
        chips
      >
      </v-select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useBase } from "@/components/useBase";
import Action from "../components/Action.vue";

const props = defineProps<{
  optionName: string;
}>();

const base = useBase();
const trans = base.trans;
const config = base.config;

const modeName = computed(() => `${props.optionName}Mode`);
const blacklistName = computed(() => `${props.optionName}BlackList`);
const whitelistName = computed(() => `${props.optionName}WhiteList`);
const globalName = computed(() => `${props.optionName}Global`);
const tipName = computed(() => `${props.optionName}Tip`);
const promptName = computed(() => `${props.optionName}Prompt`);

const whitelist = computed({
  get: () => base.config.value[whitelistName.value] || [],
  set: (val: any) => {
    base.callback(whitelistName.value, val);
  }
});

const blacklist = computed({
  get: () => base.config.value[blacklistName.value] || [],
  set: (val: any) => {
    base.callback(blacklistName.value, val);
  }
});
</script>

<style scoped></style>
