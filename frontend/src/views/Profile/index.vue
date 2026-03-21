<template>
  <div class="profile-page">
    <!-- 等级信息卡片 -->
    <van-cell-group inset class="level-card">
      <van-cell>
        <template #title>
          <div class="level-info">
            <span class="level-badge">{{ levelInfo.icon }} {{ levelInfo.name }}</span>
            <span class="level-title"> Lv.{{ currentLevel }}</span>
          </div>
        </template>
      </van-cell>
      <van-cell>
        <div class="level-progress">
          <van-progress :percentage="levelProgress" :color="levelProgress >= 100 ? '#FF69B4' : '#FFB6C1'" :stroke-width="12" />
        </div>
        <div class="level-text">
          {{ currentStars }} / {{ nextLevelStars }} ★
          <span v-if="nextLevelStars > currentStars"> (距离 {{ nextLevelInfo?.name }}还差{{ nextLevelStars - currentStars }}★)</span>
        </div>
      </van-cell>
    </van-cell-group>

    <!-- 数据管理（仅家长可见） -->
    <van-cell-group inset title="📦 数据管理" class="data-group" v-if="userStore.isAdmin">
      <van-cell title="📤 导出我的数据" is-link @click="exportMyData" />
      <van-cell title="💾 备份家庭数据" is-link @click="backupFamily" />
    </van-cell-group>

    <!-- 展示设置 -->
    <van-cell-group inset title="🎀 我的展示" class="display-group" v-if="userStore.isChild">
      <van-cell title="已选徽章" :value="selectedAchievement?.name || '未选择'" is-link @click="showAchievementPicker = true" />
      <van-cell title="已选贴纸" :value="selectedStickersText || '未选择'" is-link @click="showStickerPicker = true" />
    </van-cell-group>

    <!-- 成就墙 -->
    <van-cell-group inset title="🏅 我的成就" class="achievement-group">
      <div class="achievement-wall-wrapper">
        <div class="achievement-wall">
          <div
            v-for="achievement in sortedAchievements"
            :key="achievement.id"
            class="achievement-item"
            :class="['level-' + getAchievementLevel(achievement), { earned: isAchievementEarned(achievement.id) }]"
            @click="selectAchievement(achievement)"
            @touchstart="startLongPress(achievement, $event)"
            @touchend="endLongPress"
            @mousedown="startLongPress(achievement, $event)"
            @mouseup="endLongPress"
            @mouseleave="endLongPress"
          >
            <div class="achievement-icon">{{ getFirstChineseChar(achievement.name) }}</div>
            <div class="achievement-name">{{ achievement.name }}</div>
            <div v-if="!isAchievementEarned(achievement.id)" class="achievement-lock">🔒</div>
          </div>
        </div>
      </div>
      
      <van-popup v-model:show="showAchievementTip" round closeable position="center" style="width: 80%; max-width: 300px;">
        <div class="achievement-tip-popup" v-if="tipAchievement">
          <div class="tip-title">🏅 {{ tipAchievement.name }}</div>
          <div class="tip-desc">{{ tipAchievement.description }}</div>
          <div class="tip-reward">奖励: {{ tipAchievement.reward_stars }}★</div>
        </div>
      </van-popup>
    </van-cell-group>

    <!-- 贴纸墙 -->
    <van-cell-group inset title="🌟 贴纸墙" class="sticker-group">
      <div class="sticker-wall-wrapper">
        <div class="sticker-wall">
          <div
            v-for="sticker in allStickers"
            :key="sticker.id"
            class="sticker-item"
            :class="['rarity-' + sticker.rarity, { owned: isStickerOwned(sticker.id) }]"
          >
            <div class="sticker-emoji">{{ sticker.emoji }}</div>
            <div v-if="!isStickerOwned(sticker.id)" class="sticker-mask">?</div>
          </div>
        </div>
      </div>
      <div class="sticker-tip">已收集: {{ ownedStickers.length }} / {{ allStickers.length }}</div>
    </van-cell-group>

    <!-- 登出按钮 -->
    <van-button type="danger" block class="logout-btn" @click="logout">退出登录</van-button>

    <!-- 成就选择弹窗 -->
    <van-popup v-model:show="showAchievementPicker" position="bottom" round>
      <div class="picker-popup">
        <div class="picker-header">选择展示徽章</div>
        <div class="picker-content">
          <div
            v-for="achievement in earnedAchievements"
            :key="achievement.id"
            class="picker-item"
            :class="{ selected: selectedAchievement?.id === achievement.id }"
            @click="confirmAchievement(achievement)"
          >
            <div class="picker-icon">{{ getFirstChineseChar(achievement.name) }}</div>
            <div class="picker-name">{{ achievement.name }}</div>
          </div>
        </div>
        <van-button type="default" block @click="showAchievementPicker = false">取消</van-button>
      </div>
    </van-popup>

    <!-- 贴纸选择弹窗 -->
    <van-popup v-model:show="showStickerPicker" position="bottom" round>
      <div class="picker-popup">
        <div class="picker-header">选择2个展示贴纸</div>
        <div class="picker-content stickers-grid">
          <div
            v-for="sticker in ownedStickers"
            :key="sticker.id"
            class="picker-item sticker-picker-item"
            :class="['rarity-' + sticker.rarity, { selected: isStickerSelected(sticker.id) }]"
            @click="toggleSticker(sticker)"
          >
            <div class="picker-sticker">{{ sticker.emoji }}</div>
            <div class="picker-sticker-name">{{ sticker.name }}</div>
            <div v-if="isStickerSelected(sticker.id)" class="picker-check">✓</div>
          </div>
        </div>
        <van-button type="primary" block @click="confirmStickers" :disabled="selectedStickers.length !== 2">确认选择({{ selectedStickers.length }}/2)</van-button>
        <van-button type="default" block @click="showStickerPicker = false" style="margin-top: 8px;">取消</van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { getAchievements, getUserAchievements } from '@/api/achievements'
import { getStickers, getUserStickers } from '@/api/stickers'
import { exportUserData, backupFamilyData } from '@/api/backup'
import { showConfirmDialog, showToast, showLoadingToast, closeToast } from 'vant'

const router = useRouter()
const userStore = useUserStore()

// 等级数据
const levels = [
  { level: 1, name: '⭐ 小星星', stars: 0, icon: '⭐' },
  { level: 2, name: '🌟 亮晶晶', stars: 50, icon: '🌟' },
  { level: 3, name: '💫 小天使', stars: 150, icon: '💫' },
  { level: 4, name: '✨ 闪亮星', stars: 300, icon: '✨' },
  { level: 5, name: '🌙 月亮星', stars: 500, icon: '🌙' },
  { level: 6, name: '🌸 花仙子', stars: 800, icon: '🌸' },
  { level: 7, name: '🎀 彩虹星', stars: 1200, icon: '🎀' },
  { level: 8, name: '🦋 蝴蝶仙子', stars: 2000, icon: '🦋' },
  { level: 9, name: '👑 小公主/王子', stars: 3500, icon: '👑' },
  { level: 10, name: '🌈 彩虹王者', stars: 6000, icon: '🌈' },
  { level: 11, name: '💎 宇宙之星', stars: 10000, icon: '💎' }
]

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

const allAchievements = ref([])
const earnedAchievements = ref([])
const earnedAchievementIds = ref([])
const allStickers = ref([])
const ownedStickers = ref([])
const ownedStickerIds = ref([])

const selectedAchievement = ref(null)
const selectedStickers = ref([])
const showAchievementPicker = ref(false)
const showStickerPicker = ref(false)

const showAchievementTip = ref(false)
const tipAchievement = ref(null)
let longPressTimer = null

const startLongPress = (achievement, event) => {
  event.preventDefault()
  tipAchievement.value = achievement
  longPressTimer = setTimeout(() => {
    showAchievementTip.value = true
  }, 500)
}

const endLongPress = () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

const sortedAchievements = computed(() => {
  return [...allAchievements.value].sort((a, b) => {
    const aEarned = isAchievementEarned(a.id)
    const bEarned = isAchievementEarned(b.id)
    if (aEarned && !bEarned) return -1
    if (!aEarned && bEarned) return 1
    return getAchievementLevel(a) - getAchievementLevel(b)
  })
})

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

const currentStars = computed(() => userStore.userInfo?.totalStars || 0)

const currentLevel = computed(() => {
  for (let i = levels.length - 1; i >= 0; i--) {
    if (currentStars.value >= levels[i].stars) return levels[i].level
  }
  return 1
})

const levelInfo = computed(() => {
  return levels.find(l => l.level === currentLevel.value) || levels[0]
})

const nextLevelInfo = computed(() => {
  return levels.find(l => l.level === currentLevel.value + 1) || null
})

const nextLevelStars = computed(() => {
  return nextLevelInfo.value?.stars || currentStars.value
})

const levelProgress = computed(() => {
  if (!nextLevelInfo.value) return 100
  const current = currentStars.value - levelInfo.value.stars
  const need = nextLevelInfo.value.stars - levelInfo.value.stars
  return Math.min(100, Math.round((current / need) * 100))
})

const isAchievementEarned = (id) => earnedAchievementIds.value.includes(id)
const isStickerOwned = (id) => ownedStickerIds.value.includes(id)
const isStickerSelected = (id) => selectedStickers.value.some(s => s.id === id)

const selectedStickersText = computed(() => {
  if (selectedStickers.value.length === 0) return '未选择'
  return selectedStickers.value.map(s => s.emoji).join(' ')
})

// 导出我的数据
const exportMyData = async () => {
  if (!userStore.userInfo?.id) {
    showToast('未登录')
    return
  }
  
  showLoadingToast({ message: '导出中...', forbidClick: true })
  try {
    const res = await exportUserData(userStore.userInfo.id)
    const data = res?.data || res
    
    // 创建JSON文件并下载
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `我的数据_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    closeToast()
    showToast('导出成功')
  } catch (error) {
    closeToast()
    console.error('Export error:', error)
    showToast('导出失败')
  }
}

// 备份家庭数据
const backupFamily = async () => {
  if (!userStore.userInfo?.familyId) {
    showToast('无家庭数据')
    return
  }
  
  showLoadingToast({ message: '备份中...', forbidClick: true })
  try {
    const res = await backupFamilyData(userStore.userInfo.familyId)
    const data = res?.data || res
    
    // 创建JSON文件并下载
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `家庭备份_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    closeToast()
    showToast('备份成功')
  } catch (error) {
    closeToast()
    console.error('Backup error:', error)
    showToast('备份失败')
  }
}

const loadData = async () => {
  try {
    // 加载成就
    const achievementRes = await getAchievements()
    allAchievements.value = achievementRes?.data || achievementRes || []
    
    if (userStore.userInfo?.id) {
      const userAchievementRes = await getUserAchievements(userStore.userInfo.id)
      earnedAchievements.value = userAchievementRes?.data || userAchievementRes || []
      earnedAchievementIds.value = (earnedAchievements.value).map(a => a.id)
      
      // 加载展示设置
      await userStore.loadDisplaySettings()
      if (userStore.displaySettings?.equipped_achievement_id) {
        selectedAchievement.value = earnedAchievements.value.find(
          a => a.id === userStore.displaySettings.equipped_achievement_id
        ) || null
      }
      if (userStore.displaySettings?.equipped_sticker1_id) {
        const s1 = ownedStickers.value.find(
          s => s.id === userStore.displaySettings.equipped_sticker1_id
        )
        if (s1 && !selectedStickers.value.find(x => x.id === s1.id)) selectedStickers.value.push(s1)
      }
      if (userStore.displaySettings?.equipped_sticker2_id) {
        const s2 = ownedStickers.value.find(
          s => s.id === userStore.displaySettings.equipped_sticker2_id
        )
        if (s2 && !selectedStickers.value.find(x => x.id === s2.id)) selectedStickers.value.push(s2)
      }
    }
    
    // 加载贴纸
    const stickerRes = await getStickers()
    allStickers.value = stickerRes?.data || stickerRes || []
    
    if (userStore.userInfo?.id) {
      const userStickerRes = await getUserStickers(userStore.userInfo.id)
      ownedStickers.value = userStickerRes?.data || userStickerRes || []
      ownedStickerIds.value = (ownedStickers.value).map(s => s.id)
      
      // 重新加载展示设置中的贴纸
      if (userStore.displaySettings?.equipped_sticker1_id) {
        const s1 = ownedStickers.value.find(
          s => s.id === userStore.displaySettings.equipped_sticker1_id
        )
        if (s1 && !selectedStickers.value.find(x => x.id === s1.id)) selectedStickers.value.push(s1)
      }
      if (userStore.displaySettings?.equipped_sticker2_id) {
        const s2 = ownedStickers.value.find(
          s => s.id === userStore.displaySettings.equipped_sticker2_id
        )
        if (s2 && !selectedStickers.value.find(x => x.id === s2.id)) selectedStickers.value.push(s2)
      }
    }
  } catch (error) {
    console.error('Load profile data error:', error)
  }
}

const selectAchievement = (achievement) => {
  if (!isAchievementEarned(achievement.id)) {
    showToast('尚未获得此成就')
    return
  }
  selectedAchievement.value = achievement
  saveDisplaySettings()
  showToast('已选择展示: ' + achievement.name)
}

const toggleSticker = (sticker) => {
  const idx = selectedStickers.value.findIndex(s => s.id === sticker.id)
  if (idx >= 0) {
    selectedStickers.value.splice(idx, 1)
  } else if (selectedStickers.value.length < 2) {
    selectedStickers.value.push(sticker)
  } else {
    showToast('最多选择2个贴纸')
  }
}

const confirmAchievement = (achievement) => {
  selectedAchievement.value = achievement
  showAchievementPicker.value = false
  saveDisplaySettings()
  showToast('已选择: ' + achievement.name)
}

const confirmStickers = () => {
  if (selectedStickers.value.length !== 2) {
    showToast('请选择2个贴纸')
    return
  }
  showStickerPicker.value = false
  saveDisplaySettings()
  showToast('已选择贴纸')
}

const saveDisplaySettings = async () => {
  await userStore.updateDisplaySettingsAction(
    selectedAchievement.value?.id || null,
    selectedStickers.value[0]?.id || null,
    selectedStickers.value[1]?.id || null
  )
}

const logout = async () => {
  await showConfirmDialog({ title: '提示', message: '确定要退出登录吗？' })
  userStore.logoutAction()
  router.push('/login')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.profile-page {
  padding-bottom: 20px;
}
.level-card {
  margin-bottom: 12px;
  border-radius: 16px;
  background: linear-gradient(135deg, #FFF5F7 0%, #FFE4EC 100%);
  border: 2px solid #FFB6C1;
}
.level-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.level-badge {
  background: linear-gradient(135deg, #FF69B4, #FF85A2);
  color: #fff;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
}
.level-title {
  font-size: 16px;
  color: #FF69B4;
  font-weight: bold;
}
.level-progress {
  margin: 10px 0;
}
.level-text {
  text-align: center;
  color: #FF69B4;
  font-size: 13px;
  font-weight: 500;
}
.data-group :deep(.van-cell-group__title) {
  color: #FF69B4;
  font-size: 14px;
  font-weight: bold;
}
.display-group :deep(.van-cell-group__title) {
  color: #FF69B4;
  font-size: 14px;
  font-weight: bold;
}
.achievement-group {
  margin-bottom: 12px;
}
.achievement-group :deep(.van-cell-group__title) {
  color: #FF69B4;
  font-size: 14px;
  font-weight: bold;
}
.achievement-wall-wrapper {
  max-height: 180px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.achievement-wall {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px;
}
.achievement-item {
  width: 70px;
  text-align: center;
  padding: 10px 6px;
  border-radius: 12px;
  background: #f5f5f5;
  position: relative;
  transition: all 0.3s;
  border: 2px solid #ddd;
}
.achievement-item.earned {
  background: linear-gradient(135deg, #FFF0F5 0%, #FFE4EC 100%);
}
.achievement-item.level-1, .achievement-item.level-2 {
  border-color: #CD7F32;
}
.achievement-item.level-3 {
  border-color: #C0C0C0;
  box-shadow: 0 0 8px rgba(192, 192, 192, 0.4);
}
.achievement-item.level-4 {
  border-color: #FFD700;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.5);
}
.achievement-item.level-5 {
  border-color: #E066FF;
  box-shadow: 0 0 15px rgba(224, 102, 255, 0.6);
  animation: achievementGlow 2s ease-in-out infinite;
}
@keyframes achievementGlow {
  0%, 100% { box-shadow: 0 0 15px rgba(224, 102, 255, 0.6); }
  50% { box-shadow: 0 0 25px rgba(224, 102, 255, 0.8); }
}
.achievement-icon {
  font-size: 28px;
  margin-bottom: 4px;
}
.achievement-name {
  font-size: 10px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.achievement-lock {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 12px;
}
.achievement-tip {
  text-align: center;
  font-size: 11px;
  color: #999;
  padding: 8px;
}
.achievement-tip-popup {
  padding: 24px;
  text-align: center;
}
.tip-title {
  font-size: 18px;
  font-weight: bold;
  color: #FF69B4;
  margin-bottom: 12px;
}
.tip-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}
.tip-reward {
  font-size: 14px;
  color: #FF69B4;
  font-weight: bold;
}
.sticker-group :deep(.van-cell-group__title) {
  color: #FF69B4;
  font-size: 14px;
  font-weight: bold;
}
.sticker-wall-wrapper {
  max-height: 180px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.sticker-wall {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
}
.sticker-item {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  position: relative;
  background: #f5f5f5;
  transition: all 0.3s;
}
.sticker-item.owned {
  cursor: pointer;
}
.sticker-item.owned:hover {
  transform: scale(1.1);
}
.sticker-item.rarity-N {
  border: 2px solid #ccc;
  background: #fafafa;
}
.sticker-item.rarity-R {
  border: 2px solid #4D96FF;
  background: linear-gradient(135deg, #E8F4FF 0%, #D4EDFF 100%);
  box-shadow: 0 0 8px rgba(77, 150, 255, 0.3);
}
.sticker-item.rarity-SR {
  border: 2px solid #9B59B6;
  background: linear-gradient(135deg, #F3E8FF 0%, #E8D4FF 100%);
  box-shadow: 0 0 12px rgba(155, 89, 182, 0.4);
}
.sticker-item.rarity-SR::before {
  content: '';
  position: absolute;
  inset: -2px;
  border: 1px solid gold;
  border-radius: 12px;
}
.sticker-item.rarity-SSR {
  border: 3px solid gold;
  background: linear-gradient(135deg, #FFF8E1 0%, #FFE082 100%);
  box-shadow: 0 0 16px rgba(255, 215, 0, 0.5);
  animation: ssrGlow 2s ease-in-out infinite;
}
@keyframes ssrGlow {
  0%, 100% { box-shadow: 0 0 16px rgba(255, 215, 0, 0.5); }
  50% { box-shadow: 0 0 24px rgba(255, 215, 0, 0.8); }
}
.sticker-mask {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
}
.sticker-tip {
  text-align: center;
  font-size: 12px;
  color: #999;
  padding: 8px;
}
.picker-popup {
  padding: 16px;
  max-height: 60vh;
}
.picker-header {
  font-size: 16px;
  font-weight: bold;
  color: #FF69B4;
  text-align: center;
  margin-bottom: 16px;
}
.picker-content {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-bottom: 16px;
  max-height: 40vh;
  overflow-y: auto;
}
.picker-item {
  width: 80px;
  text-align: center;
  padding: 12px 8px;
  border-radius: 12px;
  background: #f5f5f5;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}
.picker-item:hover {
  background: #FFF0F5;
}
.picker-item.selected {
  border-color: #FF69B4;
  background: #FFF0F5;
}
.picker-icon {
  font-size: 32px;
  margin-bottom: 4px;
}
.picker-name {
  font-size: 11px;
  color: #666;
}
.stickers-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.sticker-picker-item {
  width: 70px;
  padding: 10px 6px;
  font-size: 24px;
  position: relative;
}
.picker-sticker {
  font-size: 28px;
  margin-bottom: 4px;
}
.picker-sticker-name {
  font-size: 10px;
  color: #666;
}
.picker-check {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  background: #FF69B4;
  color: #fff;
  border-radius: 50%;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logout-btn {
  margin: 40px 16px;
  border-radius: 22px;
}
</style>
