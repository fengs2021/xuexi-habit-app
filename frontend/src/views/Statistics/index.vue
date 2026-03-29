<template>
  <div class="statistics-page">
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">

    <!-- 每周报告 -->
    <van-cell-group inset title="📊 每周报告" class="weekly-report-group" v-if="userStore.isChild">
      <div v-if="weeklyReport" class="weekly-report">
        <div class="report-header">
          <span class="report-title">{{ weeklyReport.week_start }} ~ {{ weeklyReport.week_end }}</span>
          <van-tag :type="weeklyReport.viewed ? 'default' : 'success'" size="small" @click="viewReport">
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
              <span v-if="task.action === 'complete'" class="stars">+{{ task.star_reward || task.stars_earned }} ★</span>
              <span v-else-if="task.action === 'skipped'" class="skipped">已跳过</span>
              <span v-else class="skipped">{{ task.action }}</span>
            </div>
          </template>
        </van-cell>
      </div>
      <van-loading v-if="tasksLoading" style="text-align: center; padding: 16px;" />
      <div v-if="noMoreTasks && groupedTasksCount > 0" class="no-more">没有更多了</div>
      <van-empty v-if="!tasksLoading && Object.keys(groupedTasks).length === 0" description="暂无任务记录" />
    </van-cell-group>

    <!-- 周报弹窗提示 -->
    <van-popup v-model:show="showReportPopup" round closeable class="report-popup-full">
      <div class="popup-content" v-if="lastWeekReport">
        <div class="popup-header">📊 上周习惯报告</div>
        <div class="popup-subheader">{{ lastWeekReport.week_start }} ~ {{ lastWeekReport.week_end }}</div>
        
        <!-- 汇总数据 -->
        <div class="popup-summary">
          <div class="popup-stat">
            <span class="stat-num">{{ lastWeekReport.summary?.completed || 0 }}</span>
            <span class="stat-desc">完成任务</span>
          </div>
          <div class="popup-stat">
            <span class="stat-num">{{ lastWeekReport.summary?.completion_rate || 0 }}%</span>
            <span class="stat-desc">完成率</span>
          </div>
          <div class="popup-stat">
            <span class="stat-num">+{{ lastWeekReport.summary?.stars_earned || 0 }}</span>
            <span class="stat-desc">获得星星</span>
          </div>
          <div class="popup-stat">
            <span class="stat-num">{{ lastWeekReport.summary?.signin_days || 0 }}/7</span>
            <span class="stat-desc">签到天数</span>
          </div>
        </div>
        
        <!-- 对比上周 -->
        <div class="popup-comparison" v-if="lastWeekReport.comparison">
          <span v-if="lastWeekReport.comparison.completed_change >= 0">🎉 比上上周多完成 {{ lastWeekReport.comparison.completed_change }} 个任务</span>
          <span v-else>📈 比上上周少完成 {{ Math.abs(lastWeekReport.comparison.completed_change) }} 个任务</span>
          <span v-if="lastWeekReport.comparison.stars_change >= 0">，多获得 {{ lastWeekReport.comparison.stars_change }} 星星</span>
          <span v-else>，少获得 {{ Math.abs(lastWeekReport.comparison.stars_change) }} 星星</span>
        </div>
        
        <!-- 每日详情 -->
        <div class="daily-details" v-if="lastWeekReport.daily_details?.length">
          <div class="daily-title">每日完成情况</div>
          <div class="daily-list">
            <div v-for="day in lastWeekReport.daily_details" :key="day.date" class="daily-item">
              <span class="daily-date">{{ formatShortDate(day.date) }}</span>
              <span class="daily-info">
                <span class="task-count">完成任务: {{ day.completed }}/{{ day.total }}</span>
                <span class="star-count">获得: {{ day.stars }}⭐</span>
              </span>
            </div>
          </div>
        </div>
        
        <!-- 签到情况 -->
        <div class="signin-details" v-if="lastWeekReport.signins?.length">
          <div class="signin-title">签到情况</div>
          <div class="signin-list">
            <span v-for="s in lastWeekReport.signins" :key="s.sign_date" class="signin-badge">
              {{ formatShortDate(s.sign_date) }}: +{{ s.bonus_stars }}⭐ (连续{{ s.streak_days }}天)
            </span>
          </div>
        </div>
        
        <!-- 新成就 -->
        <div class="achievements-details" v-if="lastWeekReport.new_achievements?.length">
          <div class="achievements-title">🏅 新成就</div>
          <div class="achievements-list">
            <span v-for="a in lastWeekReport.new_achievements" :key="a.id" class="achievement-badge">
              {{ a.name }}
            </span>
          </div>
        </div>
        
        <!-- 新贴纸 -->
        <div class="stickers-details" v-if="lastWeekReport.new_stickers?.length">
          <div class="stickers-title">🌟 新贴纸</div>
          <div class="stickers-list">
            <span v-for="s in lastWeekReport.new_stickers" :key="s.id" class="sticker-badge">
              {{ s.emoji }}
            </span>
          </div>
        </div>
        
        <van-button type="primary" block @click="showReportPopup = false" class="close-btn">关闭</van-button>
      </div>
    </van-popup>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, watch } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { useRoute } from 'vue-router'
import { getDailyStars, getDailyTasks } from '@/api/statistics'
import { getWeeklyReport, markReportViewed } from '@/api/report'
import { showToast } from 'vant'

const route = useRoute()
const userStore = useUserStore()
const dailyStats = ref([])
const loading = ref(true)
const chartRef = ref(null)
const canScroll = ref(false)
const refreshing = ref(false)

// Weekly report
const weeklyReport = ref(null)
const reportLoading = ref(false)
const showReportPopup = ref(false)

// 周一弹窗用的上周报告数据
const lastWeekReport = ref(null)

// Tasks data
const taskItems = ref([])
const tasksLoading = ref(false)
const tasksOffset = ref(0)
const tasksLimit = 100
const hasMoreTasks = ref(true)
const totalTasksDays = ref(0)

const groupedTasks = computed(() => {
  const grouped = {}
  // 只显示已完成的任务（排除跳过的）
  const completedTasks = taskItems.value.filter(item => item.action === 'complete')
  for (const item of completedTasks) {
    const date = item.completed_date
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(item)
  }
  return grouped
})

// 如果 URL 有 childId 参数，说明是查看指定孩子的统计；否则是自己的
const targetUserId = computed(() => {
  return route.query.childId || userStore.userInfo?.id
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
  // 使用北京时间，避免日期差一天
  const date = new Date(dateStr)
  const parts = date.toLocaleString('en-CA', { timeZone: 'Asia/Shanghai' }).split('T')[0].split('-')
  return parts[1] + '/' + parts[2]
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

// 检查是否周一（每周只弹一次）- 使用北京时间
const checkMondayPopup = async () => {
  const now = new Date()
  // 转换为北京时间
  const beijingDateStr = now.toLocaleString('en-CA', { timeZone: 'Asia/Shanghai' })
  const beijingDate = new Date(beijingDateStr.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1-$2-$3T00:00:00+08:00'))
  const dayOfWeek = beijingDate.getDay()
  
  if (dayOfWeek !== 1) return
  
  // 获取本周一日期作为key（北京时间）
  const weekStart = new Date(beijingDate)
  weekStart.setDate(beijingDate.getDate() - dayOfWeek + 1)
  const weekKey = 'report_popup_' + weekStart.toISOString().split('T')[0]
  
  // 检查是否已弹过
  if (localStorage.getItem(weekKey)) return
  
  // 获取上周报告数据
  if (targetUserId.value) {
    try {
      const res = await getWeeklyReport(targetUserId.value, 'last')
      const data = res?.data?.data || res
      if (data) {
        lastWeekReport.value = data
        showReportPopup.value = true
        localStorage.setItem(weekKey, '1')
      }
    } catch (error) {
      console.error('Load last week report error:', error)
    }
  }
}

const viewReport = async () => {
  // 点击"新报告"标签时，获取并显示上周报告
  if (!lastWeekReport.value && targetUserId.value) {
    try {
      const res = await getWeeklyReport(targetUserId.value, 'last')
      const data = res?.data?.data || res
      if (data) {
        lastWeekReport.value = data
      }
    } catch (error) {
      console.error('Load last week report error:', error)
    }
  }
  showReportPopup.value = true
}

const loadWeeklyReport = async () => {
  // 如果是查看孩子的统计（URL有childId），显示孩子的周报；否则只有孩子自己才能看周报
  const isViewingChild = !!route.query.childId
  if (!targetUserId.value || (!isViewingChild && !userStore.isChild)) return
  
  reportLoading.value = true
  try {
    const res = await getWeeklyReport(targetUserId.value)
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
  while (!targetUserId.value && attempts < 10) {
    await new Promise(resolve => setTimeout(resolve, 200))
    attempts++
  }
  
  if (!targetUserId.value) {
    showToast('未登录')
    loading.value = false
    return
  }
  
  try {
    const data = await getDailyStars(targetUserId.value)
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
    const data = await getDailyTasks(targetUserId.value, tasksOffset.value, tasksLimit)
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

// 每次页面显示时刷新数据
onActivated(() => {
  loadStats()
  loadTasks(true)
  loadWeeklyReport()
})

const onRefresh = async () => {
  refreshing.value = true
  await Promise.all([
    loadStats(),
    loadTasks(true),
    loadWeeklyReport()
  ])
  refreshing.value = false
}
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
  border-radius: var(--clay-radius-sm);
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
  border-radius: var(--clay-radius-md);
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
  border-radius: var(--clay-radius-md);
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
  border-radius: var(--clay-radius-sm);
}

.chart-scroll::-webkit-scrollbar-thumb {
  background: #1989fa;
  border-radius: var(--clay-radius-sm);
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
  border-radius: var(--clay-radius-sm) var(--clay-radius-sm) 0 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  border-radius: var(--clay-radius-sm) var(--clay-radius-sm) 0 0;
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
.report-popup, .report-popup-full {
  width: 95%;
  max-width: 400px;
  max-height: 85vh;
  overflow-y: auto;
  background: linear-gradient(135deg, #FFF8DC 0%, #FFFACD 50%, #FFE4E1 100%);
  border: 3px solid #FFD700;
}

.popup-content {
  padding: 20px 16px;
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
  flex-wrap: wrap;
}

.popup-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 70px;
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

.popup-comparison {
  background: white;
  border-radius: var(--clay-radius-md);
  padding: 10px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #333;
}

.popup-msg {
  background: white;
  border-radius: var(--clay-radius-md);
  padding: 10px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #333;
}

/* 每日详情 */
.daily-details, .signin-details, .achievements-details, .stickers-details {
  text-align: left;
  margin-bottom: 16px;
}

.daily-title, .signin-title, .achievements-title, .stickers-title {
  font-size: 14px;
  font-weight: bold;
  color: #FF69B4;
  margin-bottom: 8px;
}

.daily-list {
  background: white;
  border-radius: var(--clay-radius-md);
  padding: 8px;
}

.daily-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
}

.daily-item:last-child {
  border-bottom: none;
}

.daily-date {
  font-size: 13px;
  color: #666;
}

.daily-info {
  display: flex;
  gap: 12px;
}

.task-count, .star-count {
  font-size: 12px;
  color: #333;
}

/* 签到情况 */
.signin-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.signin-badge {
  background: #FFF0F5;
  border-radius: var(--clay-radius-sm);
  padding: 4px 8px;
  font-size: 11px;
  color: #FF69B4;
}

/* 成就贴纸 */
.achievements-list, .stickers-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.achievement-badge {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  border-radius: var(--clay-radius-sm);
  padding: 4px 10px;
  font-size: 12px;
  color: #fff;
}

.sticker-badge {
  font-size: 20px;
  background: #f0f0f0;
  border-radius: var(--clay-radius-md);
  padding: 4px 8px;
}

.close-btn {
  margin-top: 16px;
}
</style>
