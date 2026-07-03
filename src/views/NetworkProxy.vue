<template>
  <div style="text-align: left; overflow: auto; height: 100%; padding: 10px;">
    <v-card flat>
      <v-card-title>{{ trans["networkProxy"] || "网络代理" }}</v-card-title>
      <Action identifier="enableNetworkProxy"></Action>
      <v-card-text>
        <KeyConfig identifier="networkProxy" :topSave="true"></KeyConfig>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { useBase } from "@/components/useBase";
import KeyConfig from "@/components/KeyConfig.vue";
import Action from "@/components/Action.vue";

const base = useBase();
const trans = base.trans;
</script>
