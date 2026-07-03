<template>
  <div class="about-page">
    <section class="about-hero">
      <div class="logo"></div>
      <div class="about-title">CopyTranslator</div>
      <div class="about-version">{{ version }}</div>
      <p class="about-copy">{{ aboutText }}</p>
    </section>
    <section class="about-actions">
      <Action identifier="checkUpdate"></Action>
      <Action identifier="changelog"></Action>
      <Action identifier="userManual"></Action>
      <Action identifier="homepage"></Action>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { version } from "@/common/constant";
import Action from "../components/Action.vue";
import { useBase } from "@/components/useBase";

const base = useBase();

const aboutText = computed(() => {
  if (base.trans.value["localeName"] === "English") {
    return [
      "CopyTranslator is free and open source.",
      "If it helps you, consider starring the project on GitHub",
      "or sharing it with others.",
    ].join(" ");
  }
  return [
    "CopyTranslator 是免费开源软件。",
    "如果它对你有帮助，可以在 GitHub 上为项目点星，",
    "或推荐给需要的人。",
  ].join("");
});
</script>

<style scoped>
.about-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  overflow: auto;
  padding-right: 4px;
}
.about-hero,
.about-actions {
  background: rgba(var(--v-theme-surface), 0.72);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  padding: 16px;
}
.about-hero {
  align-items: center;
  display: flex;
  flex-direction: column;
  text-align: center;
}
.logo {
  background-image: url("../images/icon.png");
  background-position: center;
  background-size: contain;
  height: 96px;
  width: 96px;
}
.about-title {
  font-size: 20px;
  font-weight: 800;
  line-height: 28px;
  margin-top: 10px;
}
.about-version {
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 13px;
  line-height: 20px;
}
.about-copy {
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-size: 13px;
  line-height: 1.7;
  margin: 10px 0 0;
  max-width: 640px;
}
.about-actions {
  display: grid;
  gap: 6px 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
@media (max-width: 560px) {
  .about-actions {
    grid-template-columns: 1fr;
  }
}
</style>
