<template>
  <div style="text-align: center; width: 100%;">
    <v-btn v-bind="$attrs" class="defaultBtn">
      <slot />
    </v-btn>
  </div>
</template>

<script setup lang="ts">
// Simple wrapping button for Vuetify 3 compatibility
</script>

<style scoped>
.defaultBtn {
  width: calc(100% - 10px);
  margin-top: 4px;
}
</style>
