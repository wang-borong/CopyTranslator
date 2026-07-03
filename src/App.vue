<template>
  <v-app class="app-shell">
    <v-main class="app-main">
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
html,
body,
#app {
  background: transparent !important;
}

#app,
.app-shell,
.app-shell > .v-application__wrap,
.app-main {
  min-height: 100vh;
}

.app-shell.v-application,
.app-shell > .v-application__wrap,
.app-main {
  background: transparent !important;
}

#app {
  -webkit-font-smoothing: antialiased;
  font-family: "Microsoft YaHei", Arial, Helvetica, sans-serif;
}
::-webkit-scrollbar {
  display: none;
}
</style>
