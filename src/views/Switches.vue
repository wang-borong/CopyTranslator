<template>
  <div class="switch-root">
    <div class="switch-groups">
      <div v-for="(cate, index) in cates" :key="cate" class="switch-group">
        <div class="switch-group-title">{{ trans[cate] }}</div>
        <div class="switch-grid">
          <div
            v-for="action in groupActions[index]"
            :key="action.id"
            :class="['switch-item', actionItemClass(action)]"
          >
            <Action :identifier="action.id"></Action>
          </div>
        </div>
      </div>
    </div>
    <div class="switch-restore">
      <SimpleButton @click="restore">{{
        trans["restoreMultiDefault"]
      }}</SimpleButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useBase } from "@/components/useBase";
import Action from "../components/Action.vue";
import SimpleButton from "@/components/SimpleButton.vue";
import { Category, ActionView, Identifier } from "../common/types";

const props = defineProps<{
  cates: Category[];
}>();

const base = useBase();
const trans = base.trans;

const actionKeys = computed(() =>
  props.cates.map((x) =>
    (window as any).$controller.action.getKeys(x as Category)
  )
);

const groupActions = computed<ActionView[][]>(() =>
  actionKeys.value.map((keys) =>
    keys.map((id: Identifier) => (window as any).$controller.action.getAction(id))
  )
);

const actionItemClass = (action: ActionView) => {
  if (action.layout?.span && action.layout.span >= 1) {
    return "switch-item-full";
  }
  return "";
};

const restore = () => {
  for (const cate of props.cates) {
    base.callback("restoreMultiDefault", cate);
  }
};
</script>

<style scoped>
.switch-root {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  overflow: auto;
  padding-right: 4px;
}
.switch-groups {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}
.switch-group {
  background: rgba(var(--v-theme-surface), 0.72);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  padding: 10px 12px;
}
.switch-group-title {
  color: rgba(var(--v-theme-on-surface), 0.68);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}
.switch-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 12px;
}
.switch-item-full {
  grid-column: 1 / -1;
}
.switch-restore {
  margin-top: 4px;
  max-width: 260px;
}
@media (max-width: 520px) {
  .switch-grid {
    grid-template-columns: 1fr;
  }
}
</style>
