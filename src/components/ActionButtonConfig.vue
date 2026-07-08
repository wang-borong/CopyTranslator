<template>
  <div class="action-button-config">
    <Action identifier="actionSortPrompt"></Action>
    <v-expansion-panels class="button-panels">
      <v-expansion-panel
        v-for="(button, index) in buttons"
        :key="index"
        class="button-panel"
      >
        <v-expansion-panel-title>
          <div class="button-row">
            <div class="button-meta">
              <v-icon>{{ button.icon || 'mdi-help-circle' }}</v-icon>
              <span class="button-name">
                {{ tooltipText(button) || trans["custom"] || "自定义" }}
              </span>
            </div>
            <div class="button-order-actions" @click.stop>
              <v-btn
                size="x-small"
                icon
                variant="plain"
                :disabled="index === 0"
                @click="moveUp(index)"
              >
                <v-icon size="small">mdi-arrow-up</v-icon>
              </v-btn>
              <v-btn
                size="x-small"
                icon
                variant="plain"
                :disabled="index === buttons.length - 1"
                @click="moveDown(index)"
              >
                <v-icon size="small">mdi-arrow-down</v-icon>
              </v-btn>
            </div>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="button-editor">
            <v-btn variant="tonal" color="primary" @click="toSelectIcon">
              <v-icon size="16" class="mr-1">mdi-open-in-new</v-icon>
              {{ trans["chooseIconPrompt"] }}
            </v-btn>
            <v-text-field
              v-model="button.icon"
              @update:model-value="update()"
              :label="trans['icon'] || 'Icon'"
              density="compact"
              variant="outlined"
              hide-details
            ></v-text-field>
            <v-select
              v-model="button.left_click"
              @update:model-value="update()"
              :label="trans['left_click'] || '左击'"
              :items="actionCandidates"
              item-title="text"
              item-value="value"
              density="compact"
              variant="outlined"
              hide-details
            ></v-select>
            <v-select
              v-model="button.right_click"
              :label="trans['right_click'] || '右击'"
              :items="actionCandidates"
              item-title="text"
              item-value="value"
              @update:model-value="update()"
              density="compact"
              variant="outlined"
              hide-details
            ></v-select>
            <v-text-field
              v-model="button.tooltip"
              @update:model-value="update()"
              :label="trans['tooltip'] || 'Tooltip'"
              density="compact"
              variant="outlined"
              hide-details
            ></v-text-field>
            <v-btn variant="tonal" color="error" @click="remove(index)">
              <v-icon size="16" class="mr-1">mdi-delete</v-icon>
              {{ trans["delete"] }}
            </v-btn>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <div v-if="buttons.length === 0" class="button-empty">
      <v-icon size="26">mdi-gesture-tap-button</v-icon>
      {{ trans["noItems"] || "暂无项目" }}
    </div>
    <div class="button-footer">
      <v-btn color="primary" variant="tonal" @click="add">
        <v-icon size="16" class="mr-1">mdi-plus</v-icon>
        {{ trans["addNewActionButton"] }}
      </v-btn>
      <v-btn variant="tonal" @click="restore">
        <v-icon size="16" class="mr-1">mdi-restore</v-icon>
        {{ trans["restoreMultiDefault"] }}
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useBase } from "./useBase";
import Action from "./Action.vue";
import { ActionButton } from "../common/types";
import { openUrl } from "@/tauri/open-url";

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
        formatActionHint(
          trans.value["left_click"] || "左击",
          getActionName(actionButton.left_click)
        )
      );
    }
    if (actionButton.right_click !== undefined) {
      descs.push(
        formatActionHint(
          trans.value["right_click"] || "右击",
          getActionName(actionButton.right_click)
        )
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

const formatActionHint = (prefix: string, actionName: string) => {
  return /[A-Za-z0-9]$/.test(prefix)
    ? `${prefix} ${actionName}`
    : `${prefix}${actionName}`;
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

<style scoped>
.action-button-config {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  overflow: auto;
  padding-right: 4px;
}
.button-panels {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  overflow: hidden;
}
.button-panel + .button-panel {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.09);
}
.button-row {
  align-items: center;
  display: flex;
  justify-content: space-between;
  min-width: 0;
  padding-right: 12px;
  width: 100%;
}
.button-meta {
  align-items: center;
  display: flex;
  gap: 10px;
  min-width: 0;
}
.button-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.button-order-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 2px;
}
.button-editor {
  background: rgba(var(--v-theme-on-surface), 0.025);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  border-radius: 8px;
  display: grid;
  gap: 10px;
  padding: 12px;
}
.button-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}
.button-empty {
  align-items: center;
  color: rgba(var(--v-theme-on-surface), 0.58);
  display: flex;
  flex-direction: column;
  font-size: 12px;
  gap: 6px;
  justify-content: center;
  min-height: 96px;
}
</style>
