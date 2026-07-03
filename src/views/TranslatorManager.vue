<template>
  <div class="translator-manager">
    <v-tabs v-model="activeTab" class="translator-tabs" density="compact">
      <v-tab :value="0">
        <v-icon size="18" class="mr-2">mdi-format-list-checks</v-icon>
        {{ trans["translatorList"] || "翻译器列表" }}
      </v-tab>
      <v-tab :value="1">
        <v-icon size="18" class="mr-2">mdi-playlist-edit</v-icon>
        {{ trans["translatorGroups"] || "分组设置" }}
      </v-tab>
    </v-tabs>

    <div class="translator-content">
      <v-tabs-window v-model="activeTab" class="translator-window">
        <v-tabs-window-item :value="0" class="translator-window-item">
          <div class="translator-pane">
            <div class="translator-summary">
              <v-chip size="small" color="primary" variant="tonal">
                {{ trans["enabledCount"] || "已启用" }}:
                {{ enabledTranslators.length }}
              </v-chip>
              <v-chip size="small" color="secondary" variant="tonal">
                {{ trans["cachedCount"] || "已缓存" }}:
                {{ cacheTranslators.length }}
              </v-chip>
            </div>
            <v-alert density="compact" variant="tonal" type="info" class="mb-4">
              <div class="translator-tip-text">
                {{
                  trans["translatorManagerTips"] ||
                  "提示：\n1) 先在配置中填写密钥，未配置的翻译器无法启用。\n2) 批量启用只会启用已完成配置 of 翻译器。\n3) 缓存会加快切换引擎速度，但会占用更多资源。"
                }}
              </div>
            </v-alert>

            <!-- 翻译器列表 -->
            <div class="translator-header-row">
              <div class="translator-header-cell translator-header-enable">
                {{ trans["enableLabel"] || "启用" }}
              </div>
              <div class="translator-header-cell translator-header-name">
                {{ trans["translatorNameLabel"] || "名称" }}
              </div>
              <div class="translator-header-cell translator-header-cache">
                {{ trans["cacheShortLabel"] || "缓存" }}
              </div>
              <div class="translator-header-cell translator-header-expand">
                {{ trans["expand"] || "展开" }}
              </div>
            </div>
            <v-expansion-panels
              multiple
              flat
              v-model="configVisibleIndexes"
              class="translator-panels"
            >
              <v-expansion-panel
                v-for="(translator, idx) in translatorList"
                :key="translator.id"
                class="translator-panel"
              >
                <v-expansion-panel-title class="translator-panel-header">
                  <template v-slot:default>
                    <div class="translator-row" @click.stop>
                      <div class="translator-cell translator-enable">
                        <v-checkbox
                          v-model="translator.enabled"
                          @click.stop
                          @change="
                            updateEnabled(translator.id, translator.enabled)
                          "
                          :disabled="
                            !isConfigComplete(translator.id) ||
                            (translator.id === 'google' &&
                              enabledTranslators.length <= 1)
                          "
                          :title="getCheckboxTitle(translator.id)"
                          hide-details
                          class="translator-checkbox"
                        ></v-checkbox>
                      </div>
                      <div
                        class="translator-cell translator-name"
                        :title="translator.name"
                      >
                        {{ translator.name }}
                      </div>
                      <div class="translator-cell translator-cache">
                        <v-checkbox
                          v-model="translator.cache"
                          @click.stop
                          @change="updateCache(translator.id, translator.cache)"
                          :disabled="!translator.enabled"
                          :title="
                            trans['<tooltip>translator-cache'] ||
                            '缓存会自动查询并加速切换翻译器'
                          "
                          hide-details
                          class="translator-checkbox"
                        ></v-checkbox>
                      </div>
                    </div>
                  </template>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div class="translator-config-panel">
                    <KeyConfig :identifier="translator.id"></KeyConfig>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <!-- 后备翻译器设置 -->
            <section class="fallback-panel">
              <div class="fallback-title">
                <v-icon size="18" color="primary">mdi-backup-restore</v-icon>
                {{ trans["fallbackTranslator"] || "后备翻译器" }}
              </div>
              <div class="fallback-body">
                <v-select
                  v-model="fallbackTranslator"
                  :items="fallbackTranslatorItems"
                  item-title="label"
                  item-value="value"
                  :label="trans['selectFallbackTranslator'] || '选择后备翻译器'"
                  variant="outlined"
                  density="compact"
                  :hint="
                    trans['<tooltip>fallbackTranslator'] ||
                    '当前翻译器不支持目标语言时自动使用'
                  "
                  persistent-hint
                  class="caption"
                  :disabled="enabledTranslators.length === 0"
                ></v-select>
                <div class="fallback-tip">
                  {{
                    trans["fallbackTranslatorTip"] ||
                    "建议选择稳定且已配置完成的翻译器作为后备。"
                  }}
                </div>
                <div
                  v-if="enabledTranslators.length === 0"
                  class="fallback-error"
                >
                  {{ trans["noEnabledTranslators"] || "请先在上方启用翻译器" }}
                </div>
              </div>
            </section>
          </div>
        </v-tabs-window-item>

        <v-tabs-window-item :value="1" class="translator-window-item">
          <div class="translator-pane">
            <TranslatorGroupConfig
              configKey="translator-cache"
              :title="trans['cacheGroup'] || '缓存分组'"
              :description="
                trans['cacheGroupDesc'] ||
                '配置自动查询并缓存结果的翻译器及其顺序'
              "
            ></TranslatorGroupConfig>

            <TranslatorGroupConfig
              configKey="translator-compare"
              :title="trans['compareGroup'] || '对比分组'"
              :description="
                trans['compareGroupDesc'] ||
                '配置多源对比模式下使用的翻译器及其顺序'
              "
            ></TranslatorGroupConfig>

            <TranslatorGroupConfig
              configKey="translator-double"
              :title="trans['doubleGroup'] || '双击分组'"
              :description="
                trans['doubleGroupDesc'] ||
                '配置双击复制/翻译时使用的翻译器及其顺序'
              "
            ></TranslatorGroupConfig>
          </div>
        </v-tabs-window-item>
      </v-tabs-window>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import KeyConfig from "@/components/KeyConfig.vue";
import TranslatorGroupConfig from "@/components/TranslatorGroupConfig.vue";
import { useBase } from "@/components/useBase";
import { Identifier } from "@/common/types";
import { TranslatorNameResolver } from "@/common/translate/translator-name-resolver";
import {
  getAvailableTranslatorIds,
  getEnabledWithCustomIds,
} from "@/common/translate/translators";
import config from "@/common/configuration";
import eventBus from "@/common/event-bus";

const base = useBase();
const trans = base.trans;

const activeTab = ref(0);
const configVisibleIndexes = ref<number[]>([]);
const translatorList = ref<Array<{
  id: string;
  name: string;
  enabled: boolean;
  cache: boolean;
}>>([]);

const availableTranslators = computed(() => {
  return TranslatorNameResolver.getBuiltInTranslatorIds();
});

const enabledTranslators = computed(() => {
  return base.config.value["translator-enabled"] || [];
});

const cacheTranslators = computed(() => {
  return base.config.value["translator-cache"] || [];
});

const fallbackTranslator = computed({
  get: () => base.config.value["fallbackTranslator"] || "baidu",
  set: (val: string) => {
    base.callback("fallbackTranslator", val);
  }
});

const fallbackTranslatorItems = computed(() =>
  enabledTranslators.value.map((id: string) => ({
    label: TranslatorNameResolver.getDisplayName(id, trans.value),
    value: id,
  }))
);

const buildTranslatorList = () => {
  translatorList.value = availableTranslators.value.map((id) => {
    return {
      id,
      name: TranslatorNameResolver.getDisplayName(id, trans.value),
      enabled: enabledTranslators.value.includes(id),
      cache: cacheTranslators.value.includes(id),
    };
  });
};

watch([enabledTranslators, cacheTranslators], () => {
  buildTranslatorList();
}, { deep: true });

onMounted(() => {
  buildTranslatorList();
});

const updateEnabled = (translatorId: string, enabled: boolean) => {
  if (enabled) {
    applyEnabledTranslators([...enabledTranslators.value, translatorId]);
  } else {
    applyEnabledTranslators(
      enabledTranslators.value.filter((id) => id !== translatorId)
    );
  }
};

const isConfigComplete = (translatorId: string): boolean => {
  return getConfigStatus(translatorId).canEnable;
};

const getConfigStatus = (translatorId: string) => {
  const id = translatorId as Identifier;
  if (!config.has(id)) {
    return { canSave: true, canEnable: true };
  }
  const value = base.config.value[translatorId];
  return config.checkStatus(id, value);
};

const getCheckboxTitle = (translatorId: string): string => {
  if (translatorId === "google" && enabledTranslators.value.length <= 1) {
    return trans.value["leastOneTranslator"] || "至少需要启用一个翻译器";
  }

  const status = getConfigStatus(translatorId);
  if (!status.canEnable) {
    return (
      status.enableReason || trans.value["configRequired"] || "请先配置翻译器"
    );
  }

  return "";
};

const updateCache = (translatorId: string, cache: boolean) => {
  let newCache = [...cacheTranslators.value];
  if (cache) {
    if (!newCache.includes(translatorId)) {
      newCache.push(translatorId);
    }
  } else {
    newCache = newCache.filter((id) => id !== translatorId);
  }
  applyCacheTranslators(newCache);
};

const applyEnabledTranslators = (newEnabled: string[]) => {
  const custom = base.config.value["customTranslators"] || [];
  const allowed = new Set(
    getAvailableTranslatorIds(availableTranslators.value, custom)
  );
  const enabled = Array.from(new Set(newEnabled)).filter((id) =>
    allowed.has(id)
  );
  const activeSet = new Set(getEnabledWithCustomIds(enabled, custom));
  const cache = cacheTranslators.value.filter((id) => activeSet.has(id));
  const compare = (
    base.config.value["translator-compare"] || []
  ).filter((id: string) => activeSet.has(id));
  const double = (
    base.config.value["translator-double"] || []
  ).filter((id: string) => activeSet.has(id));
  base.callback("translator-enabled", enabled);
  base.callback("translator-cache", cache);
  base.callback("translator-compare", compare);
  base.callback("translator-double", double);
  if (enabled.length > 0 && !enabled.includes(fallbackTranslator.value)) {
    base.callback("fallbackTranslator", enabled[0]);
  }
};

const applyCacheTranslators = (newCache: string[]) => {
  const enabledSet = new Set(enabledTranslators.value);
  const cache = Array.from(new Set(newCache)).filter((id) =>
    enabledSet.has(id)
  );
  base.callback("translator-cache", cache);
};
</script>

<style scoped>
.translator-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.translator-tabs {
  flex: 0 0 auto;
}
.translator-tabs :deep(.v-tab) {
  border-radius: 6px;
  min-height: 38px;
}
.translator-content {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  position: relative;
}
.translator-window {
  height: 100%;
  overflow: auto;
}
.translator-window-item {
  min-height: 100%;
}
.translator-pane {
  padding: 12px 4px 12px 0;
}
.translator-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.translator-tip-text {
  font-size: 12px;
  line-height: 18px;
  white-space: pre-line;
}
.translator-row {
  display: grid;
  grid-template-columns: 60px minmax(150px, 1fr) 60px;
  align-items: center;
  column-gap: 8px;
  width: 100%;
  min-height: 48px;
}

.translator-header-row {
  display: grid;
  grid-template-columns: 60px minmax(150px, 1fr) 60px 48px;
  align-items: center;
  column-gap: 8px;
  width: 100%;
  font-size: 13px;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.68);
  padding: 8px 24px 8px 24px;
  background: rgba(var(--v-theme-on-surface), 0.045);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 8px;
  margin-bottom: 8px;
}

.translator-panels {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  overflow: hidden;
}

.translator-panel {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.09);
}

.translator-panel:last-child {
  border-bottom: none;
}

.translator-panel-header {
  padding: 0 0 0 24px !important;
  min-height: 48px !important;
  cursor: pointer !important;
}

.translator-panel-header:hover {
  background: rgba(var(--v-theme-on-surface), 0.045);
}

.translator-header-cell {
  display: flex;
  align-items: center;
}

.translator-header-enable,
.translator-header-cache {
  justify-content: center;
}

.translator-header-expand {
  justify-content: center;
}

.translator-cell {
  display: flex;
  align-items: center;
}

.translator-enable,
.translator-cache {
  justify-content: center;
}

.translator-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.86);
  cursor: help;
  padding: 4px 0;
}

.translator-name:hover {
  color: rgb(var(--v-theme-primary));
}

.translator-checkbox {
  margin: 0 !important;
  padding: 0 !important;
}
.translator-config-panel {
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  border-radius: 8px;
  padding: 12px;
}
.fallback-panel {
  background: rgba(var(--v-theme-surface), 0.72);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  margin-top: 12px;
  overflow: hidden;
}
.fallback-title {
  align-items: center;
  background: rgba(var(--v-theme-on-surface), 0.035);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  display: flex;
  font-size: 14px;
  font-weight: 700;
  gap: 8px;
  line-height: 20px;
  padding: 10px 12px;
}
.fallback-body {
  padding: 12px;
}
.fallback-tip {
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 12px;
  line-height: 18px;
  margin-top: 8px;
}
.fallback-error {
  color: rgb(var(--v-theme-error));
  font-size: 12px;
  line-height: 18px;
  margin-top: 4px;
}
</style>
