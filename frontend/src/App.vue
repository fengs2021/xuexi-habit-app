<template>
  <router-view />
</template>

<style>
#app {
  height: 100vh;
}
</style>

<style>
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
</style>
