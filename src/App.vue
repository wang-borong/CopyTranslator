<template>
  <v-app>
    <v-main>
      <router-view></router-view>
    </v-main>
    <v-snackbar v-model="toastShow" :timeout="3000" location="bottom">
      {{ toastText }}
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import bus from "@/common/event-bus";

const toastShow = ref(false);
const toastText = ref("");

const handleToast = (text: string) => {
  toastText.value = text;
  toastShow.value = true;
};

onMounted(() => {
  bus.on("global-toast", handleToast);
});

onUnmounted(() => {
  bus.off("global-toast", handleToast);
});
</script>

<style>
#app {
  -webkit-font-smoothing: antialiased;
  font-family: "Microsoft YaHei", Arial, Helvetica, sans-serif;
}
::-webkit-scrollbar {
  display: none;
}
</style>
