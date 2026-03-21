<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { initTheme } = useTheme()

onMounted(() => {
  initTheme()
})
</script>

<style>
#app {
  height: 100vh;
}

/* Theme CSS Variables */
:root {
  --theme-primary: #FF69B4;
  --theme-secondary: #FFB6C1;
}

/* Fix Vant toast text color for light backgrounds */
:root {
  --van-toast-text-color: #323233;
  --van-toast-font-size: 14px;
}
.van-toast {
  background-color: rgba(255, 255, 255, 0.95) !important;
  color: #323233 !important;
}
.van-toast__text {
  color: #323233 !important;
}

/* Theme-specific overrides */
.theme-pink {
  --van-primary-color: #FF69B4;
}
.theme-blue {
  --van-primary-color: #1989fa;
}
.theme-yellow {
  --van-primary-color: #FFD700;
}
.theme-purple {
  --van-primary-color: #9B59B6;
}
.theme-green {
  --van-primary-color: #07c160;
}
.theme-orange {
  --van-primary-color: #FF976A;
}
</style>
