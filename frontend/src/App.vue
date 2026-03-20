<template>
  <div id="app">
    <router-view />
    <BottomNav v-if="showNav" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav from './components/BottomNav.vue'

const route = useRoute()
const showNav = computed(() => {
  return !['/login', '/guide'].includes(route.path)
})
</script>

<style>
/* App 根组件样式 */
</style>
