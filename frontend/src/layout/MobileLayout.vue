<template>
  <div class="mobile-layout">
    <!-- 恭喜弹窗 -->
    <van-popup v-model:show="showCongrats" round closeable class="congrats-popup">
      <div class="congrats-content">
        <div class="congrats-header">🎉 恭喜获得 🎉</div>
        
        <div v-if="newAchievements.length > 0" class="reward-section">
          <div class="reward-title">🏅 新成就</div>
          <div v-for="item in newAchievements" :key="item.id" class="reward-item achievement">
            <span class="reward-icon">{{ item.icon || '🏅' }}</span>
            <span class="reward-name">{{ item.name }}</span>
          </div>
        </div>
        
        <div v-if="newStickers.length > 0" class="reward-section">
          <div class="reward-title">🌟 新贴纸</div>
          <div class="sticker-grid">
            <span v-for="item in newStickers" :key="item.id" class="reward-sticker">{{ item.emoji }}</span>
          </div>
        </div>
        
        <div v-if="newAchievements.length === 0 && newStickers.length === 0" class="reward-section">
          <div class="reward-title">🎊 有新奖励可领取！</div>
        </div>
      </div>
    </van-popup>

    <div class="header-bar">
      <div class="flower-deco flower-1">🌸</div>
      <div class="flower-deco flower-2">🌺</div>
      <div class="flower-deco flower-3">🌷</div>
      <div class="header-left">
        <span class="datetime">✨ {{ dateStr }} {{ timeStr }}</span>
        <span class="role-tag" :class="userStore.isAdmin ? 'admin' : 'child'">
          🌷 {{ userStore.isAdmin ? '家长' : '学生' }}
        </span>
        <span class="nickname">💕 {{ userStore.userInfo?.nickname || '' }}</span>
      </div>
      <div class="header-center" v-if="userStore.isChild">
        <span v-if="equippedStickers[0]" class="equipped-sticker">{{ equippedStickers[0].emoji }}</span>
        <span v-if="equippedAchievement" class="equipped-badge">{{ equippedAchievement.name }}</span>
        <span v-if="equippedStickers[1]" class="equipped-sticker">{{ equippedStickers[1].emoji }}</span>
      </div>
      <div class="header-right">
        <span class="total-stars">🌟 累计: {{ userStore.userInfo?.totalStars || 0 }} ★</span>
        <StreakBadge :streak="userStreak" class="header-streak" />
        <span class="current-stars">💖 余额: {{ userStore.userInfo?.stars || 0 }} ★</span>
      </div>
    </div>

    <div class="mobile-content" :class="{ 'has-tabbar': showTabBar }">
      <router-view />
    </div>

    <van-tabbar v-if="showTabBar" v-model="activeTab" @change="onTabChange" fixed placeholder class="theme-tabbar">
      <van-tabbar-item
        v-for="item in tabBarItems"
        :key="item.path"
        :name="item.path"
        :icon="item.icon"
      >
        {{ item.label }}
      </van-tabbar-item>
    </van-tabbar>
    <div class="spin-wheel-fab" @click="showSpinWheel = true" v-if="userStore.isChild">
      <span class="fab-icon">🎰</span>
      <span class="fab-label">转盘</span>
    </div>
  </div>
  <SpinWheel
    :visible="showSpinWheel"
    :userId="userStore.userInfo?.id"
    @close="showSpinWheel = false"
  />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { getDisplaySettings } from '@/api/display'
import { getAchievements } from '@/api/achievements'
import { getStickers } from '@/api/stickers'
import { getNewRewards } from '@/api/statistics'
import SpinWheel from '@/components/SpinWheel.vue'
import StreakBadge from '@/components/StreakBadge.vue'

const props = defineProps({
  showHeader: { type: Boolean, default: true },
  title: { type: String, default: '' },
  showTabBar: { type: Boolean, default: true }
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const dateStr = ref('')
const timeStr = ref('')
let timer = null
let refreshTimer = null
const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const allAchievements = ref([])
const allStickers = ref([])
const equippedAchievement = ref(null)
const equippedStickers = ref([])

// 新奖励弹窗
const showCongrats = ref(false)
const showSpinWheel = ref(false)
const userStreak = ref(0)
const newAchievements = ref([])
const newStickers = ref([])

const getAchievementLevel = (achievement) => {
  if (!achievement) return 1
  const type = achievement.type || ''
  const name = achievement.name || ''
  if (type.includes('level_') || name.includes('级')) return 5
  if (type.includes('task_count_100') || type.includes('star_total_200') || 
      type.includes('goal_completed_3') || type.includes('sticker_count_30')) return 4
  if (type.includes('task_count_50') || type.includes('star_total_50') || 
      type.includes('sticker_count_10')) return 3
  if (type.includes('task_count_10') || type.includes('goal_completed_1')) return 2
  return 1
}

const achievementLevel = computed(() => getAchievementLevel(equippedAchievement.value))

const getFirstChineseChar = (str) => {
  if (!str) return '成'
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    if (code >= 0x4E00 && code <= 0x9FA5) {
      return str[i]
    }
  }
  return str[0] || '成'
}

const loadDisplayData = async () => {
  if (!userStore.userInfo?.id || !userStore.isChild) return
  try {
    const settingsRes = await getDisplaySettings(userStore.userInfo.id)
    const settings = settingsRes?.data || settingsRes
    
    const achievementsRes = await getAchievements()
    allAchievements.value = achievementsRes?.data || achievementsRes || []
    
    const stickersRes = await getStickers()
    allStickers.value = stickersRes?.data || stickersRes || []
    
    if (settings?.equipped_achievement_id) {
      equippedAchievement.value = allAchievements.value.find(a => a.id === settings.equipped_achievement_id) || null
    }
    if (settings?.equipped_sticker1_id || settings?.equipped_sticker2_id) {
      equippedStickers.value = []
      if (settings.equipped_sticker1_id) {
        const s1 = allStickers.value.find(s => s.id === settings.equipped_sticker1_id)
        if (s1) equippedStickers.value.push(s1)
      }
      if (settings.equipped_sticker2_id) {
        const s2 = allStickers.value.find(s => s.id === settings.equipped_sticker2_id)
        if (s2) equippedStickers.value.push(s2)
      }
    }
  } catch (e) {
    console.error('Load display data error:', e)
  }
}


// 检查打卡连续天数
const checkStreak = async () => {
  if (!userStore.userInfo?.id || !userStore.isChild) return
  try {
    const res = await fetch(`/api/streak/${userStore.userInfo.id}`)
    const data = await res.json()
    if (data.code === 0) {
      userStreak.value = data.data?.currentStreak || 0
    }
  } catch (e) {
    console.error('Check streak error:', e)
  }
}

// 检查新奖励
const checkNewRewards = async () => {
  if (!userStore.userInfo?.id || !userStore.isChild) return
  
  // 检查是否已经弹过今天的新奖励
  const lastShown = localStorage.getItem('rewards_shown_date')
  const today = new Date().toISOString().split('T')[0]
  if (lastShown === today) return
  
  try {
    const res = await getNewRewards(userStore.userInfo.id)
    const data = res?.data || res
    
    newAchievements.value = data?.achievements || []
    newStickers.value = data?.stickers || []
    
    if (newAchievements.value.length > 0 || newStickers.value.length > 0) {
      showCongrats.value = true
      localStorage.setItem('rewards_shown_date', today)
    }
  } catch (e) {
    console.error('Check new rewards error:', e)
  }
}

const updateTime = () => {
  const now = new Date()
  // 正确获取北京时间（避免 en-CA 12小时制问题）
  const dateFtd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' })
  const timeFtd = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hour12: false })
  const dateStrLocal = dateFtd.format(now)
  const timeStrLocal = timeFtd.format(now)
  const beijingDate = new Date(dateStrLocal + 'T' + timeStrLocal + ':00+08:00')
  dateStr.value = (beijingDate.getMonth() + 1) + '月' + beijingDate.getDate() + '日 ' + weekdays[beijingDate.getDay()]
  timeStr.value = String(beijingDate.getHours()).padStart(2, '0') + ':' + String(beijingDate.getMinutes()).padStart(2, '0')
}

const totalStars = computed(() => {
  return userStore.userInfo?.totalStars || userStore.userInfo?.stars || 0
})

const tabBarItems = computed(() => {
  const baseItems = [
    { path: '/dashboard', label: '🏠 首页', icon: 'wap-home-o' },
    { path: '/task', label: '📋 任务', icon: 'orders-o' },
    { path: '/study', label: '📚 学习', icon: 'orders-o' },
    { path: '/statistics', label: '📊 统计', icon: 'chart-trending-o' },
    { path: '/reward', label: '🎁 奖励', icon: 'gift-o' },
    { path: '/family', label: '👨👩👧 家庭', icon: 'friends-o' },
    { path: '/profile', label: '💝 我的', icon: 'user-o' }
  ]
  if (userStore.isAdmin) {
    baseItems.splice(3, 0, { path: '/exchange', label: '✅ 审批', icon: 'records-o' })
  }
  return baseItems
})

const activeTab = ref(route.path)

const onTabChange = (path) => {
  router.push(path)
}

onMounted(async () => {
  await userStore.getUserInfoAction()
  updateTime()
  timer = setInterval(updateTime, 1000)
  // 每5秒刷新用户数据（星星余额）
  refreshTimer = setInterval(() => {
    userStore.getUserInfoAction()
  }, 5000)
  loadDisplayData()
  checkNewRewards()
  checkStreak()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (refreshTimer) clearInterval(refreshTimer)
})

onBeforeRouteUpdate((to) => {
  activeTab.value = to.path
  loadDisplayData()
})
</script>

<style scoped>
.mobile-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* 恭喜弹窗样式 */
.congrats-popup {
  width: 85%;
  max-width: 320px;
  background: linear-gradient(135deg, #FFF8DC 0%, #FFFACD 50%, #FFE4E1 100%);
  border: 3px solid #FFD700;
}

.congrats-content {
  padding: 20px;
  text-align: center;
}

.congrats-header {
  font-size: 24px;
  font-weight: bold;
  color: var(--theme-primary);
  margin-bottom: 16px;
  text-shadow: 0 2px 4px rgba(255,105,180,0.3);
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.reward-section {
  margin-bottom: 16px;
}

.reward-title {
  font-size: 16px;
  font-weight: bold;
  color: #FF6B6B;
  margin-bottom: 10px;
  padding: 8px;
  background: rgba(255,255,255,0.7);
  border-radius: var(--clay-radius-sm);
}

.reward-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px;
  margin-bottom: 8px;
  background: white;
  border-radius: var(--clay-radius-sm);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.reward-item.achievement {
  border-left: 4px solid #FFD700;
}

.reward-icon {
  font-size: 24px;
}

.reward-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.sticker-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: var(--clay-radius-sm);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.reward-sticker {
  font-size: 40px;
  animation: bounce 0.6s ease infinite;
}

.reward-sticker:nth-child(2n) {
  animation-delay: 0.1s;
}

.reward-sticker:nth-child(3n) {
  animation-delay: 0.2s;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.header-bar {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--theme-gradient);
  background-size: 200% 200%;
  color: #fff;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15), inset 0 -2px 6px rgba(255, 255, 255, 0.3);
  
  overflow: hidden;
}

.flower-deco {
  position: absolute;
  font-size: 24px;
  opacity: 0.6;
  animation: floatFlower 3s ease-in-out infinite;
}
.flower-1 { top: 5px; left: 10px; animation-delay: 0s; }
.flower-2 { top: 10px; right: 15px; animation-delay: 1s; font-size: 20px; }
.flower-3 { bottom: 5px; right: 50px; animation-delay: 2s; font-size: 18px; }
@keyframes floatFlower {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-5px) rotate(10deg); }
}
.header-left {
  display: flex;
  flex-direction: column;
  gap: 3px;
  z-index: 1;
}
.datetime {
  font-size: 11px;
  opacity: 0.95;
  text-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.role-tag {
  padding: 2px 10px;
  border-radius: var(--clay-radius-sm);
  font-size: 11px;
  font-weight: bold;
  width: fit-content;
  background: rgba(255,255,255,0.4);
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
.nickname {
  font-size: 15px;
  font-weight: bold;
  text-shadow: 0 1px 3px rgba(0,0,0,0.25);
}
.header-center {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  z-index: 1;
}
.equipped-badge {
  background: linear-gradient(135deg, #FFE082 0%, #FFD54F 100%);
  color: #5D3A1A;
  padding: 5px 12px;
  border-radius: var(--clay-radius-md);
  font-size: 18px;
  font-weight: bold;
  white-space: nowrap;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}
.equipped-stickers-left, .equipped-stickers-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.equipped-sticker {
  font-size: 14px;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.95);
  border-radius: var(--clay-radius-sm);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.equipped-sticker.rarity-R {
  border: 1px solid #4D96FF;
}
.equipped-sticker.rarity-SR {
  border: 1px solid #9B59B6;
}
.equipped-sticker.rarity-SSR {
  border: 2px solid gold;
  animation: ssrGlow 1.5s ease-in-out infinite;
}
@keyframes ssrGlow {
  0%, 100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.5); }
  50% { box-shadow: 0 0 10px rgba(255, 215, 0, 0.8); }
}
.header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  z-index: 1;
}
.total-stars {
  font-size: 11px;
  opacity: 0.9;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  font-weight: normal;
}
.current-stars {
  font-size: 14px;
  font-weight: bold;
  text-shadow: 0 1px 3px rgba(0,0,0,0.25);
  display: flex;
  align-items: center;
  gap: 2px;
}
.mobile-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  background-color: var(--theme-bg, #FFF5F7);
}
.mobile-content.has-tabbar {
  padding-bottom: 70px;
}
.theme-tabbar {
  background: linear-gradient(180deg, var(--theme-bg) 0%, #FFFFFF 100%) !important;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.8);
}
.theme-tabbar :deep(.van-tabbar-item) {
  color: var(--theme-text, #C9A0A0) !important;
}
.theme-tabbar :deep(.van-tabbar-item--active) {
  color: var(--theme-primary, #FF69B4) !important;
}
.pink-tabbar :deep(.van-tabbar-item__text) {
  font-size: 12px;
  font-weight: 500;
}

/* 转盘悬浮按钮 */
.spin-wheel-fab {
  position: fixed;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--theme-gradient);
  color: white;
  padding: 10px 8px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.2), inset -2px -2px 6px rgba(255, 255, 255, 0.3);
  z-index: 100;
  cursor: pointer;
  animation: pulse 2s infinite;
}

.fab-icon {
  font-size: 22px;
}

.fab-label {
  font-size: 9px;
  font-weight: bold;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(102, 126, 234, 0); }
  100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0); }
}

.header-streak {
  margin-left: 8px;
}
</style>
