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
  const now = new Date()
  // 正确获取北京时间（避免 en-CA 12小时制问题）
  const dateFtd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' })
  const timeFtd = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  const dateStrLocal = dateFtd.format(now)
  const timeStrLocal = timeFtd.format(now)
  const beijingDate = new Date(dateStrLocal + 'T' + timeStrLocal + ':00+08:00')
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
