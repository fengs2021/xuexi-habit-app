<template>
  <div class="datetime-header">
    <span class="date">{{ dateStr }}</span>
    <span class="time">{{ timeStr }}</span>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getBeijingTodayStart } from '@/utils/time'

const dateStr = ref('')
const timeStr = ref('')
let timer = null

const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const updateTime = () => {
  // 使用北京时间（避免浏览器本地时区差异）
  const now = new Date()
  const beijingDate = new Date(now.toLocaleString('en-CA', { timeZone: 'Asia/Shanghai' }).replace(/(\d{4})-(\d{2})-(\d{2})/, '$1-$2-$3T00:00:00+08:00'))
  dateStr.value = (beijingDate.getMonth() + 1) + '月' + beijingDate.getDate() + '日 ' + weekdays[beijingDate.getDay()]
  timeStr.value = String(beijingDate.getHours()).padStart(2, '0') + ':' + String(beijingDate.getMinutes()).padStart(2, '0') + ':' + String(beijingDate.getSeconds()).padStart(2, '0')
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
