<template>
  <div :class="['action-item', actionLayoutClass]">
    <v-tooltip v-if="action" location="bottom" open-delay="100" :disabled="!tooltip">
      <template v-slot:activator="{ props }">
        <div class="actionStyle" v-bind="props">
          <div v-if="action.actionType === 'checkbox'" class="action-row">
            <span class="action-label">{{ trans[action.id] }}</span>
            <v-switch
              v-model="value"
              class="action-switch"
              color="primary"
              hide-details
            ></v-switch>
          </div>
          <v-dialog
            v-else-if="action.id === 'newConfigSnapshot'"
            v-model="dialog"
          >
            <template v-slot:activator="{ props: dialogProps }">
              <SimpleButton v-bind="dialogProps" class="actionButton">
                {{ trans[identifier] }}
              </SimpleButton>
            </template>
            <v-card>
              <v-text-field
                class="mytext"
                v-model="text"
                :rules="rules"
                :label="trans['snapshotPrompt']"
              ></v-text-field>
              <SimpleButton
                @click="
                  callback(identifier, text);
                  dialog = false;
                  text = '';
                "
                :disabled="invalidSnapshotName"
                class="actionButton"
                >{{ trans[identifier] }}
              </SimpleButton>
            </v-card>
          </v-dialog>
          <v-menu v-else-if="action.actionType === 'param_normal'">
            <template v-slot:activator="{ props: menuProps }">
              <SimpleButton v-bind="menuProps" class="actionButton">
                {{ trans[action.id] }}
              </SimpleButton>
            </template>
            <v-list>
              <v-list-item
                v-for="(item, index) in action.submenu"
                :key="index"
                @click="callback(item.id)"
              >
                <v-list-item-title>{{ item.label }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-dialog v-else-if="action.actionType == 'color_picker'">
            <template v-slot:activator="{ props: pickerProps }">
              <SimpleButton v-bind="pickerProps" class="actionButton">
                <span class="action-button-content">
                  <span>{{ trans[action.id] }}</span>
                  <span
                    class="action-color-preview"
                    :style="{ background: color }"
                  ></span>
                </span>
              </SimpleButton>
            </template>
            <v-color-picker
              v-model="color"
              flat
              show-swatches
              style="margin: 10px auto;"
            ></v-color-picker>
          </v-dialog>
          <p
            v-else-if="action.actionType === 'prompt'"
            style="text-align: left; font-weight: bold;"
            class="pStyle"
          >
            {{ trans[action.id] }}
          </p>
          <MultiSelect
            v-else-if="action.actionType === 'multi_select'"
            :identifier="action.id"
          ></MultiSelect>
          <div v-else-if="action.actionType === 'constant'" class="action-row">
            <span class="action-label">{{ trans[identifier] }}</span>
            <v-text-field
              v-model="value"
              class="action-control"
              dense
              hide-details
            ></v-text-field>
          </div>
          <div v-else-if="action.actionType === 'submenu'" class="action-row">
            <span class="action-label">{{ trans[identifier] }}</span>
            <v-select
              v-model="command"
              :items="action.submenu"
              item-title="label"
              item-value="id"
              class="action-control"
              dense
              hide-details
            >
            </v-select>
          </div>
          <div v-else-if="action.actionType === 'normal'">
            <SimpleButton @click="callback(action.id)" class="actionButton">
              {{ trans[action.id] }}
            </SimpleButton>
          </div>
        </div>
      </template>
      <span>{{ tooltip }}</span>
    </v-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useBase } from "./useBase";
import MultiSelect from "./MultiSelect.vue";
import SimpleButton from "./SimpleButton.vue";
import bus from "../common/event-bus";
import {
  swatches,
  snapshotNameRules,
  isValidSnapshotName,
} from "../common/types";

const props = defineProps<{
  identifier: any;
}>();

const base = useBase();
const trans = base.trans;
const callback = base.callback;

const action = ref((window as any).$controller.action.getAction(props.identifier));

const dialog = ref(false);
const text = ref("");
const rules = snapshotNameRules;

const invalidSnapshotName = computed(() => !isValidSnapshotName(text.value));

const tooltip = computed(() => {
  if (!action.value || action.value.actionType === "prompt") return undefined;
  return base.trans.value[`<tooltip>${action.value.id}`];
});

const command = computed({
  get: () => {
    return `${props.identifier}-${value.value}`;
  },
  set: (cmd: string) => {
    base.callback(cmd);
  }
});

const value = computed({
  get: () => base.config.value[props.identifier],
  set: (val: any) => {
    base.callback(props.identifier, val);
  }
});

const color = computed({
  get: () => {
    const col = value.value || { light: "#000000", dark: "#ffffff" };
    return col.light;
  },
  set: (val: string) => {
    base.callback(props.identifier, { ...value.value, light: val, dark: val });
  }
});

const sync = () => {
  action.value = (window as any).$controller.action.getAction(props.identifier);
};

onMounted(() => {
  if (action.value && ["submenu", "param_normal"].includes(action.value.actionType)) {
    bus.gon(props.identifier, sync);
  }
});

const actionLayoutClass = computed(() => {
  if (!action.value) return "";
  if (["prompt", "multi_select"].includes(action.value.actionType)) return "action-span-full";
  if (action.value.layout?.span && action.value.layout.span >= 1) return "action-span-full";
  return "";
});
</script>

<style scoped>
.action-item {
  width: 100%;
}
.action-span-full {
  width: 100%;
}
.actionStyle {
  margin-top: 0px;
  margin-left: 2px;
  margin-right: 2px;
  text-align: left;
}
.action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 6px;
}
.action-label {
  flex: 1 1 auto;
  text-align: left;
}
.action-control {
  flex: 0 0 auto;
  min-width: 160px;
  max-width: 260px;
}
.action-switch {
  margin: 0;
}
.actionButton :deep(.defaultBtn) {
  width: 100%;
  min-width: 0;
}
.action-button-content {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.action-color-preview {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.2);
}
.pStyle {
  margin-bottom: 4px;
  text-align: left;
}
</style>
