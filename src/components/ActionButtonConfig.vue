<template>
  <div style="height: 100%; display: flex; flex-direction: column; gap: 10px;">
    <Action identifier="actionSortPrompt"></Action>
    <v-expansion-panels style="width: 100%;">
      <v-expansion-panel v-for="(button, index) in buttons" :key="index">
        <v-expansion-panel-title>
          <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding-right: 15px;">
            <div style="display: flex; align-items: center;">
              <v-icon>{{ button.icon || 'mdi-help-circle' }}</v-icon>
              <span style="margin-left: 10px;">
                {{ tooltipText(button) || trans["custom"] || "自定义" }}
              </span>
            </div>
            <div style="display: flex; gap: 5px;" @click.stop>
              <v-btn size="x-small" icon variant="plain" :disabled="index === 0" @click="moveUp(index)">
                <v-icon size="small">mdi-arrow-up</v-icon>
              </v-btn>
              <v-btn size="x-small" icon variant="plain" :disabled="index === buttons.length - 1" @click="moveDown(index)">
                <v-icon size="small">mdi-arrow-down</v-icon>
              </v-btn>
            </div>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div>
            <div style="text-align: center;">
              <SimpleButton @click="toSelectIcon">
                {{ trans["chooseIconPrompt"] }}
              </SimpleButton>
            </div>
            <v-text-field
              v-model="button.icon"
              @update:model-value="update()"
              label="icon"
            ></v-text-field>
            <v-select
              v-model="button.left_click"
              @update:model-value="update()"
              label="left_click"
              :items="actionCandidates"
              item-title="text"
              item-value="value"
            ></v-select>
            <v-select
              v-model="button.right_click"
              label="right_click"
              :items="actionCandidates"
              item-title="text"
              item-value="value"
              @update:model-value="update()"
            ></v-select>
            <v-text-field
              v-model="button.tooltip"
              @update:model-value="update()"
              label="tooltip"
            ></v-text-field>
            <div style="text-align: center;">
              <SimpleButton @click="remove(index)">{{
                trans["delete"]
              }}</SimpleButton>
            </div>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <div style="text-align: center; margin-top: 10px;">
      <SimpleButton @click="add">{{
        trans["addNewActionButton"]
      }}</SimpleButton>
      <SimpleButton @click="restore">{{
        trans["restoreMultiDefault"]
      }}</SimpleButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useBase } from "./useBase";
import SimpleButton from "./SimpleButton.vue";
import Action from "./Action.vue";
import { ActionButton } from "../common/types";
import { invoke } from "@tauri-apps/api/core";
const openUrl = (url: string) => {
  invoke("open_url", { url }).catch(err => {
    console.error("Failed to open URL:", err);
  });
};

interface Option {
  value: string;
  text: string;
}

const base = useBase();
const trans = base.trans;

const actionCandidates = ref<Option[]>([]);

const getActionName = (name: string) => {
  if (trans.value[name]) {
    return trans.value[name];
  } else {
    return name;
  }
};

const tooltipText = (actionButton: ActionButton): string => {
  if (actionButton.tooltip === undefined) {
    let descs = [];
    if (actionButton.left_click !== undefined) {
      descs.push(
        `${trans.value["left_click"] || "左击"}${getActionName(actionButton.left_click)}`
      );
    }
    if (actionButton.right_click !== undefined) {
      descs.push(
        `${trans.value["right_click"] || "右击"}${getActionName(actionButton.right_click)}`
      );
    }
    return descs.join("|");
  } else {
    if (trans.value[actionButton.tooltip] !== undefined) {
      return trans.value[actionButton.tooltip];
    } else {
      return actionButton.tooltip;
    }
  }
};

onMounted(() => {
  actionCandidates.value = [
    ...(window as any).$controller.action.getKeys("allActions"),
  ].map((x) => {
    return { value: x, text: getText(x) };
  });
});

const getText = (identifier: string) => {
  if (trans.value[identifier]) {
    return trans.value[identifier];
  } else {
    return identifier;
  }
};

const toSelectIcon = () => {
  openUrl("https://pictogrammers.com/library/mdi/");
};

const buttons = computed<ActionButton[]>({
  get: () => base.config.value.actionButtons || [],
  set: (newButtons) => {
    base.callback("actionButtons", newButtons);
  }
});

const update = () => {
  base.callback("actionButtons", buttons.value);
};

const add = () => {
  buttons.value.push({ icon: "mdi-help-circle" });
  update();
};

const remove = (index: number) => {
  buttons.value.splice(index, 1);
  update();
};

const moveUp = (index: number) => {
  if (index === 0) return;
  const list = [...buttons.value];
  const item = list[index];
  list[index] = list[index - 1];
  list[index - 1] = item;
  buttons.value = list;
  update();
};

const moveDown = (index: number) => {
  if (index === buttons.value.length - 1) return;
  const list = [...buttons.value];
  const item = list[index];
  list[index] = list[index + 1];
  list[index + 1] = item;
  buttons.value = list;
  update();
};

const restore = () => {
  base.callback("restoreDefault", "actionButtons");
};
</script>
