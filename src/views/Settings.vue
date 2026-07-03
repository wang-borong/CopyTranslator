<template>
  <div style="height: 100vh;">
    <v-app style="height: 100%;" :style="appStyle">
      <v-app-bar color="primary" dense :height="titlebarHeight">
        <v-spacer style="height: 100%;">
          <div class="dragableDiv"></div>
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
          <v-tabs v-model="tab" direction="vertical" class="mytab-header">
            <v-tab value="translation">{{ trans["translate"] }}</v-tab>
            <v-tab value="appearance">{{ trans["appearance"] }}</v-tab>
            <v-tab value="switches">{{ trans["switches"] }}</v-tab>
            <v-tab value="translatorManager">{{
              trans["translatorManagement"] || "翻译器管理"
            }}</v-tab>
            <v-tab value="customTranslators">{{
              trans["customTranslators"]
            }}</v-tab>
            <v-tab value="networkProxy">{{
              trans["networkProxy"] || "网络代理"
            }}</v-tab>
            <v-tab value="ocrConfig">{{ trans["ocrConfig"] }}</v-tab>
            <v-tab value="listenClipboardConfig">{{
              trans["listenClipboardConfig"]
            }}</v-tab>
            <v-tab value="dragCopyConfig">{{ trans["dragCopyConfig"] }}</v-tab>
            <v-tab value="snapshotManage">{{ trans["snapshotManage"] }}</v-tab>
            <v-tab value="actionButtons">{{ trans["actionButtons"] }}</v-tab>
            <v-tab value="other">{{ trans["other"] }}</v-tab>
            <v-tab value="about">{{ trans["about"] }}</v-tab>
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
import bus from "@/common/event-bus";
import "@/css/shared-styles.css";

const route = useRoute();
const router = useRouter();

const base = useBaseView(() => undefined);
const trans = base.trans;
const appStyle = base.appStyle;
const titlebarHeight = base.titlebarHeight;

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
  display: auto;
}
.dragableDiv {
  height: 100%;
  width: 100%;
}
.setting {
  height: calc(100% - 5px);
  padding-right: 10px;
  padding-left: 10px;
  overflow: hidden;
}
.mytab-container {
  display: flex;
  height: 100%;
  width: 100%;
}
.mytab-header {
  flex: 0 0 160px;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}
.mytab-content {
  flex: 1;
  height: 100%;
  overflow-y: auto;
  padding-left: 15px;
}
</style>
