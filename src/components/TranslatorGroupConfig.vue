<template>
  <v-card flat class="mb-4 transparent">
    <v-card-title class="subtitle-2 py-2 px-0 d-flex align-center">
      {{ title }}
      <v-spacer></v-spacer>
      <v-btn icon size="small" @click="showAddDialog = true" color="primary">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </v-card-title>

    <div class="caption grey--text mb-2" v-if="description">
      {{ description }}
    </div>

    <v-card flat outlined>
      <div>
        <div v-for="(id, index) in localList" :key="id" class="group-item">
          <div class="group-item-name">{{ getTranslatorName(id) }}</div>
          <v-spacer></v-spacer>
          <div style="display: flex; gap: 5px; align-items: center;">
            <v-btn size="x-small" icon variant="plain" :disabled="index === 0" @click="moveUp(index)">
              <v-icon size="small">mdi-arrow-up</v-icon>
            </v-btn>
            <v-btn size="x-small" icon variant="plain" :disabled="index === localList.length - 1" @click="moveDown(index)">
              <v-icon size="small">mdi-arrow-down</v-icon>
            </v-btn>
            <v-btn icon size="small" variant="plain" @click="removeTranslator(index)" color="grey">
              <v-icon size="small">mdi-close</v-icon>
            </v-btn>
          </div>
        </div>
        <div
          v-if="localList.length === 0"
          class="caption grey--text text-center py-4"
        >
          {{ trans["noItems"] || "暂无项目" }}
        </div>
      </div>
    </v-card>

    <!-- Add Dialog -->
    <v-dialog v-model="showAddDialog" max-width="400" scrollable>
      <v-card>
        <v-card-title class="subtitle-1">
          {{ trans["addTranslator"] || "添加翻译器" }}
        </v-card-title>
        <v-card-text style="height: 300px;" class="px-0">
          <v-list dense>
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
              <v-list-item-title class="grey--text caption text-center">
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
  </v-card>
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
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  background: white;
  transition: background-color 0.2s;
}
.group-item:hover {
  background-color: #f9f9f9;
}
.group-item:last-child {
  border-bottom: none;
}
.group-item-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}
</style>
