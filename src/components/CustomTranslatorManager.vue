<template>
  <div class="custom-translator-manager">
    <section class="provider-shell">
      <div class="provider-toolbar">
        <div>
          <div class="provider-title">
            {{ trans["aiProviders"] || "AI翻译供应商" }}
          </div>
          <div class="provider-subtitle">
            {{
              trans["aiTranslatorDescription"] ||
              "这些翻译器基于人工智能（大语言模型/LLM），可以理解上下文并提供更自然的翻译。"
            }}
          </div>
        </div>
        <v-btn color="primary" size="small" @click="showAddProviderDialog = true">
          <v-icon size="small" class="mr-1">mdi-plus</v-icon>
          {{ trans["addAIProvider"] || "添加AI供应商" }}
        </v-btn>
      </div>

      <div class="provider-body">
        <v-alert type="info" density="compact" variant="tonal" class="mb-4">
          {{
            trans["aiTranslatorDescription"] ||
            "这些翻译器基于人工智能（大语言模型/LLM），可以理解上下文并提供更自然的翻译。所有在此处添加的供应商都需要您自行配置API密钥。"
          }}
        </v-alert>

        <v-expansion-panels v-if="providers.length > 0" multiple class="provider-panels">
          <v-expansion-panel
            v-for="provider in providers"
            :key="provider.id"
            class="provider-panel"
          >
            <v-expansion-panel-title>
              <div class="provider-row">
                <div
                  :class="[
                    'provider-icon',
                    `provider-${provider.providerType}`,
                  ]"
                ></div>
                <div class="provider-meta">
                  <div class="provider-name">
                    {{ provider.name }}
                    <v-chip
                      v-if="provider.providerType === 'stepfun'"
                      color="warning"
                      size="x-small"
                      class="ml-2"
                    >
                      {{ trans["stepfunCustomNote"] || "需自备API密钥" }}
                    </v-chip>
                  </div>
                  <div class="provider-api">
                    {{ provider.apiBase }} |
                    {{ provider.enabledModels.length }}
                    {{ trans["modelsEnabled"] || "个模型已启用" }}
                  </div>
                </div>
              </div>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <div class="provider-detail">
                <div class="provider-actions">
                  <v-btn
                    size="small"
                    variant="tonal"
                    color="primary"
                    @click="editProvider(provider)"
                  >
                    <v-icon size="small" class="mr-1">mdi-pencil</v-icon>
                    {{ trans["edit"] || "编辑" }}
                  </v-btn>
                  <v-btn
                    size="small"
                    variant="tonal"
                    color="error"
                    @click="removeProviderConfirm(provider.id)"
                  >
                    <v-icon size="small" class="mr-1">mdi-delete</v-icon>
                    {{ trans["delete"] || "删除" }}
                  </v-btn>
                  <v-spacer></v-spacer>
                  <v-btn size="small" variant="tonal" @click="testProvider(provider)">
                    <v-icon size="small" class="mr-1">mdi-test-tube</v-icon>
                    {{ trans["test"] || "测试" }}
                  </v-btn>
                </div>

                <v-divider></v-divider>

                <div class="provider-models">
                  <div class="model-toolbar">
                    <span class="model-title">{{
                      trans["selectModels"] || "选择要启用的模型"
                    }}</span>
                    <v-spacer></v-spacer>
                    <v-btn
                      size="x-small"
                      variant="text"
                      :loading="provider.fetchingModels"
                      @click="fetchProviderModels(provider)"
                    >
                      <v-icon size="small" class="mr-1">mdi-refresh</v-icon>
                      {{ trans["refreshModels"] || "刷新" }}
                    </v-btn>
                  </div>

                  <div
                    v-if="
                      provider.availableModels &&
                      provider.availableModels.length > 0
                    "
                  >
                    <v-chip-group
                      v-model="provider.enabledModels"
                      @update:model-value="
                        (models) => updateProviderModels(provider.id, models)
                      "
                      multiple
                      column
                    >
                      <v-chip
                        v-for="model in provider.availableModels"
                        :key="model"
                        :value="model"
                        filter
                        variant="outlined"
                        size="small"
                      >
                        {{ model }}
                      </v-chip>
                    </v-chip-group>
                  </div>

                  <v-alert
                    v-else-if="!provider.fetchingModels"
                    density="compact"
                    variant="tonal"
                    type="info"
                    class="mt-2"
                  >
                    {{
                      trans["noModelsHint"] || "点击刷新按钮获取可用模型列表"
                    }}
                  </v-alert>

                  <v-alert
                    v-if="provider.modelFetchError"
                    density="compact"
                    variant="tonal"
                    type="error"
                    class="mt-2"
                    closable
                    @click:close="provider.modelFetchError = ''"
                  >
                    {{ provider.modelFetchError }}
                  </v-alert>
                </div>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <div v-else class="provider-empty">
          <v-icon size="32">mdi-robot-outline</v-icon>
          <div>{{ trans["noAIProviders"] || "暂无AI供应商" }}</div>
          <v-btn
            color="primary"
            size="small"
            variant="tonal"
            @click="showAddProviderDialog = true"
          >
            <v-icon size="16" class="mr-1">mdi-plus</v-icon>
            {{ trans["addAIProvider"] || "添加AI供应商" }}
          </v-btn>
        </div>
      </div>
    </section>

    <v-dialog v-model="showAddProviderDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>
          {{
            editingProvider
              ? trans["editAIProvider"] || "编辑AI供应商"
              : trans["addAIProvider"] || "添加AI供应商"
          }}
        </v-card-title>

        <v-card-text>
          <v-form ref="form" v-model="formValid">
            <v-select
              v-if="!editingProvider"
              v-model="selectedTemplate"
              :items="templateItems"
              item-title="text"
              item-value="value"
              :label="trans['selectProviderTemplate'] || '选择AI供应商类型'"
              @update:model-value="onTemplateChange"
              variant="outlined"
              density="compact"
            >
            </v-select>

            <v-text-field
              v-model="providerForm.name"
              :label="trans['providerName'] || '供应商名称'"
              :rules="[rules.required]"
              :hint="trans['providerNameHint'] || '例如: OpenAI 官方账号'"
              variant="outlined"
              density="compact"
            ></v-text-field>

            <v-text-field
              v-model="providerForm.apiBase"
              :label="trans['apiBase'] || 'API Base URL'"
              :rules="[rules.required]"
              variant="outlined"
              density="compact"
            ></v-text-field>

            <v-text-field
              v-model="providerForm.apiKey"
              :label="trans['apiKey'] || 'API Key'"
              :rules="[rules.required]"
              type="password"
              variant="outlined"
              density="compact"
            ></v-text-field>

            <v-expansion-panels flat>
              <v-expansion-panel>
                <v-expansion-panel-title>
                  {{ trans["advancedConfig"] || "高级配置" }}
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div class="mt-2" v-if="providerForm.config">
                    <label class="caption">
                      {{ trans["temperature"] || "温度" }}:
                      {{ providerForm.config.temperature }}
                    </label>
                    <v-slider
                      v-model="providerForm.config.temperature"
                      min="0"
                      max="1"
                      step="0.1"
                      thumb-label
                      density="compact"
                    ></v-slider>
                    <p class="temperature-desc">{{ temperatureDesc }}</p>
                  </div>

                  <v-text-field
                    v-if="providerForm.config"
                    v-model.number="providerForm.config.maxTokens"
                    :label="trans['maxTokens'] || '最大Token数'"
                    type="number"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>

                  <v-divider class="my-3"></v-divider>

                  <div class="subtitle-2 mb-2">
                    {{ trans["translationBehavior"] || "翻译行为" }}
                  </div>

                  <v-select
                    v-if="providerForm.config"
                    v-model="providerForm.config.promptPreset"
                    :items="promptPresetItems"
                    item-title="title"
                    item-value="value"
                    :label="trans['aiPromptPreset'] || '提示词预设'"
                    variant="outlined"
                    density="compact"
                  ></v-select>

                  <v-switch
                    v-if="providerForm.config"
                    v-model="providerForm.config.preserveFormatting"
                    :label="trans['preserveFormatting'] || '保留格式'"
                    color="primary"
                    hide-details
                    density="compact"
                    class="mb-2"
                  ></v-switch>

                  <v-textarea
                    v-if="providerForm.config"
                    v-model="providerForm.config.rolePrompt"
                    :label="trans['translatorRole'] || '翻译角色'"
                    :placeholder="
                      trans['translatorRolePlaceholder'] ||
                      '专业翻译、技术文档译者、学术译者等'
                    "
                    rows="2"
                    auto-grow
                    variant="outlined"
                    density="compact"
                  ></v-textarea>

                  <v-textarea
                    v-if="providerForm.config"
                    v-model="providerForm.config.systemPrompt"
                    :label="trans['systemPrompt'] || 'System Prompt'"
                    :placeholder="
                      trans['systemPromptPlaceholder'] ||
                      '留空使用预设 system prompt'
                    "
                    rows="3"
                    auto-grow
                    variant="outlined"
                    density="compact"
                  ></v-textarea>

                  <v-textarea
                    v-if="providerForm.config"
                    v-model="providerForm.config.userPrompt"
                    :label="trans['userPrompt'] || trans['customPrompt'] || '自定义提示词'"
                    :placeholder="
                      trans['userPromptPlaceholder'] ||
                      trans['promptPlaceholder'] ||
                      '使用 {text}, {from}, {to}，留空使用预设模板'
                    "
                    rows="5"
                    auto-grow
                    variant="outlined"
                    density="compact"
                  ></v-textarea>

                  <v-textarea
                    v-if="providerForm.config"
                    v-model="providerForm.config.styleGuide"
                    :label="trans['styleGuide'] || '风格指南'"
                    :placeholder="
                      trans['styleGuidePlaceholder'] ||
                      '例如：简洁、正式、保留产品名称'
                    "
                    rows="3"
                    auto-grow
                    variant="outlined"
                    density="compact"
                  ></v-textarea>

                  <v-textarea
                    v-if="providerForm.config"
                    v-model="providerForm.config.glossary"
                    :label="trans['glossary'] || '术语表'"
                    :placeholder="
                      trans['glossaryPlaceholder'] ||
                      '每行一个术语，例如：cache = 缓存'
                    "
                    rows="3"
                    auto-grow
                    variant="outlined"
                    density="compact"
                  ></v-textarea>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeProviderDialog">{{
            trans["cancel"] || "取消"
          }}</v-btn>
          <v-btn color="primary" :disabled="!formValid" @click="saveProvider">
            {{ trans["ok"] || "确定" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showTestDialog" max-width="500px">
      <v-card>
        <v-card-title>{{
          trans["testAIProvider"] || "测试AI供应商"
        }}</v-card-title>
        <v-card-text>
          <v-select
            v-model="testModel"
            :items="testingProvider ? testingProvider.enabledModels : []"
            :label="trans['selectModel'] || '选择模型'"
            variant="outlined"
            density="compact"
          ></v-select>

          <v-textarea
            v-model="testText"
            :label="trans['testText'] || '测试文本'"
            rows="2"
            variant="outlined"
            density="compact"
          ></v-textarea>

          <div class="test-language-row">
            <div>
              <v-select
                v-model="testFrom"
                :items="testLanguages"
                :label="trans['sourceLanguage'] || 'From'"
                variant="outlined"
                density="compact"
              ></v-select>
            </div>
            <div>
              <v-select
                v-model="testTo"
                :items="testLanguages"
                :label="trans['targetLanguage'] || 'To'"
                variant="outlined"
                density="compact"
              ></v-select>
            </div>
          </div>

          <v-btn color="primary" @click="runTest" :loading="testing" block>
            {{ trans["test"] || "测试" }}
          </v-btn>

          <div v-if="testResult" class="mt-3">
            <v-alert type="success" density="compact" variant="tonal">
              <div>
                <strong>{{ trans["testResult"] || "测试结果" }}:</strong>
              </div>
              <div>{{ testResult }}</div>
            </v-alert>
          </div>

          <div v-if="testError" class="mt-3">
            <v-alert type="error" density="compact" variant="tonal">
              {{ testError }}
            </v-alert>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showTestDialog = false">{{
            trans["cancel"] || "取消"
          }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { customTranslatorManager } from "@/common/translate/custom-translators";
import { fetchModels } from "@/common/translate/model-fetcher";
import {
  aiPromptPresets,
  AiPromptPreset,
  ProviderConfig,
} from "@/common/translate/types";
import {
  providerTemplates,
  getProviderTemplate,
} from "@/common/translate/provider-templates";
import { useBase } from "./useBase";
import eventBus from "@/common/event-bus";

interface ProviderWithUI extends ProviderConfig {
  availableModels?: string[];
  fetchingModels?: boolean;
  modelFetchError?: string;
}

const base = useBase();
const trans = base.trans;

const providers = ref<ProviderWithUI[]>([]);
const showAddProviderDialog = ref(false);
const showTestDialog = ref(false);
const formValid = ref(false);
const editingProvider = ref<ProviderConfig | null>(null);
const selectedTemplate = ref("");

const testing = ref(false);
const testText = ref("Hello, world!");
const testFrom = ref("en");
const testTo = ref("zh-CN");
const testResult = ref("");
const testError = ref("");
const testingProvider = ref<ProviderWithUI | null>(null);
const testModel = ref("");

const testLanguages = [
  "en",
  "zh-CN",
  "zh-TW",
  "ja",
  "ko",
  "fr",
  "es",
  "de",
  "ru",
];

type ProviderBehaviorConfig = NonNullable<ProviderConfig["config"]>;

const createDefaultBehaviorConfig = (): ProviderBehaviorConfig => ({
  temperature: 0.3,
  maxTokens: 4000,
  promptPreset: "faithful",
  rolePrompt: "",
  systemPrompt: "",
  userPrompt: "",
  styleGuide: "",
  glossary: "",
  preserveFormatting: true,
});

const normalizeBehaviorConfig = (
  cfg?: ProviderConfig["config"]
): ProviderBehaviorConfig => {
  const normalized = {
    ...createDefaultBehaviorConfig(),
    ...(cfg || {}),
  };
  if (!normalized.userPrompt && normalized.prompt && normalized.prompt !== "default") {
    normalized.userPrompt = normalized.prompt;
  }
  if (!aiPromptPresets.includes(normalized.promptPreset as AiPromptPreset)) {
    normalized.promptPreset = "faithful";
  }
  normalized.preserveFormatting = normalized.preserveFormatting !== false;
  return normalized;
};

const createDefaultProviderForm = (): ProviderConfig => ({
  id: "",
  name: "",
  providerType: "custom",
  apiBase: "https://",
  apiKey: "",
  enabledModels: [],
  config: createDefaultBehaviorConfig(),
  enabled: true,
});

const providerForm = ref<ProviderConfig>(createDefaultProviderForm());

const templateItems = computed(() => {
  return providerTemplates.map((t) => {
    let name = t.name;
    if (t.type === "stepfun") {
      name = `${t.name} (${trans.value["stepfunCustomNote"] || "需自备API密钥"})`;
    }
    return {
      title: name,
      text: name,
      value: t.type,
    };
  });
});

const promptPresetItems = computed(() =>
  aiPromptPresets.map((value) => ({
    title: trans.value[`aiPromptPreset_${value}`] || value,
    value,
  }))
);

const rules = computed(() => ({
  required: (v: string) => !!v || trans.value["required"] || "此项必填",
}));

const temperatureDesc = computed(() => {
  const temp = providerForm.value.config?.temperature || 0.3;
  if (temp < 0.2) return trans.value["temperatureDesc0"] || "更精确，更确定";
  if (temp < 0.5) return trans.value["temperatureDesc1"] || "平衡";
  if (temp < 0.8) return trans.value["temperatureDesc2"] || "更有创意";
  return trans.value["temperatureDesc3"] || "非常有创意，可能不稳定";
});

const loadProviders = () => {
  const baseProviders = customTranslatorManager.getAllProviders();
  providers.value = baseProviders.map((p) => ({
    ...p,
    config: normalizeBehaviorConfig(p.config),
    availableModels: p.enabledModels.length > 0 ? [...p.enabledModels] : undefined,
    fetchingModels: false,
    modelFetchError: "",
  }));
};

onMounted(() => {
  customTranslatorManager.reload();
  loadProviders();
});

const onTemplateChange = (templateType: string) => {
  const template = getProviderTemplate(templateType);
  if (template) {
    providerForm.value.providerType = template.type;
    providerForm.value.apiBase = template.apiBase;
    providerForm.value.name = template.name;
    providerForm.value.enabledModels = [];
  }
};

const fetchProviderModels = async (provider: ProviderWithUI) => {
  if (!provider.apiBase || !provider.apiKey) {
    provider.modelFetchError = trans.value["apiConfigRequired"] || "请先配置 API Base 和 API Key";
    return;
  }

  provider.fetchingModels = true;
  provider.modelFetchError = "";

  try {
    const models = await fetchModels(provider.apiBase, provider.apiKey);
    if (models.length === 0) {
      const template = getProviderTemplate(provider.providerType);
      if (template && template.recommendedModels.length > 0) {
        provider.availableModels = template.recommendedModels;
        provider.modelFetchError = trans.value["usingRecommendedModels"] || "API 未返回模型列表，使用推荐模型";
      } else {
        provider.modelFetchError = trans.value["noModelsFound"] || "未找到任何模型";
        provider.availableModels = [];
      }
    } else {
      provider.availableModels = models;
    }
  } catch (error: any) {
    provider.modelFetchError = error.message || trans.value["modelFetchFailed"] || "获取模型列表失败";
    const template = getProviderTemplate(provider.providerType);
    if (template && template.recommendedModels.length > 0) {
      provider.availableModels = template.recommendedModels;
    }
  } finally {
    provider.fetchingModels = false;
  }
};

const updateProviderModels = (providerId: string, models: string[]) => {
  customTranslatorManager.setEnabledModels(providerId, models);
  loadProviders();
};

const editProvider = (provider: ProviderConfig) => {
  editingProvider.value = provider;
  providerForm.value = {
    ...JSON.parse(JSON.stringify(provider)),
    config: normalizeBehaviorConfig(provider.config),
  };
  selectedTemplate.value = "";
  showAddProviderDialog.value = true;
};

const removeProviderConfirm = (id: string) => {
  const provider = providers.value.find((p) => p.id === id);
  const name = provider?.name || id;
  if (confirm(`${trans.value["confirmDelete"] || "确认删除"} "${name}"?`)) {
    customTranslatorManager.removeProvider(id);
    loadProviders();
  }
};

const saveProvider = () => {
  providerForm.value.config = normalizeBehaviorConfig(providerForm.value.config);

  if (editingProvider.value) {
    customTranslatorManager.updateProvider(editingProvider.value.id, providerForm.value);
  } else {
    let baseId = providerForm.value.providerType || "custom";
    if (providerForm.value.name) {
      const simpleName = providerForm.value.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, "");
      if (simpleName) {
        baseId = simpleName;
      }
    }
    providerForm.value.id = customTranslatorManager.generateUniqueProviderId(baseId);
    customTranslatorManager.addProvider(providerForm.value);
  }

  loadProviders();
  closeProviderDialog();
  eventBus.at("dispatch", "reloadCustomTranslators", null);
};

const closeProviderDialog = () => {
  showAddProviderDialog.value = false;
  editingProvider.value = null;
  resetProviderForm();
};

const resetProviderForm = () => {
  providerForm.value = createDefaultProviderForm();
  selectedTemplate.value = "";
};

const testProvider = (provider: ProviderWithUI) => {
  if (provider.enabledModels.length === 0) {
    alert(trans.value["noModelsEnabled"] || "请先启用至少一个模型");
    return;
  }
  testingProvider.value = provider;
  testModel.value = provider.enabledModels[0];
  showTestDialog.value = true;
  testResult.value = "";
  testError.value = "";
  testing.value = false;
};

const runTest = async () => {
  if (!testingProvider.value || !testModel.value) return;

  testing.value = true;
  testResult.value = "";
  testError.value = "";

  try {
    const translatorId = customTranslatorManager.getTranslatorIdForModel(
      testingProvider.value.id,
      testModel.value
    );
    const requestId = Date.now().toString() + Math.random().toString();
    const resultPromise = new Promise((resolve, reject) => {
      let timeoutId: any;
      const successHandler = (res: any) => {
        if (res.id === requestId) {
          cleanup();
          resolve(res.data);
        }
      };
      const errorHandler = (err: any) => {
        if (err.id === requestId) {
          cleanup();
          reject(err.error);
        }
      };
      const cleanup = () => {
        eventBus.goff("testTranslateResult", successHandler);
        eventBus.goff("testTranslateError", errorHandler);
        if (timeoutId) clearTimeout(timeoutId);
      };
      eventBus.gon("testTranslateResult", successHandler);
      eventBus.gon("testTranslateError", errorHandler);
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error("Translation timeout"));
      }, 60000);
    });

    eventBus.at("dispatch", "testTranslate", {
      id: requestId,
      text: testText.value,
      engine: translatorId,
      from: testFrom.value,
      to: testTo.value,
    });

    const result: any = await resultPromise;
    testResult.value = result.trans.paragraphs.join("\n");
  } catch (error: any) {
    testError.value = String(error);
  } finally {
    testing.value = false;
  }
};
</script>

<style scoped>
.custom-translator-manager {
  height: 100%;
  overflow: auto;
  padding-right: 4px;
}
.provider-shell {
  background: rgba(var(--v-theme-surface), 0.72);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  overflow: hidden;
}
.provider-toolbar {
  align-items: center;
  background: rgba(var(--v-theme-on-surface), 0.035);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 12px;
}
.provider-title {
  font-size: 15px;
  font-weight: 700;
  line-height: 22px;
}
.provider-subtitle {
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 12px;
  line-height: 18px;
  max-width: 760px;
}
.provider-body {
  padding: 12px;
}
.provider-panels {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 8px;
  overflow: hidden;
}
.provider-panel + .provider-panel {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.09);
}
.provider-row {
  align-items: center;
  display: flex;
  gap: 10px;
  min-width: 0;
  width: 100%;
}
.provider-meta {
  flex: 1 1 auto;
  min-width: 0;
}
.provider-name {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  font-weight: 700;
  gap: 6px;
  line-height: 20px;
}
.provider-api {
  color: rgba(var(--v-theme-on-surface), 0.58);
  font-size: 12px;
  line-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.provider-detail {
  background: rgba(var(--v-theme-on-surface), 0.025);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 8px;
  padding: 10px;
}
.provider-actions,
.model-toolbar {
  align-items: center;
  display: flex;
  gap: 8px;
}
.provider-actions {
  flex-wrap: wrap;
  padding-bottom: 10px;
}
.provider-models {
  padding-top: 10px;
}
.model-title {
  font-size: 13px;
  font-weight: 700;
  line-height: 18px;
}
.temperature-desc {
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 12px;
  line-height: 18px;
  margin: 4px 0 0;
}
.test-language-row {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.provider-empty {
  align-items: center;
  color: rgba(var(--v-theme-on-surface), 0.58);
  display: flex;
  flex-direction: column;
  font-size: 13px;
  gap: 8px;
  justify-content: center;
  min-height: 160px;
  text-align: center;
}

@media (max-width: 640px) {
  .provider-toolbar,
  .provider-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .provider-toolbar :deep(.v-btn) {
    width: 100%;
  }

  .test-language-row {
    grid-template-columns: 1fr;
  }
}
</style>
