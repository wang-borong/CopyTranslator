<template>
  <div class="window-container" :style="borderRadiusStyle">
    <v-app :style="[appStyle, transparency]">
      <v-dialog v-model="dialog">
        <Tips @close="dialog = false"></Tips>
      </v-dialog>
      <v-app-bar
        app
        :color="barColor"
        dark
        dense
        :height="base.titlebarHeight.value"
        :flat="base.config.value.penerate"
        :class="{
          'rounded-top-bar': !drawer,
          'rounded-top-right-only': drawer,
        }"
      >
        <ActionButton
          v-if="!base.config.value.penerate"
          left_click="drawer"
          right_click="settings"
          icon="mdi-menu"
        ></ActionButton>
        <div class="noSelect" style="overflow: hidden;">
          <p
            style="margin-top: auto; margin-bottom: auto; white-space: nowrap;"
            class="hidden-mobile"
            v-if="!isMini"
          >
            {{ trans[base.layoutType.value] }}
          </p>
        </div>
        <v-spacer
          style="height: calc(100% - 1px); padding-top: 1px;"
          @mouseover="penerate(true)"
          @mouseleave="penerate(false)"
        >
          <div :class="{ dragableDiv: !base.config.value.penerate }"></div>
        </v-spacer>
        <v-menu location="top">
          <template v-slot:activator="{ props }">
            <div
              style="display: flex;"
              v-bind="props"
              @contextmenu.prevent="base.callback('listenClipboard')"
            >
              <v-badge
                dot
                :color="badgeColor"
                location="bottom right"
                style="margin: auto;"
              >
                <EngineButton
                  :engine="base.currentEngine.value"
                  :valid="valid"
                  :enable="false"
                  :tooltip="trans['engineButton']"
                ></EngineButton>
              </v-badge>
            </div>
          </template>
          <v-card :style="popupStyle" class="popup">
            <v-row style="margin: 0px;">
              <v-col
                v-for="(engineGroup, groupIndex) in restEngineGroups"
                :key="groupIndex"
                style="padding: 0px;"
              >
                <div
                  v-for="engine in engineGroup"
                  :key="engine"
                  :style="engineButtonStyle"
                >
                  <EngineButton :engine="engine" :valid="valid"></EngineButton>
                </div>
              </v-col>
            </v-row>
          </v-card>
        </v-menu>
        <div class="d-flex flex-row" style="height: 100%; padding-right: 1px;">
          <div
            v-if="base.config.value.penerate"
            class="dragableDiv"
            style="display: flex;"
          >
            <ActionButton
              icon="mdi-cursor-move"
              style="margin: auto;"
            ></ActionButton>
          </div>
          <ActionButton
            v-if="base.config.value.penerate"
            left_click="drawer"
            right_click="settings"
            icon="mdi-menu"
          ></ActionButton>
          <ActionButton
            class="action-btn"
            v-for="(actionButton, buttonIndex) in actionButtons"
            :left_click="actionButton.left_click"
            :right_click="actionButton.right_click"
            :icon="actionButton.icon"
            :tooltip="actionButton.tooltip"
            :predefined="actionButton.predefined"
            :key="buttonIndex"
          ></ActionButton>
        </div>
      </v-app-bar>
      <v-navigation-drawer
        v-model="drawer"
        app
        disable-resize-watcher
        :permanent="drawer"
        hide-overlay
        :width="drawerWidth"
        :style="drawerStyle"
        class="rounded-left-drawer"
      >
        <div class="drawer-groups">
          <div
            v-for="group in drawerGroups"
            :key="group.key"
            class="drawer-group"
          >
            <div v-if="group.title" class="drawer-group-title">
              {{ trans[group.title] || group.title }}
            </div>
            <Action
              v-for="actionId in group.items"
              :identifier="actionId"
              :key="actionId"
              :class="drawerActionClass(actionId)"
            ></Action>
          </div>
        </div>
        <div
          class="drawer-resizer"
          @mousedown.prevent="startDrawerResize"
          @dblclick.prevent="resetDrawerWidth"
        ></div>
      </v-navigation-drawer>

      <ContrastPanel
        :style="[area, transparentArea]"
        :class="{ active: drawer, 'rounded-panel': true }"
        @mouseover="penerate(true)"
        @mouseleave="penerate(false)"
      ></ContrastPanel>
    </v-app>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import ActionButton from "../components/ActionButton.vue";
import ContrastPanel from "../components/ContrastPanel.vue";
import Action from "../components/Action.vue";
import Tips from "@/components/Tips.vue";
import EngineButton from "../components/EngineButton.vue";
import { useBaseView } from "../components/useBaseView";
import { useWindowResize } from "../components/useWindowResize";
import {
  Identifier,
  ActionButton as ActionButtonType,
  abstractTranslatorTypes,
  hexToRgb,
  colorStatusMap,
} from "../common/types";
import "@/css/shared-styles.css";

const base = useBaseView(() => undefined);
const { windowHeight, windowWidth } = useWindowResize();

const dialog = ref(false);
const marginBottom = ref(5);
const trans = base.trans;
const appStyle = base.appStyle;

const actionKeys = computed(() =>
  (window as any).$controller.action.getKeys("contrastPanel") as Identifier[]
);

const drawerActionClass = (actionId: Identifier) => {
  const action = (window as any).$controller.action.getAction(actionId);
  return action.layout?.stack ? "drawer-action-language" : "";
};

const drawerGroups = computed(() => {
  const actions = actionKeys.value.map((id) =>
    (window as any).$controller.action.getAction(id)
  );
  const groups: Array<{
    key: string;
    title: string;
    items: Identifier[];
  }> = [];
  const groupMap = new Map<
    string,
    { key: string; title: string; items: Identifier[] }
  >();
  actions.forEach((action) => {
    const title = action.layout?.group || "";
    const key = title || "group";
    if (!groupMap.has(key)) {
      const group = { key, title, items: [action.id] };
      groupMap.set(key, group);
      groups.push(group);
    } else {
      groupMap.get(key)?.items.push(action.id);
    }
  });
  return groups;
});

const valid = computed(() => {
  return false;
});

const isMini = computed(() => base.config.value.transparency > 0);

onMounted(() => {
  if (!base.config.value.neverShowTips) dialog.value = true;
});

const nButton = computed(() => {
  return Math.max(
    1,
    Math.floor(
      (windowHeight.value - base.titlebarHeightVal.value) /
        (base.titlebarHeightVal.value + marginBottom.value)
    )
  );
});

const customTranslators = computed<string[]>(() => base.config.value.customTranslators || []);

const engines = computed(() => {
  return [
    ...(base.config.value["translator-enabled"] || []),
    ...abstractTranslatorTypes,
    ...customTranslators.value,
  ];
});

const restEngines = computed(() => {
  return engines.value.filter((engine: any) => engine !== base.currentEngine.value);
});

const restEngineGroups = computed(() => {
  return sliceArray(restEngines.value, nButton.value);
});

const engineButtonStyle = computed(() => ({
  "margin-bottom": `${marginBottom.value}px`,
}));

const popupStyle = computed(() => {
  const width = (base.titlebarHeightVal.value + 10) * restEngineGroups.value.length;
  const margin = base.titlebarHeightVal.value / 2 + 5;
  return { width: `${width}px`, "margin-top": `${margin}px` };
});

const actionButtons = computed<ActionButtonType[]>(() => base.config.value.actionButtons || []);

const badgeColor = computed(() => colorStatusMap.get(base.status.value) || "grey");

const clampDrawerWidth = (value: number) => Math.min(360, Math.max(160, value));

const drawerWidth = computed({
  get: () => clampDrawerWidth(Number(base.config.value.drawerWidth) || 200),
  set: (value: number) => base.set("drawerWidth", clampDrawerWidth(value)),
});

const barWidth = computed(() => base.config.value.drawer ? drawerWidth.value : 0);

const area = computed(() => ({
  "margin-top": base.titlebarHeight.value,
  "margin-left": `${barWidth.value}px`,
  width: `calc(100vw - ${barWidth.value}px)`,
  "font-family": base.config.value.contentFontFamily,
  transition: "margin-left 0.18s ease, width 0.18s ease",
}));

const transparentArea = computed(() => ({}));

const drawerStyle = computed(() => ({
  "border-width": "2px 0px 2px 2px",
  "border-style": "solid",
  "border-color": barColor.value,
  "--drawer-hover-bg": base.isDarkTheme.value
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(17, 24, 39, 0.06)",
  "--drawer-group-color": base.isDarkTheme.value
    ? "rgba(255, 255, 255, 0.52)"
    : "rgba(17, 24, 39, 0.56)",
}));

const drawer = computed({
  get: () => base.config.value.drawer,
  set: (val: boolean) => base.set("drawer", val),
});

const backgroundColor = computed(() => {
  const alpha = 1 - base.config.value.transparency;
  const bgColor = base.isDarkTheme.value
    ? base.config.value.backgroundColor?.dark || "#121212"
    : base.config.value.backgroundColor?.light || "#ffffff";
  const rgb = hexToRgb(bgColor);
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
});

const barColor = computed(() => {
  const alpha = 1 - base.config.value.transparency;
  const bgColor = base.isDarkTheme.value
    ? base.config.value.primaryColor?.dark || "#8E24AA"
    : base.config.value.primaryColor?.light || "#8E24AA";
  const rgb = hexToRgb(bgColor);
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
});

const transparency = computed(() => ({
  background: backgroundColor.value,
}));

const borderRadius = "10px";

const borderRadiusStyle = computed(() => ({
  "--border-radius": borderRadius,
  "border-width": "2px",
  "border-style": "solid",
  "border-color": barColor.value,
}));

function sliceArray<T>(arr: T[], size: number) {
  var arr2 = [];
  for (var i = 0; i < arr.length; i = i + size) {
    arr2.push(arr.slice(i, i + size));
  }
  return arr2;
}

const penerate = (value: boolean) => {
  if (base.config.value.penerate) {
    base.set("ignoreMouseEvents", value);
  } else if (base.config.value.ignoreMouseEvents) {
    base.set("ignoreMouseEvents", false);
  }
};

let drawerStartX = 0;
let drawerStartWidth = 0;

const onDrawerResizeMove = (event: MouseEvent) => {
  drawerWidth.value = drawerStartWidth + event.clientX - drawerStartX;
};

const stopDrawerResize = () => {
  document.removeEventListener("mousemove", onDrawerResizeMove);
  document.removeEventListener("mouseup", stopDrawerResize);
};

const startDrawerResize = (event: MouseEvent) => {
  drawerStartX = event.clientX;
  drawerStartWidth = drawerWidth.value;
  document.addEventListener("mousemove", onDrawerResizeMove);
  document.addEventListener("mouseup", stopDrawerResize);
};

const resetDrawerWidth = () => {
  drawerWidth.value = 200;
};

onUnmounted(() => {
  stopDrawerResize();
});
</script>

<style>
.window-container {
  border-radius: var(--border-radius);
  overflow: hidden;
  height: 100vh;
  width: 100vw;
  box-sizing: border-box;
}

.window-container .v-application {
  border-radius: var(--border-radius) !important;
  overflow: hidden !important;
}

.window-container .v-application__wrap {
  border-radius: var(--border-radius) !important;
}

.window-container .rounded-top-bar {
  border-radius: var(--border-radius) var(--border-radius) 0 0 !important;
  overflow: hidden !important;
}

.window-container .rounded-top-bar .v-toolbar__content {
  border-radius: var(--border-radius) var(--border-radius) 0 0 !important;
}

.window-container .rounded-top-bar::before,
.window-container .rounded-top-bar::after {
  border-radius: var(--border-radius) var(--border-radius) 0 0 !important;
}

.window-container .rounded-top-right-only {
  border-radius: 0 var(--border-radius) 0 0 !important;
  overflow: hidden !important;
}

.window-container .rounded-top-right-only .v-toolbar__content {
  border-radius: 0 var(--border-radius) 0 0 !important;
}

.window-container .rounded-top-right-only::before,
.window-container .rounded-top-right-only::after {
  border-radius: 0 var(--border-radius) 0 0 !important;
}

.window-container .rounded-left-drawer {
  border-radius: var(--border-radius) 0 0 var(--border-radius) !important;
  overflow: hidden !important;
}

.window-container .rounded-left-drawer .v-navigation-drawer__content {
  overflow-y: auto;
}

.drawer-groups {
  padding: 8px 8px 14px;
}

.drawer-group + .drawer-group {
  margin-top: 10px;
}

.drawer-group-title {
  color: var(--drawer-group-color);
  font-size: 12px;
  line-height: 18px;
  padding: 4px 8px;
}

.window-container .rounded-left-drawer .action-row {
  min-height: 40px;
  border-radius: 6px;
  padding: 4px 8px;
}

.window-container .rounded-left-drawer .action-row:hover {
  background: var(--drawer-hover-bg);
}

.window-container .rounded-left-drawer .action-label {
  line-height: 18px;
}

.drawer-resizer {
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
}

.drawer-resizer:hover {
  background: rgba(142, 36, 170, 0.45);
}
</style>
