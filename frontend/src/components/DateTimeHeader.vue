<template>
  <div class="datetime-header">
    <span class="date">{{ dateStr }}</span>
    <span class="time">{{ timeStr }}</span>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const dateStr = ref('')
const timeStr = ref('')
let timer = null

const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const updateTime = () => {
  const now = new Date()
  dateStr.value = (now.getMonth() + 1) + '月' + now.getDate() + '日 ' + weekdays[now.getDay()]
  timeStr.value = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0')
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.datetime-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 14px;
}
.datetime-header .date {
  font-weight: bold;
}
.datetime-header .time {
  font-family: monospace;
}
</style>
