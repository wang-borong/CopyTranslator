<template>
  <div class="settings-root">
    <v-app class="settings-app" :style="appStyle">
      <v-app-bar color="primary" density="compact" :height="titlebarHeight">
        <v-spacer class="settings-drag-spacer">
          <div class="dragableDiv" data-tauri-drag-region></div>
        </v-spacer>
        <ActionButton
          icon="mdi-close"
          left_click="closeWindow"
          :onContrast="false"
        ></ActionButton>
      </v-app-bar>
      <div
        class="setting"
        :style="settingStyle"
        @contextmenu="openMenu('snapshotManage')"
      >
        <div class="mytab-container">
          <v-tabs v-model="tab" direction="vertical" class="mytab-header" density="compact">
            <v-tab
              v-for="item in settingsTabs"
              :key="item.value"
              :value="item.value"
              class="settings-tab"
            >
              <v-icon size="18">{{ item.icon }}</v-icon>
              <span>{{ trans[item.label] || item.fallback }}</span>
            </v-tab>
          </v-tabs>

          <v-tabs-window v-model="tab" class="mytab-content">
            <v-tabs-window-item value="translation">
              <Options optionType="translation"></Options>
            </v-tabs-window-item>
            <v-tabs-window-item value="appearance">
              <Options optionType="appearance"></Options>
            </v-tabs-window-item>
            <v-tabs-window-item value="switches">
              <Switches :cates="['basic', 'advance']"></Switches>
            </v-tabs-window-item>
            <v-tabs-window-item value="shortcuts">
              <ShortcutSettings></ShortcutSettings>
            </v-tabs-window-item>
            <v-tabs-window-item value="translatorManager">
              <TranslatorManager></TranslatorManager>
            </v-tabs-window-item>
            <v-tabs-window-item value="customTranslators">
              <CustomTranslatorManager></CustomTranslatorManager>
            </v-tabs-window-item>
            <v-tabs-window-item value="networkProxy">
              <NetworkProxy></NetworkProxy>
            </v-tabs-window-item>
            <v-tabs-window-item value="ocrConfig">
              <OcrConfig></OcrConfig>
            </v-tabs-window-item>
            <v-tabs-window-item value="listenClipboardConfig">
              <BlackWhiteConfig optionName="listenClipboard"></BlackWhiteConfig>
            </v-tabs-window-item>
            <v-tabs-window-item value="dragCopyConfig">
              <BlackWhiteConfig optionName="dragCopy"></BlackWhiteConfig>
            </v-tabs-window-item>
            <v-tabs-window-item value="snapshotManage">
              <Options
                optionType="snapshotManage"
                :restoreButton="false"
              ></Options>
            </v-tabs-window-item>
            <v-tabs-window-item value="actionButtons">
              <ActionButtonConfig></ActionButtonConfig>
            </v-tabs-window-item>
            <v-tabs-window-item value="other">
              <Options optionType="other" :restoreButton="false"></Options>
            </v-tabs-window-item>
            <v-tabs-window-item value="about">
              <About></About>
            </v-tabs-window-item>
          </v-tabs-window>
        </div>
      </div>
    </v-app>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useBaseView } from "@/components/useBaseView";
import Options from "./Options.vue";
import Switches from "./Switches.vue";
import BlackWhiteConfig from "./BlackWhiteConfig.vue";
import About from "./About.vue";
import CustomTranslatorManager from "@/components/CustomTranslatorManager.vue";
import ActionButton from "@/components/ActionButton.vue";
import ActionButtonConfig from "@/components/ActionButtonConfig.vue";
import TranslatorManager from "./TranslatorManager.vue";
import NetworkProxy from "./NetworkProxy.vue";
import OcrConfig from "./OcrConfig.vue";
import ShortcutSettings from "./ShortcutSettings.vue";
import bus from "@/common/event-bus";
import "@/css/shared-styles.css";

const route = useRoute();
const router = useRouter();

const base = useBaseView(() => undefined);
const trans = base.trans;
const appStyle = base.appStyle;
const titlebarHeight = base.titlebarHeight;

const settingsTabs = [
  {
    value: "translation",
    label: "translate",
    fallback: "翻译",
    icon: "mdi-translate",
  },
  {
    value: "appearance",
    label: "appearance",
    fallback: "外观",
    icon: "mdi-palette-outline",
  },
  {
    value: "switches",
    label: "switches",
    fallback: "开关",
    icon: "mdi-toggle-switch-outline",
  },
  {
    value: "shortcuts",
    label: "shortcuts",
    fallback: "快捷键",
    icon: "mdi-keyboard-outline",
  },
  {
    value: "translatorManager",
    label: "translatorManagement",
    fallback: "翻译器管理",
    icon: "mdi-translate-variant",
  },
  {
    value: "customTranslators",
    label: "customTranslators",
    fallback: "自定义翻译器",
    icon: "mdi-robot-outline",
  },
  {
    value: "networkProxy",
    label: "networkProxy",
    fallback: "网络代理",
    icon: "mdi-lan",
  },
  {
    value: "ocrConfig",
    label: "ocrConfig",
    fallback: "OCR",
    icon: "mdi-text-recognition",
  },
  {
    value: "listenClipboardConfig",
    label: "listenClipboardConfig",
    fallback: "监听剪贴板",
    icon: "mdi-clipboard-text-outline",
  },
  {
    value: "dragCopyConfig",
    label: "dragCopyConfig",
    fallback: "拖拽复制",
    icon: "mdi-cursor-move",
  },
  {
    value: "snapshotManage",
    label: "snapshotManage",
    fallback: "配置快照",
    icon: "mdi-camera-outline",
  },
  {
    value: "actionButtons",
    label: "actionButtons",
    fallback: "动作按钮",
    icon: "mdi-gesture-tap-button",
  },
  {
    value: "other",
    label: "other",
    fallback: "其他",
    icon: "mdi-dots-horizontal-circle-outline",
  },
  {
    value: "about",
    label: "about",
    fallback: "关于",
    icon: "mdi-information-outline",
  },
];

const tab = computed({
  get: () => (route.query.tab as string) || "translation",
  set: (val: string) => {
    router.replace({ query: { ...route.query, tab: val } });
  }
});

const settingStyle = computed(() => {
  return { "padding-top": `${base.titlebarHeightVal.value + 5}px` };
});

onMounted(() => {
  bus.gon("setSettingTab", (t: string) => {
    tab.value = t;
  });
});
</script>

<style scoped>
::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}
.settings-root,
.settings-app {
  height: 100vh;
}
.dragableDiv {
  height: 100%;
  width: 100%;
}
.settings-drag-spacer {
  height: 100%;
}
.setting {
  height: calc(100% - 5px);
  padding: 0 12px 12px;
  overflow: hidden;
}
.mytab-container {
  display: flex;
  gap: 12px;
  height: 100%;
  width: 100%;
}
.mytab-header {
  align-self: stretch;
  background: rgba(var(--v-theme-surface), 0.78);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  flex: 0 0 190px;
  overflow: hidden auto;
  padding: 6px;
  scrollbar-width: thin;
}
.mytab-content {
  flex: 1;
  height: 100%;
  overflow-y: auto;
  padding: 0 2px 0 0;
}
.mytab-header :deep(.v-tab) {
  border-radius: 6px;
  justify-content: flex-start;
  min-height: 38px;
  padding-inline: 10px;
}
.mytab-header :deep(.v-tab.v-slide-group-item--active) {
  background: rgba(var(--v-theme-primary), 0.12);
}
.mytab-header :deep(.v-btn__content) {
  gap: 8px;
  justify-content: flex-start;
  overflow: hidden;
  text-align: left;
  width: 100%;
}
@media (max-width: 760px) {
  .mytab-container {
    flex-direction: column;
  }

  .mytab-header {
    flex: 0 0 auto;
    max-height: 150px;
  }
}
</style>
