<template>
  <div class="options-root">
    <div v-for="group in groupedActions" :key="group.key" class="options-group">
      <div v-if="group.title" class="options-group-title">
        {{ trans[group.title] || group.title }}
      </div>
      <div class="options-grid">
        <div
          v-for="action in group.items"
          :key="action.id"
          :class="['options-item', actionItemClass(action)]"
        >
          <Action :identifier="action.id"></Action>
        </div>
      </div>
    </div>
    <div class="options-restore" v-if="restoreButton">
      <SimpleButton @click="base.callback('restoreMultiDefault', optionType)">
        {{ trans["restoreMultiDefault"] }}
      </SimpleButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Action from "../components/Action.vue";
import SimpleButton from "@/components/SimpleButton.vue";
import { useBase } from "@/components/useBase";
import {
  Identifier,
  MenuActionType,
  Category,
  ActionView,
} from "../common/types";

const props = defineProps<{
  optionType: MenuActionType | Category;
  restoreButton?: boolean;
}>();

const base = useBase();
const trans = base.trans;

const actionKeys = computed(() =>
  (window as any).$controller.action.getKeys(props.optionType) as Identifier[]
);

const groupedActions = computed(() => {
  const actions = actionKeys.value.map((id) =>
    (window as any).$controller.action.getAction(id)
  );
  const groups: Array<{
    key: string;
    title: string;
    items: ActionView[];
  }> = [];
  let index = 0;
  actions.forEach((action) => {
    const title = action.layout?.group || "";
    const last = groups[groups.length - 1];
    if (!last || last.title !== title) {
      groups.push({
        key: `${title || "group"}-${index++}`,
        title,
        items: [action],
      });
    } else {
      last.items.push(action);
    }
  });
  return groups;
});

const actionItemClass = (action: ActionView) => {
  if (action.layout?.span && action.layout.span >= 1) {
    return "options-item-full";
  }
  if (
    action.actionType === "prompt" ||
    action.actionType === "multi_select"
  ) {
    return "options-item-full";
  }
  return "";
};
</script>

<style scoped>
.options-root {
  text-align: left;
  overflow: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 4px;
}
.options-group {
  background: rgba(var(--v-theme-surface), 0.72);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  padding: 10px 12px;
}
.options-group-title {
  color: rgba(var(--v-theme-on-surface), 0.68);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}
.options-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-column-gap: 12px;
  grid-row-gap: 6px;
  align-content: start;
}
.options-item-full {
  grid-column: 1 / -1;
}
.options-restore {
  margin-top: 4px;
  max-width: 260px;
}
@media (max-width: 680px) {
  .options-grid {
    grid-template-columns: 1fr;
  }
}
</style>
