<template>
  <div class="mobile-layout">
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
        <span class="current-stars">💖 余额: {{ userStore.userInfo?.stars || 0 }} ★</span>
      </div>
    </div>

    <div class="mobile-content" :class="{ 'has-tabbar': showTabBar }">
      <router-view />
    </div>

    <van-tabbar v-if="showTabBar" v-model="activeTab" @change="onTabChange" fixed placeholder class="pink-tabbar">
      <van-tabbar-item
        v-for="item in tabBarItems"
        :key="item.path"
        :name="item.path"
        :icon="item.icon"
      >
        {{ item.label }}
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { getDisplaySettings } from '@/api/display'
import { getAchievements } from '@/api/achievements'
import { getStickers } from '@/api/stickers'

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
const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const allAchievements = ref([])
const allStickers = ref([])
const equippedAchievement = ref(null)
const equippedStickers = ref([])

const getAchievementLevel = (achievement) => {
  if (!achievement) return 1
  const type = achievement.type || ''
  const name = achievement.name || ''
  // Diamond: level achievements
  if (type.includes('level_') || name.includes('级')) return 5
  // Gold: 100 tasks, 200 stars, 3 goals, 30 stickers
  if (type.includes('task_count_100') || type.includes('star_total_200') || 
      type.includes('goal_completed_3') || type.includes('sticker_count_30')) return 4
  // Silver: 50 tasks, 50 stars, 10 stickers
  if (type.includes('task_count_50') || type.includes('star_total_50') || 
      type.includes('sticker_count_10')) return 3
  // Bronze: 10 tasks, 1 goal
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

const updateTime = () => {
  const now = new Date()
  dateStr.value = (now.getMonth() + 1) + '月' + now.getDate() + '日 ' + weekdays[now.getDay()]
  timeStr.value = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0')
}

const totalStars = computed(() => {
  return userStore.userInfo?.totalStars || userStore.userInfo?.stars || 0
})

const tabBarItems = computed(() => {
  const baseItems = [
    { path: '/dashboard', label: '🏠 首页', icon: 'wap-home-o' },
    { path: '/task', label: '📋 任务', icon: 'orders-o' },
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

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  loadDisplayData()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
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
.header-bar {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #FFB6C1 0%, #FFC0CB 25%, #FF69B4 50%, #FF85A2 75%, #FFB6C1 100%);
  background-size: 200% 200%;
  color: #fff;
  box-shadow: 0 4px 15px rgba(255, 105, 180, 0.4);
  animation: pinkGradient 6s ease infinite;
  overflow: hidden;
}
@keyframes pinkGradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
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
  border-radius: 12px;
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
  border-radius: 18px;
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
  border-radius: 4px;
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
  background-color: #FFF5F7;
}
.mobile-content.has-tabbar {
  padding-bottom: 70px;
}
.pink-tabbar {
  background: linear-gradient(180deg, #FFF0F5 0%, #FFFFFF 100%) !important;
  box-shadow: 0 -2px 10px rgba(255, 105, 180, 0.15);
}
.pink-tabbar :deep(.van-tabbar-item) {
  color: #C9A0A0 !important;
}
.pink-tabbar :deep(.van-tabbar-item--active) {
  color: #FF69B4 !important;
}
.pink-tabbar :deep(.van-tabbar-item__text) {
  font-size: 12px;
  font-weight: 500;
}
</style>
