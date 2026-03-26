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

/* Theme CSS Variables - Default (Pink) */
:root {
  --theme-primary: #FF69B4;
  --theme-secondary: #FFB6C1;
  --theme-gradient: linear-gradient(135deg, #FFB6C1 0%, #FFC0CB 25%, #FF69B4 50%, #FF85A2 75%, #FFB6C1 100%);
  --theme-shadow: rgba(255, 105, 180, 0.4);
  --theme-bg: #FFF5F7;
  --theme-text: #C9A0A0;
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

/* Theme-specific Vant overrides */
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
