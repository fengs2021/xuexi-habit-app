<template>
  <van-cell-group inset class="signin-group">
    <van-cell>
      <template #title>
        <div class="signin-header">
          <span class="signin-title">📝 每日签到</span>
          <span class="streak-info" v-if="signinInfo.streakDays > 0">
            🔥 连续 {{ signinInfo.streakDays }} 天
          </span>
        </div>
      </template>
    </van-cell>
    <van-cell>
      <div class="calendar-wrapper" ref="calendarWrapper">
        <div class="calendar" ref="calendarRef">
          <div
            v-for="day in calendarDays"
            :key="day.date"
            class="calendar-day"
            :class="{
              'checked': day.checked,
              'today': day.isToday,
              'future': day.isFuture
            }"
          >
            <span class="day-num">{{ day.day }}</span>
            <span v-if="day.checked" class="check-mark">✓</span>
          </div>
        </div>
      </div>
    </van-cell>
    <van-cell>
      <div class="reward-preview">
        <div class="reward-title">连续签到奖励</div>
        <div class="reward-list">
          <span v-for="(reward, index) in rewards" :key="index" class="reward-item" :class="{ 'next': nextRewardDay === index + 1 }">
            第{{ index + 1 }}天: {{ reward }}★
          </span>
        </div>
      </div>
    </van-cell>
    <van-cell v-if="!signinInfo.checkedIn">
      <van-button
        type="primary"
        block
        round
        :loading="loading"
        class="checkin-btn"
        @click="handleCheckin"
      >
        🎁 签到领 {{ signinInfo.todayBonus }} ★
      </van-button>
    </van-cell>
    <van-cell v-else>
      <div class="checked-in">
        <span class="checked-text">✅ 今日已签到</span>
        <span class="bonus-text">+{{ signinInfo.todayBonus }} ★</span>
      </div>
    </van-cell>
  </van-cell-group>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getSigninInfo, checkin } from '@/api/signin'
import { showToast } from 'vant'

const userStore = useUserStore()
const loading = ref(false)
const calendarWrapper = ref(null)
const calendarRef = ref(null)
const signinInfo = ref({
  checkedIn: false,
  streakDays: 0,
  todayBonus: 1,
  monthDays: []
})

const rewards = [1, 1, 2, 2, 2, 3, 5]
const nextRewardDay = computed(() => (signinInfo.value.streakDays % 7) + 1)

const calendarDays = computed(() => {
  // 使用北京时间
  const now = new Date()
  const today = new Date(now.toLocaleString('en-CA', { timeZone: 'Asia/Shanghai' }).replace(/(\d{4})-(\d{2})-(\d{2})/, '$1-$2-$3T00:00:00+08:00'))
  const year = today.getFullYear()
  const month = today.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayDate = today.getDate()
  
  const days = []
  
  // 以今日为中心，显示前后各几天
  const startDay = Math.max(1, todayDate - 2)
  const endDay = Math.min(daysInMonth, todayDate + 4)
  
  const todayStr = today.toISOString().split('T')[0]
  const checkedSet = new Set(signinInfo.value.monthDays.map(d => {
    const date = new Date(year, month, d)
    return date.toISOString().split('T')[0]
  }))
  
  for (let d = startDay; d <= endDay; d++) {
    const date = new Date(year, month, d)
    const dateStr = date.toISOString().split('T')[0]
    const isToday = d === todayDate
    
    days.push({
      date: dateStr,
      day: d,
      checked: checkedSet.has(dateStr),
      isToday,
      isFuture: d > todayDate
    })
  }
  
  return days
})

const loadInfo = async () => {
  if (!userStore.userInfo?.id) return
  try {
    const data = await getSigninInfo(userStore.userInfo.id)
    signinInfo.value = data
    // 日历加载后滚动到今日
    await nextTick()
    scrollToToday()
  } catch (e) {
    console.error('加载签到信息失败', e)
  }
}

const scrollToToday = () => {
  if (!calendarWrapper.value) return
  const todayEl = calendarRef.value?.querySelector('.today')
  if (todayEl) {
    const wrapperWidth = calendarWrapper.value.offsetWidth
    const todayLeft = todayEl.offsetLeft
    calendarWrapper.value.scrollTo({
      left: todayLeft - wrapperWidth / 2 + todayEl.offsetWidth / 2,
      behavior: 'smooth'
    })
  }
}

const handleCheckin = async () => {
  if (!userStore.userInfo?.id) return
  loading.value = true
  try {
    const result = await checkin(userStore.userInfo.id)
    if (result.alreadySignedIn) {
      showToast('今日已签到，明天再来吧~')
      signinInfo.value.checkedIn = true
    } else {
      signinInfo.value.checkedIn = true
      signinInfo.value.streakDays = result.streakDays
      signinInfo.value.todayBonus = result.bonusStars
      userStore.userInfo.stars = (userStore.userInfo.stars || 0) + result.bonusStars
      showToast({
        message: `🎉 签到成功！+${result.bonusStars}★`,
        duration: 2000
      })
    }
    await loadInfo()
  } catch (e) {
    showToast(e.message || '签到失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadInfo()
})
</script>

<style scoped>
.signin-group {
  margin-top: 12px;
}

.signin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.signin-title {
  font-size: 15px;
  font-weight: bold;
  color: #333;
}

.streak-info {
  font-size: 13px;
  color: #FF6B6B;
  font-weight: bold;
}

.calendar-wrapper {
  overflow-x: auto;
  padding: 8px 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.calendar-wrapper::-webkit-scrollbar {
  display: none;
}

.calendar {
  display: flex;
  gap: 8px;
  min-width: max-content;
  padding: 0 4px;
}

.calendar-day {
  width: 40px;
  height: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--theme-bg);
  box-shadow: 3px 3px 6px rgba(0, 0, 0, 0.1), inset -2px -2px 4px rgba(255, 255, 255, 0.8);
  font-size: 13px;
  color: #999;
  position: relative;
  flex-shrink: 0;
}

.calendar-day.today {
  background: #FFE4E1;
  color: #FF69B4;
  font-weight: bold;
  border: 2px solid #FF69B4;
}

.calendar-day.checked {
  background: linear-gradient(135deg, #FF69B4 0%, #FF85A2 100%);
  color: #fff;
}

.calendar-day.future {
  opacity: 0.4;
}

.check-mark {
  font-size: 10px;
  margin-top: -2px;
}

.reward-preview {
  background: #FFF5F7;
  border-radius: var(--clay-radius-sm);
  padding: 12px;
}

.reward-title {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.reward-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.reward-item {
  font-size: 11px;
  padding: 4px 8px;
  background: #fff;
  border-radius: var(--clay-radius-sm);
  color: #999;
}

.reward-item.next {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #fff;
  font-weight: bold;
}

.checkin-btn {
  background: linear-gradient(135deg, #FF69B4 0%, #FF85A2 100%) !important;
  border: none !important;
  font-weight: bold;
}

.checked-in {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.checked-text {
  color: #07c160;
  font-weight: bold;
}

.bonus-text {
  color: #FFD700;
  font-weight: bold;
  font-size: 16px;
}
</style>
