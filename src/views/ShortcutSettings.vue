<template>
  <div class="shortcut-settings">
    <div class="shortcut-toolbar">
      <div class="shortcut-summary">
        <div class="shortcut-title">{{ trans["shortcuts"] || "快捷键" }}</div>
        <div class="shortcut-subtitle">
          {{ trans["shortcutConfigTip"] || "点击输入框后按下新的组合键；留空可禁用该快捷键。" }}
        </div>
      </div>
      <div class="shortcut-actions">
        <v-btn size="small" variant="tonal" @click="restoreDefaults">
          <v-icon size="16" class="mr-1">mdi-restore</v-icon>
          {{ trans["restoreDefault"] || "恢复默认设置" }}
        </v-btn>
        <v-btn size="small" color="primary" :disabled="!canSave" @click="save">
          <v-icon size="16" class="mr-1">mdi-content-save</v-icon>
          {{ trans["saveConfig"] || "保存配置" }}
        </v-btn>
      </div>
    </div>

    <v-alert
      v-if="duplicateAccelerators.length > 0"
      type="warning"
      density="compact"
      variant="tonal"
      class="mb-3"
    >
      {{ trans["shortcutConflict"] || "存在重复快捷键" }}:
      {{ duplicateAccelerators.join(", ") }}
    </v-alert>

    <v-alert
      v-if="saveMessage"
      :type="saveMessageType"
      density="compact"
      variant="tonal"
      class="mb-3"
    >
      {{ saveMessage }}
    </v-alert>

    <div class="shortcut-groups">
      <section class="shortcut-group">
        <div class="shortcut-group-title">
          <v-icon size="18">mdi-earth</v-icon>
          <span>{{ trans["globalShortcuts"] || "全局快捷键" }}</span>
        </div>
        <div class="shortcut-list">
          <div v-for="row in globalRows" :key="row.id" class="shortcut-row">
            <div class="shortcut-meta">
              <div class="shortcut-name">{{ actionLabel(row.id) }}</div>
              <div class="shortcut-id">{{ row.id }}</div>
            </div>
            <v-text-field
              v-model="globalShortcuts[row.id]"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              class="shortcut-input"
              :placeholder="trans['shortcutCapturePlaceholder'] || '按快捷键'"
              @keydown.prevent="captureShortcut('global', row.id, $event)"
            ></v-text-field>
          </div>
        </div>
      </section>

      <section class="shortcut-group">
        <div class="shortcut-group-title">
          <v-icon size="18">mdi-window-restore</v-icon>
          <span>{{ trans["localShortcuts"] || "窗口内快捷键" }}</span>
        </div>
        <div class="shortcut-list">
          <div v-for="row in localRows" :key="row.id" class="shortcut-row">
            <div class="shortcut-meta">
              <div class="shortcut-name">{{ actionLabel(row.id) }}</div>
              <div class="shortcut-id">{{ row.id }}</div>
            </div>
            <v-text-field
              v-model="localShortcuts[row.id]"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              class="shortcut-input"
              :placeholder="trans['shortcutCapturePlaceholder'] || '按快捷键'"
              @keydown.prevent="captureShortcut('local', row.id, $event)"
            ></v-text-field>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useBase } from "@/components/useBase";
import {
  Accelerator,
  defaultGlobalShortcuts,
  defaultLocalShortcuts,
  loadGlobalShortcuts,
  loadLocalShortcuts,
  saveGlobalShortcuts,
  saveLocalShortcuts,
} from "@/common/shortcuts";

type ShortcutScope = "global" | "local";

const base = useBase();
const trans = base.trans;

const globalShortcuts = ref<Record<string, Accelerator>>({});
const localShortcuts = ref<Record<string, Accelerator>>({});
const saveMessage = ref("");
const saveMessageType = ref<"success" | "error">("success");

const toRecord = (shortcuts: Map<string, Accelerator>) =>
  Object.fromEntries(shortcuts.entries()) as Record<string, Accelerator>;

const toMap = (record: Record<string, Accelerator>) =>
  new Map(
    Object.entries(record)
      .map(
        ([id, accelerator]) =>
          [id, String(accelerator || "").trim()] as [string, Accelerator]
      )
      .filter(([id]) => id.trim().length > 0)
  );

const mergeRows = (
  current: Record<string, Accelerator>,
  defaults: Map<string, Accelerator>
) => {
  const ordered = Array.from(defaults.keys());
  const additional = Object.keys(current).filter((id) => !defaults.has(id));
  return [...ordered, ...additional].map((id) => ({ id }));
};

const globalRows = computed(() =>
  mergeRows(globalShortcuts.value, defaultGlobalShortcuts)
);

const localRows = computed(() =>
  mergeRows(localShortcuts.value, defaultLocalShortcuts)
);

const duplicateAccelerators = computed(() => {
  const values = [
    ...Object.values(globalShortcuts.value),
    ...Object.values(localShortcuts.value),
  ]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set(values.filter((value, index) => values.indexOf(value) !== index)));
});

const canSave = computed(() => duplicateAccelerators.value.length === 0);

const load = () => {
  globalShortcuts.value = toRecord(loadGlobalShortcuts());
  localShortcuts.value = toRecord(loadLocalShortcuts());
  saveMessage.value = "";
};

const restoreDefaults = () => {
  globalShortcuts.value = toRecord(defaultGlobalShortcuts);
  localShortcuts.value = toRecord(defaultLocalShortcuts);
  saveMessage.value = "";
};

const actionLabel = (id: string) => {
  return trans.value[id] || id;
};

const keyFromEvent = (event: KeyboardEvent) => {
  const codeMap: Record<string, string> = {
    Backquote: "`",
    Minus: "-",
    Equal: "=",
    BracketLeft: "[",
    BracketRight: "]",
    Backslash: "\\",
    Semicolon: ";",
    Quote: "'",
    Comma: ",",
    Period: ".",
    Slash: "/",
    Space: "Space",
    Escape: "Escape",
    Enter: "Enter",
    Tab: "Tab",
    Backspace: "Backspace",
    Delete: "Delete",
    ArrowUp: "Up",
    ArrowDown: "Down",
    ArrowLeft: "Left",
    ArrowRight: "Right",
  };
  if (event.code.startsWith("Key")) return event.code.slice(3).toUpperCase();
  if (event.code.startsWith("Digit")) return event.code.slice(5);
  if (/^F\d{1,2}$/.test(event.code)) return event.code;
  if (codeMap[event.code]) return codeMap[event.code];
  if (["Control", "Shift", "Alt", "Meta"].includes(event.key)) return "";
  return event.key.length === 1 ? event.key.toUpperCase() : event.key;
};

const formatShortcut = (event: KeyboardEvent) => {
  const key = keyFromEvent(event);
  if (!key) return "";
  const parts: string[] = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.metaKey) parts.push("Super");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  parts.push(key);
  return parts.join("+");
};

const captureShortcut = (scope: ShortcutScope, id: string, event: KeyboardEvent) => {
  const shortcut = formatShortcut(event);
  if (!shortcut) return;
  if (scope === "global") {
    globalShortcuts.value[id] = shortcut;
  } else {
    localShortcuts.value[id] = shortcut;
  }
};

const save = async () => {
  if (!canSave.value) return;
  try {
    saveGlobalShortcuts(toMap(globalShortcuts.value));
    saveLocalShortcuts(toMap(localShortcuts.value));
    await (window as any).$controller.reloadShortcuts();
    saveMessage.value = trans.value["shortcutSaveSuccess"] || "快捷键已保存";
    saveMessageType.value = "success";
  } catch (err) {
    console.error("Failed to save shortcuts:", err);
    saveMessage.value = trans.value["shortcutSaveFailed"] || "快捷键保存失败";
    saveMessageType.value = "error";
  }
};

onMounted(load);
</script>

<style scoped>
.shortcut-settings {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: auto;
}

.shortcut-toolbar {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 12px;
}

.shortcut-title {
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
}

.shortcut-subtitle {
  color: rgba(var(--v-theme-on-surface), 0.66);
  font-size: 12px;
  line-height: 18px;
}

.shortcut-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}

.shortcut-groups {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.shortcut-group {
  background: rgba(var(--v-theme-surface), 0.72);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  overflow: hidden;
}

.shortcut-group-title {
  align-items: center;
  background: rgba(var(--v-theme-on-surface), 0.035);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  display: flex;
  font-size: 13px;
  font-weight: 700;
  gap: 8px;
  padding: 10px 12px;
}

.shortcut-list {
  display: flex;
  flex-direction: column;
}

.shortcut-row {
  align-items: center;
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(120px, 1fr) minmax(150px, 220px);
  padding: 8px 12px;
}

.shortcut-row + .shortcut-row {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.09);
}

.shortcut-name {
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
}

.shortcut-id {
  color: rgba(var(--v-theme-on-surface), 0.58);
  font-size: 11px;
  line-height: 16px;
}

.shortcut-input {
  min-width: 0;
}

@media (max-width: 560px) {
  .shortcut-toolbar,
  .shortcut-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .shortcut-row {
    grid-template-columns: 1fr;
  }
}
</style>
