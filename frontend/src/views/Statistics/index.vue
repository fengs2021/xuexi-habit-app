<template>
  <div class="statistics-page">
    <!-- 每周报告 -->
    <van-cell-group inset title="📊 每周报告" class="weekly-report-group" v-if="userStore.isChild">
      <div v-if="weeklyReport" class="weekly-report">
        <div class="report-header">
          <span class="report-title">{{ weeklyReport.week_start }} ~ {{ weeklyReport.week_end }}</span>
          <van-tag :type="weeklyReport.viewed ? 'default' : 'success'" size="small">
            {{ weeklyReport.viewed ? '已查看' : '新报告' }}
          </van-tag>
        </div>
        
        <div class="report-summary">
          <div class="summary-item">
            <span class="summary-value">{{ weeklyReport.summary.completed }}</span>
            <span class="summary-label">完成任务</span>
          </div>
          <div class="summary-item">
            <span class="summary-value">{{ weeklyReport.summary.completion_rate }}%</span>
            <span class="summary-label">完成率</span>
          </div>
          <div class="summary-item">
            <span class="summary-value">+{{ weeklyReport.summary.stars_earned }}</span>
            <span class="summary-label">获得积分</span>
          </div>
          <div class="summary-item">
            <span class="summary-value">{{ weeklyReport.summary.signin_days }}/7</span>
            <span class="summary-label">签到天数</span>
          </div>
        </div>
        
        <div class="report-comparison" v-if="weeklyReport.comparison">
          <span class="comparison-text" :class="weeklyReport.comparison.completed_change >= 0 ? 'positive' : 'negative'">
            {{ weeklyReport.comparison.completed_change >= 0 ? '↑' : '↓' }}
            {{ Math.abs(weeklyReport.comparison.completed_change) }}任务 
            {{ weeklyReport.comparison.stars_change >= 0 ? '↑' : '↓' }}
            {{ Math.abs(weeklyReport.comparison.stars_change) }}积分
          </span>
          <span class="vs-text">vs上周</span>
        </div>
        
        <div class="report-rewards" v-if="weeklyReport.new_achievements?.length || weeklyReport.new_stickers?.length">
          <div v-if="weeklyReport.new_achievements?.length" class="reward-item">
            <span class="reward-label">🏅 新成就:</span>
            <span class="reward-names">{{ weeklyReport.new_achievements.map(a => a.name).join(', ') }}</span>
          </div>
          <div v-if="weeklyReport.new_stickers?.length" class="reward-item">
            <span class="reward-label">🌟 新贴纸:</span>
            <span class="reward-names">{{ weeklyReport.new_stickers.map(s => s.emoji).join(' ') }}</span>
          </div>
        </div>
        
        <div class="report-daily" v-if="weeklyReport.daily_details?.length">
          <div class="daily-title">每日完成情况</div>
          <div class="daily-grid">
            <div v-for="day in weeklyReport.daily_details" :key="day.date" class="daily-cell">
              <span class="daily-date">{{ formatShortDate(day.date) }}</span>
              <span class="daily-count" :class="{ 'has-completed': day.completed > 0 }">
                {{ day.completed }}/{{ day.total }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <van-loading v-else-if="reportLoading" style="text-align: center; padding: 16px;" />
      <van-cell v-else title="暂无本周报告" />
    </van-cell-group>

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

    <!-- 周报弹窗提示 -->
    <van-popup v-model:show="showReportPopup" round closeable class="report-popup">
      <div class="popup-content" v-if="weeklyReport">
        <div class="popup-header">📊 本周习惯报告</div>
        <div class="popup-subheader">{{ weeklyReport.week_start }} ~ {{ weeklyReport.week_end }}</div>
        
        <div class="popup-summary">
          <div class="popup-stat">
            <span class="stat-num">{{ weeklyReport.summary.completed }}</span>
            <span class="stat-desc">完成任务</span>
          </div>
          <div class="popup-stat">
            <span class="stat-num">{{ weeklyReport.summary.completion_rate }}%</span>
            <span class="stat-desc">完成率</span>
          </div>
          <div class="popup-stat">
            <span class="stat-num">+{{ weeklyReport.summary.stars_earned }}</span>
            <span class="stat-desc">获得积分</span>
          </div>
        </div>
        
        <div class="popup-msg" v-if="weeklyReport.comparison">
          {{ weeklyReport.comparison.completed_change >= 0 ? '🎉 比上周多做' : '📈 比上周少做' }}
          {{ Math.abs(weeklyReport.comparison.completed_change) }}个任务
        </div>
        
        <van-button type="primary" block @click="viewReport">查看完整报告</van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getDailyStars, getDailyTasks } from '@/api/statistics'
import { getWeeklyReport, markReportViewed } from '@/api/report'
import { showToast } from 'vant'

const userStore = useUserStore()
const dailyStats = ref([])
const loading = ref(true)
const chartRef = ref(null)
const canScroll = ref(false)

// Weekly report
const weeklyReport = ref(null)
const reportLoading = ref(false)
const showReportPopup = ref(false)

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

const formatShortDate = (dateStr) => {
  const date = new Date(dateStr)
  return (date.getMonth() + 1) + '/' + date.getDate()
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

// 检查是否周一且有未查看的报告
const checkMondayPopup = () => {
  const now = new Date()
  const dayOfWeek = now.getDay()
  if (dayOfWeek === 1 && weeklyReport.value && !weeklyReport.value.viewed) {
    showReportPopup.value = true
  }
}

const viewReport = async () => {
  showReportPopup.value = false
  if (userStore.userInfo?.id) {
    await markReportViewed(userStore.userInfo.id)
    if (weeklyReport.value) {
      weeklyReport.value.viewed = true
    }
  }
}

const loadWeeklyReport = async () => {
  if (!userStore.userInfo?.id || !userStore.isChild) return
  
  reportLoading.value = true
  try {
    const res = await getWeeklyReport(userStore.userInfo.id)
    const data = res?.data?.data || res
    weeklyReport.value = data
    
    // 延迟检查是否显示弹窗
    setTimeout(checkMondayPopup, 1000)
  } catch (error) {
    console.error('Load weekly report error:', error)
  } finally {
    reportLoading.value = false
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
  loadWeeklyReport()
  
  const content = document.querySelector('.statistics-page')
  if (content) {
    content.addEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
.statistics-page { 
  padding-bottom: 20px; 
  max-height: calc(100vh - 60px);
  overflow-y: auto;
}

.weekly-report-group {
  margin-bottom: 12px;
}

.weekly-report {
  padding: 12px 16px;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.report-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.report-summary {
  display: flex;
  justify-content: space-around;
  background: linear-gradient(135deg, #FFF5F7 0%, #FFE4EC 100%);
  border-radius: 12px;
  padding: 12px 8px;
  margin-bottom: 12px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.summary-value {
  font-size: 18px;
  font-weight: bold;
  color: #FF69B4;
}

.summary-label {
  font-size: 11px;
  color: #666;
}

.report-comparison {
  text-align: center;
  margin-bottom: 12px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 8px;
}

.comparison-text {
  font-size: 13px;
  font-weight: bold;
}

.comparison-text.positive {
  color: #07c160;
}

.comparison-text.negative {
  color: #ff976a;
}

.vs-text {
  font-size: 11px;
  color: #999;
  margin-left: 8px;
}

.report-rewards {
  margin-bottom: 12px;
}

.reward-item {
  display: flex;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;
}

.reward-label {
  color: #666;
}

.reward-names {
  color: #FF69B4;
  font-weight: bold;
}

.report-daily {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 8px;
}

.daily-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.daily-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.daily-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.daily-date {
  font-size: 10px;
  color: #999;
}

.daily-count {
  font-size: 12px;
  font-weight: bold;
  color: #666;
}

.daily-count.has-completed {
  color: #07c160;
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

.day-group { margin-bottom: 8px; }

.day-header {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: bold;
  color: #333;
  background: #f5f5f5;
}

.task-item { padding: 10px 16px; }

.task-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-icon { font-size: 16px; }
.task-title { font-size: 14px; color: #333; }

.task-status { font-size: 12px; }
.task-status.completed .stars { color: #ff976a; font-weight: bold; }
.task-status.skipped .skipped { color: #999; }

.no-more {
  text-align: center;
  padding: 12px;
  color: #999;
  font-size: 12px;
}

/* 周报弹窗 */
.report-popup {
  width: 90%;
  max-width: 340px;
  background: linear-gradient(135deg, #FFF8DC 0%, #FFFACD 50%, #FFE4E1 100%);
  border: 3px solid #FFD700;
}

.popup-content {
  padding: 24px 20px;
  text-align: center;
}

.popup-header {
  font-size: 20px;
  font-weight: bold;
  color: #FF69B4;
  margin-bottom: 4px;
}

.popup-subheader {
  font-size: 13px;
  color: #666;
  margin-bottom: 16px;
}

.popup-summary {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
}

.popup-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-num {
  font-size: 24px;
  font-weight: bold;
  color: #FF69B4;
}

.stat-desc {
  font-size: 12px;
  color: #666;
}

.popup-msg {
  background: white;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #333;
}
</style>
