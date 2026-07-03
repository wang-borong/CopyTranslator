<template>
  <div>
    <div class="d-flex justify-end mb-2" v-if="topSave">
      <v-btn size="small" color="primary" @click="save()" :disabled="!isDirty">
        {{ trans["saveConfig"] || "保存配置" }}
      </v-btn>
    </div>
    <v-alert
      v-if="noticeText || docUrl"
      dense
      text
      type="info"
      :icon="false"
      class="mb-2"
    >
      <span v-if="noticeText">{{ noticeText }}</span>
      <span v-if="noticeText && docUrl" class="mx-1">·</span>
      <a
        v-if="docUrl"
        :href="docUrl"
        @click.prevent="openDocUrl"
        rel="noopener"
      >
        {{ trans["openReference"] || "配置指南" }}
      </a>
    </v-alert>
    <div v-for="(_, key) in keyConfigLocal" :key="key" class="keyconfig-item">
      <v-checkbox
        v-if="getUiType(key) === 'checkbox'"
        v-model="keyConfigLocal[key]"
        :label="getLabel(key)"
        dense
        hide-details
        class="keyconfig-field"
      ></v-checkbox>

      <v-select
        v-else-if="getUiType(key) === 'select'"
        v-model="keyConfigLocal[key]"
        :items="getSelectOptions(key)"
        :label="getLabel(key)"
        dense
        outlined
        hide-details
        class="keyconfig-field"
      ></v-select>

      <v-text-field
        v-else-if="getUiType(key) === 'number'"
        v-model.number="keyConfigLocal[key]"
        type="number"
        :label="getLabel(key)"
        dense
        outlined
        hide-details
        class="keyconfig-field"
      ></v-text-field>

      <v-text-field
        v-else
        v-model="keyConfigLocal[key]"
        :type="getInputType(key)"
        :label="getLabel(key)"
        dense
        outlined
        hide-details
        class="keyconfig-field"
      ></v-text-field>
    </div>
    <v-btn
      v-if="!topSave"
      size="small"
      color="primary"
      class="mt-2"
      @click="save()"
      :disabled="!isDirty"
    >
      {{ trans["saveConfig"] || "保存配置" }}
    </v-btn>
    <v-alert
      v-if="saveMessage"
      dense
      text
      class="mt-2 mb-0"
      :type="saveMessageType"
    >
      {{ saveMessage }}
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { Identifier, translatorTypes } from "../common/types";
import { invoke } from "@tauri-apps/api/core";
import { FieldMetadata } from "../common/rule";
import config from "../common/configuration";
import { useBase } from "./useBase";

const props = defineProps<{
  identifier: Identifier;
  topSave?: boolean;
}>();

const base = useBase();
const trans = base.trans;

const keyConfigLocal = ref<Record<string, any>>({});
const saveMessage = ref("");
const saveMessageType = ref<"success" | "error">("success");

const keyConfig = computed(() => {
  return base.config.value[props.identifier] || {};
});

const isDirty = computed(() => {
  return JSON.stringify(keyConfigLocal.value) !== JSON.stringify(keyConfig.value);
});

const noticeText = computed(() => {
  if (!config.has(props.identifier)) return "";
  const rule = config.getRule(props.identifier);
  const notice = rule?.notice;
  if (!notice) return "";
  return trans.value[notice] || notice;
});

const docUrl = computed(() => {
  if (!config.has(props.identifier)) return "";
  const rule = config.getRule(props.identifier);
  return rule?.docUrl || "";
});

const openDocUrl = () => {
  if (docUrl.value) {
    invoke("open_url", { url: docUrl.value }).catch((err) => {
      console.error("Failed to open URL:", err);
    });
  }
};

const resetLocal = () => {
  keyConfigLocal.value = JSON.parse(JSON.stringify(keyConfig.value));
  saveMessage.value = "";
};

onMounted(() => {
  resetLocal();
});

watch(() => props.identifier, () => {
  resetLocal();
});

const getFieldMetadata = (key: string | number): FieldMetadata | undefined => {
  try {
    const rule = config.getRule(props.identifier);
    return rule?.metadata?.[key];
  } catch (e) {
    console.error(`[KeyConfig] getFieldMetadata error:`, e);
    return undefined;
  }
};

const getSelectOptions = (key: string | number): string[] => {
  const metadata = getFieldMetadata(key);
  return metadata?.options ? [...metadata.options] : [];
};

const getUiType = (key: string | number): string => {
  const metadata = getFieldMetadata(key);
  return metadata?.uiType || "text";
};

const getLabel = (key: string | number): string => {
  const metadata = getFieldMetadata(key);
  const labelKey = metadata?.label || key.toString();
  return trans.value[labelKey] || labelKey;
};

const getInputType = (key: string | number): string => {
  const uiType = getUiType(key);
  if (uiType === "number") return "number";
  const k = key.toString().toLowerCase();
  if (k.includes("password") || k.includes("secret")) return "password";
  return "text";
};

const save = () => {
  for (const key of Object.keys(keyConfigLocal.value)) {
    const val = keyConfigLocal.value[key];
    if (val == null) {
      const uiType = getUiType(key);
      if (uiType === "text" || uiType === "textarea" || uiType === "select") {
        keyConfigLocal.value[key] = "";
      }
    }
  }

  const status = config.checkStatus(props.identifier, keyConfigLocal.value);
  if (status.canSave) {
    base.callback(props.identifier, keyConfigLocal.value);
    if (translatorTypes.includes(props.identifier as any)) {
      const enabled = [...(base.config.value["translator-enabled"] || [])];
      const cache = [...(base.config.value["translator-cache"] || [])];
      if (status.canEnable) {
        const nextEnabled = Array.from(
          new Set([...enabled, props.identifier])
        ).filter((id: string) => translatorTypes.includes(id as any));
        if (
          nextEnabled.length !== enabled.length ||
          !enabled.includes(props.identifier)
        ) {
          base.callback("translator-enabled", nextEnabled);
        }
        const nextCache = cache.filter((id: string) =>
          nextEnabled.includes(id)
        );
        if (nextCache.length !== cache.length) {
          base.callback("translator-cache", nextCache);
        }
        const fallback = base.config.value["fallbackTranslator"];
        if (nextEnabled.length > 0 && !nextEnabled.includes(fallback)) {
          base.callback("fallbackTranslator", nextEnabled[0]);
        }
      } else {
        const nextEnabled = enabled.filter(
          (id: string) => id !== props.identifier
        );
        if (nextEnabled.length !== enabled.length) {
          base.callback("translator-enabled", nextEnabled);
        }
        const nextCache = cache.filter(
          (id: string) => id !== props.identifier
        );
        if (nextCache.length !== cache.length) {
          base.callback("translator-cache", nextCache);
        }
      }
    }
    saveMessage.value = trans.value["configSaveSuccess"] || "已保存并通过校验";
    saveMessageType.value = "success";
  } else {
    saveMessage.value =
      status.saveReason ||
      trans.value["configSaveInvalid"] ||
      "配置未通过校验，请检查必填项";
    saveMessageType.value = "error";
  }
};
</script>

<style scoped>
.keyconfig-item {
  margin-top: 10px;
}
.keyconfig-field {
  margin-top: 0;
}
</style>
