<template>
  <div class="bw-config">
    <Action :identifier="tipName"></Action>
    <Action :identifier="optionName"></Action>
    <Action :identifier="modeName"></Action>
    <v-alert
      v-if="config[modeName] !== globalName"
      type="warning"
      variant="tonal"
      density="compact"
      class="bw-alert"
    >
      {{ trans[promptName] }}
    </v-alert>
    <section v-if="config[modeName] === whitelistName" class="bw-panel">
      <div class="bw-title">{{ trans[whitelistName] }}:</div>
      <v-select
        v-model="whitelist"
        :items="config.activeWindows || []"
        density="compact"
        variant="outlined"
        hide-details
        multiple
        chips
      >
      </v-select>
      <div v-if="(config.activeWindows || []).length === 0" class="bw-empty">
        {{ trans["noActiveWindows"] || "暂无可选择窗口" }}
      </div>
    </section>
    <section v-if="config[modeName] === blacklistName" class="bw-panel">
      <div class="bw-title">{{ trans[blacklistName] }}:</div>
      <v-select
        v-model="blacklist"
        :items="config.activeWindows || []"
        density="compact"
        variant="outlined"
        hide-details
        multiple
        chips
      >
      </v-select>
      <div v-if="(config.activeWindows || []).length === 0" class="bw-empty">
        {{ trans["noActiveWindows"] || "暂无可选择窗口" }}
      </div>
    </section>
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

<style scoped>
.bw-config {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  overflow: auto;
  padding-right: 4px;
  text-align: left;
}
.bw-alert {
  margin: 2px 0;
}
.bw-panel {
  background: rgba(var(--v-theme-surface), 0.72);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  padding: 12px;
}
.bw-title {
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-size: 13px;
  font-weight: 700;
  line-height: 18px;
  margin-bottom: 8px;
}
.bw-empty {
  color: rgba(var(--v-theme-on-surface), 0.58);
  font-size: 12px;
  line-height: 18px;
  margin-top: 8px;
}
</style>
