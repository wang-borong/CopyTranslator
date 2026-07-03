<template>
  <v-card class="tips-card">
    <v-carousel
      v-model="tipIndex"
      height="300px"
      :cycle="true"
      :interval="10000"
    >
      <v-carousel-item v-for="(tip, i) in tips" :key="i">
        <v-sheet height="100%" tile class="tips-sheet">
          <div class="tips-content">
            <p>{{ tip }}</p>
          </div>
        </v-sheet>
      </v-carousel-item>
    </v-carousel>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn variant="text" color="primary" @click="neverShow">{{
        trans["neverShow"]
      }}</v-btn>
      <v-btn variant="text" @click="close">{{ trans["close"] }}</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useBase } from "./useBase";

const emit = defineEmits(["close"]);

const base = useBase();
const trans = base.trans;

const tips = ref<string[]>([]);
const tipIndex = ref(0);

const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
};

const close = () => {
  emit("close");
};

const neverShow = () => {
  base.set("neverShowTips", true);
  close();
};

onMounted(() => {
  tips.value = [
    trans.value["<tooltip>welcome"],
    trans.value["<tip>v12Stepfun"],
    trans.value["<tip>v12AiProviders"],
    trans.value["<tip>v12TranslatorManager"],
    trans.value["<tip>v12ContentStyle"],
    trans.value["<tip>v12Ocr"],
    trans.value["<tip>v12Proxy"],
    trans.value["<tip>v12Portable"],
    trans.value["textAdjustPrompt"],
    trans.value["googlePrompt"],
    trans.value["dragCopyTip"],
    trans.value["<tip>snapshot"],
    trans.value["<tip>focusSource"],
    trans.value["<tip>splitRatio"],
    trans.value["<tip>engineRight"],
    trans.value["<tip>multiSourceEngines"],
    trans.value["<tip>font"],
    trans.value["<tip>themeColor"],
    trans.value["<tip>transparency"],
    trans.value["<tip>penerate"],
    trans.value["<tip>titlebarHeight"],
    trans.value["<tip>engineCache"],
  ];
  tipIndex.value = getRandomInt(0, tips.value.length);
});
</script>

<style scoped>
.tips-card {
  height: 100%;
  width: 100%;
}
.tips-sheet {
  background: rgba(var(--v-theme-surface), 0.96);
}
.tips-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 28px 56px;
  text-align: center;
}
.tips-content p {
  color: rgba(var(--v-theme-on-surface), 0.82);
  font-size: 15px;
  line-height: 1.7;
  margin: 0;
  max-width: 620px;
}
@media (max-width: 560px) {
  .tips-content {
    padding: 24px 32px;
  }
}
</style>
