<template>
  <div :class="['action-item', actionLayoutClass]">
    <v-tooltip v-if="action" location="bottom" open-delay="100" :disabled="!tooltip">
      <template v-slot:activator="{ props }">
        <div class="actionStyle" v-bind="props">
          <div
            v-if="action.actionType === 'checkbox'"
            :class="['action-row', { 'action-row-active': Boolean(value) }]"
          >
            <span class="action-label">{{ trans[action.id] }}</span>
            <v-switch
              v-model="value"
              class="action-switch"
              color="primary"
              density="compact"
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
              class="action-color-picker"
            ></v-color-picker>
          </v-dialog>
          <p
            v-else-if="action.actionType === 'prompt'"
            class="pStyle"
          >
            {{ trans[action.id] }}
          </p>
          <MultiSelect
            v-else-if="action.actionType === 'multi_select'"
            :identifier="action.id"
          ></MultiSelect>
          <div
            v-else-if="action.actionType === 'constant'"
            class="action-row action-row-control"
          >
            <span class="action-label">{{ trans[identifier] }}</span>
            <v-text-field
              v-model="value"
              class="action-control"
              :type="constantInputType"
              density="compact"
              variant="outlined"
              hide-details
            ></v-text-field>
          </div>
          <div
            v-else-if="action.actionType === 'submenu'"
            class="action-row action-row-control"
          >
            <span class="action-label">{{ trans[identifier] }}</span>
            <v-select
              v-model="command"
              :items="action.submenu"
              item-title="label"
              item-value="id"
              class="action-control"
              density="compact"
              variant="outlined"
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
  compose,
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
    return compose([String(props.identifier), String(value.value)]);
  },
  set: (cmd: string) => {
    base.callback(cmd);
  }
});

const value = computed({
  get: () => base.config.value[props.identifier],
  set: (val: any) => {
    base.callback(props.identifier, normalizeConfigValue(val));
  }
});

const constantInputType = computed(() =>
  typeof base.config.value[props.identifier] === "number" ? "number" : "text"
);

const normalizeConfigValue = (val: any) => {
  if (typeof base.config.value[props.identifier] !== "number") {
    return val;
  }
  const numericValue = Number(val);
  return Number.isFinite(numericValue) ? numericValue : val;
};

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
  gap: 10px;
  min-height: 42px;
  border-radius: 6px;
  padding: 5px 8px;
  position: relative;
  transition: background-color 0.12s ease;
}
.action-row:hover {
  background: rgba(var(--v-theme-on-surface), 0.045);
}
.action-row-active {
  background: rgba(var(--v-theme-primary), 0.1);
}
.action-row-active::before {
  background: rgb(var(--v-theme-primary));
  border-radius: 999px;
  content: "";
  height: 18px;
  left: 2px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
}
.action-label {
  flex: 1 1 auto;
  font-size: 13px;
  line-height: 18px;
  min-width: 0;
  text-align: left;
}
.action-control {
  flex: 0 0 auto;
  max-width: 240px;
  min-width: 150px;
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
  font-weight: 700;
}
.action-color-picker {
  margin: 10px auto;
}

@media (max-width: 560px) {
  .action-row-control {
    align-items: stretch;
    flex-direction: column;
    gap: 6px;
  }

  .action-control {
    max-width: none;
    min-width: 0;
    width: 100%;
  }
}
</style>
