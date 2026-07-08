<template>
  <div class="simple-button-wrap">
    <v-btn v-bind="$attrs" class="defaultBtn">
      <slot />
    </v-btn>
  </div>
</template>

<script setup lang="ts">
// Simple wrapping button for Vuetify 3 compatibility
defineOptions({
  inheritAttrs: false,
});
</script>

<style scoped>
.defaultBtn {
  width: calc(100% - 10px);
  margin-top: 4px;
}
.simple-button-wrap {
  text-align: center;
  width: 100%;
}
</style>
