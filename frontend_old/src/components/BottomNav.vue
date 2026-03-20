<template>
  <van-tabbar v-model="active" route fixed placeholder safe-area-inset-bottom>
    <van-tabbar-item to="/home" icon="home-o">主页</van-tabbar-item>
    <van-tabbar-item to="/manage" icon="setting-o">管理</van-tabbar-item>
    <van-tabbar-item to="/exchange" icon="gift-o">兑换</van-tabbar-item>
    <van-tabbar-item to="/log" icon="orders-o">日志</van-tabbar-item>
    <van-tabbar-item to="/achievement" icon="award-o">成就</van-tabbar-item>
    <van-tabbar-item to="/settings" icon="setting-o">设置</van-tabbar-item>
  </van-tabbar>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const active = ref(0)

const routeMap = {
  '/home': 0,
  '/manage': 1,
  '/exchange': 2,
  '/log': 3,
  '/achievement': 4,
  '/settings': 5
}

watch(
  () => route.path,
  (path) => {
    active.value = routeMap[path] ?? 0
  },
  { immediate: true }
)
</script>

<style scoped>
.van-tabbar {
  background: #fff;
  border-top: 1px solid #eee;
}

.van-tabbar-item--active {
  color: #ff6b9d;
}
</style>
