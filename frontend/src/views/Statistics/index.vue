<template>
  <div class="statistics-page">
    <!-- 柱状图 -->
    <van-cell-group inset title="近30日积分获取统计">
      <div class="chart-container">
        <div class="chart-scroll" ref="chartRef">
          <div class="bar-chart">
            <div
              v-for="item in dailyStats"
              :key="item.date"
              class="bar-item"
            >
              <div class="bar-wrapper">
                <div
                  class="bar-fill"
                  :style="{
                    height: getBarHeight(item.stars) + '%',
                    backgroundColor: getColor(item.stars)
                  }"
                >
                  <span class="bar-value" v-if="item.stars > 0">+{{ item.stars }}</span>
                </div>
              </div>
              <div class="bar-label">{{ getDayLabel(item.date) }}</div>
            </div>
          </div>
        </div>
        <div class="scroll-hint" v-if="canScroll">
          <span>← 左右滑动 →</span>
        </div>
      </div>
      <van-empty v-if="dailyStats.length === 0 && !loading" description="暂无数据" />
      <van-loading v-if="loading" style="text-align: center; padding: 20px;" />
    </van-cell-group>

    <!-- 汇总 -->
    <van-cell-group inset title="汇总" class="summary-group">
      <van-cell title="总获得积分" :value="totalStars + ' ★'" />
      <van-cell title="日均积分" :value="avgStars + ' ★'" />
      <van-cell title="最高单日" :value="maxStars + ' ★'" />
    </van-cell-group>

    <!-- 每日任务完成情况 -->
    <van-cell-group inset title="任务完成详情" class="tasks-group">
      <div v-for="(tasks, date) in groupedTasks" :key="date" class="day-group">
        <div class="day-header">{{ formatDate(date) }}</div>
        <van-cell
          v-for="task in tasks"
          :key="task.completed_date + task.title"
          class="task-item"
        >
          <template #title>
            <div class="task-info">
              <span class="task-icon">{{ getIcon(task.icon) }}</span>
              <span class="task-title">{{ task.title }}</span>
            </div>
          </template>
          <template #right-icon>
            <div class="task-status" :class="task.action">
              <span v-if="task.action === 'completed'" class="stars">+{{ task.star_reward }} ★</span>
              <span v-else class="skipped">已跳过</span>
            </div>
          </template>
        </van-cell>
      </div>
      <van-loading v-if="tasksLoading" style="text-align: center; padding: 16px;" />
      <div v-if="noMoreTasks && groupedTasksCount > 0" class="no-more">没有更多了</div>
      <van-empty v-if="!tasksLoading && Object.keys(groupedTasks).length === 0" description="暂无任务记录" />
    </van-cell-group>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUpdated, reactive } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getDailyStars, getDailyTasks } from '@/api/statistics'
import { showToast } from 'vant'

const userStore = useUserStore()
const dailyStats = ref([])
const loading = ref(true)
const chartRef = ref(null)
const canScroll = ref(false)

// Tasks data
const taskItems = ref([])
const tasksLoading = ref(false)
const tasksOffset = ref(0)
const tasksLimit = 7
const hasMoreTasks = ref(true)
const totalTasksDays = ref(0)

const groupedTasks = computed(() => {
  const grouped = {}
  for (const item of taskItems.value) {
    const date = item.completed_date
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(item)
  }
  return grouped
})

const groupedTasksCount = computed(() => Object.keys(groupedTasks.value).length)

const totalStars = computed(() => dailyStats.value.reduce((sum, item) => sum + item.stars, 0))
const avgStars = computed(() => dailyStats.value.length === 0 ? 0 : Math.round(totalStars.value / dailyStats.value.length))
const maxStars = computed(() => dailyStats.value.length === 0 ? 0 : Math.max(...dailyStats.value.map(item => item.stars)))
const noMoreTasks = computed(() => !hasMoreTasks.value)

const getBarHeight = (stars) => {
  if (maxStars.value === 0) return 0
  return Math.max((stars / (maxStars.value * 1.2)) * 100, stars > 0 ? 5 : 0)
}

const getColor = (stars) => {
  if (stars >= avgStars.value * 1.5) return '#07c160'
  if (stars >= avgStars.value) return '#1989fa'
  if (stars >= avgStars.value * 0.5) return '#ff976a'
  return '#999'
}

const getDayLabel = (dateStr) => {
  const match = dateStr.match(/月(\d+)日/)
  return match ? match[1] : dateStr
}

const getIcon = (icon) => {
  const iconMap = {
    'todo-o': '📋',
    'star': '⭐',
    'clock': '⏰',
    'good': '👍',
    'smile': '😊',
    'medal': '🏅',
    'trophy': '🏆',
    'book': '📚',
    'sports': '⚽',
    'music': '🎵',
    'art': '🎨',
    'default': '✨'
  }
  return iconMap[icon] || iconMap['default']
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (dateStr === today.toISOString().split('T')[0]) {
    return '今天'
  } else if (dateStr === yesterday.toISOString().split('T')[0]) {
    return '昨天'
  } else {
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
}

const checkScroll = () => {
  if (chartRef.value) {
    canScroll.value = chartRef.value.scrollWidth > chartRef.value.clientWidth
  }
}

const loadStats = async () => {
  let attempts = 0
  while (!userStore.userInfo?.id && attempts < 10) {
    await new Promise(resolve => setTimeout(resolve, 200))
    attempts++
  }
  
  if (!userStore.userInfo?.id) {
    showToast('未登录')
    loading.value = false
    return
  }
  
  try {
    const data = await getDailyStars(userStore.userInfo.id)
    dailyStats.value = data || []
  } catch (error) {
    console.error('loadStats error:', error)
    showToast('加载失败')
  } finally {
    loading.value = false
    setTimeout(checkScroll, 100)
  }
}

const loadTasks = async (reset = false) => {
  if (tasksLoading.value) return
  if (!reset && !hasMoreTasks.value) return
  
  if (reset) {
    tasksOffset.value = 0
    taskItems.value = []
    hasMoreTasks.value = true
  }
  
  tasksLoading.value = true
  
  try {
    const data = await getDailyTasks(userStore.userInfo.id, tasksOffset.value, tasksLimit)
    if (reset) {
      taskItems.value = data.items || []
    } else {
      taskItems.value = [...taskItems.value, ...(data.items || [])]
    }
    hasMoreTasks.value = data.hasMore
    totalTasksDays.value = data.totalDays
    tasksOffset.value += data.items?.length || 0
  } catch (error) {
    console.error('loadTasks error:', error)
    showToast('加载失败')
  } finally {
    tasksLoading.value = false
  }
}

const handleScroll = (e) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target
  if (scrollTop + clientHeight >= scrollHeight - 50) {
    loadTasks()
  }
}

onMounted(() => {
  loadStats()
  loadTasks(true)
  
  // Add scroll listener
  const content = document.querySelector('.statistics-page')
  if (content) {
    content.addEventListener('scroll', handleScroll)
  }
})

onUpdated(() => {
  checkScroll()
})
</script>

<style scoped>
.statistics-page { 
  padding-bottom: 20px; 
  max-height: calc(100vh - 60px);
  overflow-y: auto;
}

.chart-container {
  position: relative;
  padding: 12px 16px;
}

.chart-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #1989fa #f5f5f5;
}

.chart-scroll::-webkit-scrollbar {
  height: 6px;
}

.chart-scroll::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 3px;
}

.chart-scroll::-webkit-scrollbar-thumb {
  background: #1989fa;
  border-radius: 3px;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  min-width: max-content;
  height: 165px;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 28px;
}

.bar-wrapper {
  width: 100%;
  height: 140px;
  background: #f5f5f5;
  border-radius: 4px 4px 0 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 4px;
  transition: height 0.3s ease;
  min-height: 20px;
}

.bar-value {
  font-size: 9px;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.bar-label {
  font-size: 9px;
  color: #999;
  margin-top: 4px;
  text-align: center;
}

.scroll-hint {
  text-align: center;
  padding: 8px 0 4px;
  font-size: 12px;
  color: #999;
}

.summary-group { margin-top: 12px; }

.tasks-group { margin-top: 12px; }

.day-group {
  margin-bottom: 8px;
}

.day-header {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: bold;
  color: #333;
  background: #f5f5f5;
}

.task-item {
  padding: 10px 16px;
}

.task-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-icon {
  font-size: 16px;
}

.task-title {
  font-size: 14px;
  color: #333;
}

.task-status {
  font-size: 12px;
}

.task-status.completed .stars {
  color: #ff976a;
  font-weight: bold;
}

.task-status.skipped .skipped {
  color: #999;
}

.no-more {
  text-align: center;
  padding: 12px;
  color: #999;
  font-size: 12px;
}
</style>
