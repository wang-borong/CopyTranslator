<template>
  <section class="translator-group-config">
    <div class="group-header">
      <div>
        <div class="group-title">{{ title }}</div>
        <div class="group-description" v-if="description">
          {{ description }}
        </div>
      </div>
      <v-btn
        icon
        size="small"
        @click="showAddDialog = true"
        color="primary"
        variant="tonal"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </div>

    <div class="group-list">
      <div v-for="(id, index) in localList" :key="id" class="group-item">
        <div class="group-item-index">{{ index + 1 }}</div>
        <div class="group-item-name">{{ getTranslatorName(id) }}</div>
        <div class="group-actions">
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
            :disabled="index === localList.length - 1"
            @click="moveDown(index)"
          >
            <v-icon size="small">mdi-arrow-down</v-icon>
          </v-btn>
          <v-btn
            icon
            size="x-small"
            variant="plain"
            @click="removeTranslator(index)"
            color="error"
          >
            <v-icon size="small">mdi-close</v-icon>
          </v-btn>
        </div>
      </div>
      <div v-if="localList.length === 0" class="group-empty">
        <v-icon size="22">mdi-playlist-remove</v-icon>
        {{ trans["noItems"] || "暂无项目" }}
      </div>
    </div>

    <!-- Add Dialog -->
    <v-dialog v-model="showAddDialog" max-width="400" scrollable>
      <v-card>
        <v-card-title class="subtitle-1">
          {{ trans["addTranslator"] || "添加翻译器" }}
        </v-card-title>
        <v-card-text class="translator-dialog-list">
          <v-list density="compact">
            <template v-if="remainingTranslators.length > 0">
              <v-list-item
                v-for="id in remainingTranslators"
                :key="id"
                @click="addTranslator(id)"
              >
                <template v-slot:append>
                  <v-icon size="small" color="primary">mdi-plus</v-icon>
                </template>
                <v-list-item-title>{{
                  getTranslatorName(id)
                }}</v-list-item-title>
              </v-list-item>
            </template>
            <v-list-item v-else>
              <v-list-item-title class="group-empty-title">
                {{ trans["noMoreTranslators"] || "没有更多可用翻译器" }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showAddDialog = false">{{
            trans["cancel"] || "取消"
          }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { TranslatorNameResolver } from "@/common/translate/translator-name-resolver";
import {
  filterExistingEngines,
  getEnabledWithCustomIds,
} from "@/common/translate/translators";
import { useBase } from "./useBase";
import eventBus from "@/common/event-bus";

const props = defineProps<{
  configKey: string;
  title: string;
  description?: string;
}>();

const base = useBase();
const trans = base.trans;

const showAddDialog = ref(false);
const localList = ref<string[]>([]);

const remainingTranslators = computed(() => {
  const enabled = base.config.value["translator-enabled"] || [];
  const custom = base.config.value["customTranslators"] || [];
  const active = getEnabledWithCustomIds(enabled, custom);
  const available = filterExistingEngines(active);
  return available.filter((id: string) => !localList.value.includes(id));
});

const syncLocalList = () => {
  const val = base.config.value[props.configKey];
  if (JSON.stringify(val) !== JSON.stringify(localList.value)) {
    localList.value = val ? [...val] : [];
  }
};

watch(() => base.config.value[props.configKey], () => {
  syncLocalList();
}, { deep: true });

onMounted(() => {
  syncLocalList();
});

const getTranslatorName = (translatorId: string): string => {
  return TranslatorNameResolver.getDisplayName(translatorId, trans.value);
};

const addTranslator = (id: string) => {
  localList.value.push(id);
  updateConfig();
  showAddDialog.value = false;
};

const removeTranslator = (index: number) => {
  localList.value.splice(index, 1);
  updateConfig();
};

const moveUp = (index: number) => {
  if (index === 0) return;
  const list = [...localList.value];
  const item = list[index];
  list[index] = list[index - 1];
  list[index - 1] = item;
  localList.value = list;
  updateConfig();
};

const moveDown = (index: number) => {
  if (index === localList.value.length - 1) return;
  const list = [...localList.value];
  const item = list[index];
  list[index] = list[index + 1];
  list[index + 1] = item;
  localList.value = list;
  updateConfig();
};

const updateConfig = () => {
  eventBus.at("dispatch", props.configKey, localList.value);
};
</script>

<style scoped>
.group-item {
  align-items: center;
  display: grid;
  gap: 10px;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  min-height: 44px;
  padding: 8px 10px;
  transition: background-color 0.2s;
}
.group-item:hover {
  background: rgba(var(--v-theme-on-surface), 0.045);
}
.group-item + .group-item {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.09);
}
.translator-group-config {
  background: rgba(var(--v-theme-surface), 0.72);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
}
.group-header {
  align-items: center;
  background: rgba(var(--v-theme-on-surface), 0.035);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
}
.group-title {
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
}
.group-description {
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 12px;
  line-height: 18px;
}
.group-list {
  min-height: 46px;
}
.group-item-index {
  align-items: center;
  background: rgba(var(--v-theme-primary), 0.1);
  border-radius: 999px;
  color: rgb(var(--v-theme-primary));
  display: inline-flex;
  font-size: 12px;
  font-weight: 700;
  height: 24px;
  justify-content: center;
  width: 24px;
}
.group-item-name {
  font-size: 14px;
  font-weight: 500;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.group-actions {
  align-items: center;
  display: flex;
  gap: 2px;
}
.group-empty {
  align-items: center;
  color: rgba(var(--v-theme-on-surface), 0.58);
  display: flex;
  flex-direction: column;
  font-size: 12px;
  gap: 6px;
  justify-content: center;
  min-height: 86px;
}
.group-empty-title {
  color: rgba(var(--v-theme-on-surface), 0.58);
  font-size: 12px;
  text-align: center;
}
.translator-dialog-list {
  max-height: 320px;
  overflow: auto;
  padding-left: 0;
  padding-right: 0;
}
</style>
