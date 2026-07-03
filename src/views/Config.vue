<template>
  <v-expansion-panels>
    <v-expansion-panel v-for="translator in translators" :key="translator">
      <v-expansion-panel-header>{{ translator }}</v-expansion-panel-header>
      <v-expansion-panel-content>
        <KeyConfig :identifier="translator"></KeyConfig>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { Component, Vue } from "vue-property-decorator";
import KeyConfig from "@/components/KeyConfig.vue";
import { structActionTypes } from "../common/types";

@Component({
  components: {
    KeyConfig,
  },
})
export default class apiConfig extends Vue {
  translators = structActionTypes;
  tutorial() {
    invoke("open_url", {
      url: "https://www.bilibili.com/video/av53888416/",
    }).catch((err) => {
      console.error("Failed to open URL:", err);
    });
  }
}
</script>

<style scoped></style>
