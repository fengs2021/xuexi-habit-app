<template>
  <div class="achievement-page">
    <UserHeader :user-info="currentChild" />

    <!-- 成就统计 -->
    <div class="stats-card">
      <div class="stats-title">
        <van-icon name="chart-trending-o" />
        <span>成就统计</span>
      </div>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">{{ stats.goalsAchieved || 0 }}</div>
          <div class="stat-label">达成目标</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ stats.totalStars || 0 }}</div>
          <div class="stat-label">累计获得</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ stats.tasksCompleted || 0 }}</div>
          <div class="stat-label">完成任务</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">Lv.{{ currentChild?.level || 1 }}</div>
          <div class="stat-label">当前等级</div>
        </div>
      </div>
    </div>

    <!-- 荣誉殿堂 -->
    <div class="hall-card">
      <div class="hall-title">
        <van-icon name="award" color="#fbbf24" />
        <span>荣誉殿堂</span>
      </div>
      <div class="hall-content">
        <div class="trophy-icon">🏆</div>
        <div class="trophy-text">累计 {{ stats.goalsAchieved || 0 }} 个目标</div>
        <div class="trophy-hint">完成目标即可获得奖杯，加油！</div>
      </div>
    </div>

    <!-- 排行榜 -->
    <div class="rank-card">
      <van-tabs v-model:active="rankTab">
        <van-tab title="愿望榜" name="wish">
          <div class="rank-list">
            <div
              v-for="(member, index) in leaderboard"
              :key="member.id"
              class="rank-item"
              :class="{ 'is-me': member.isMe }"
            >
              <div class="rank-badge">
                <span v-if="index === 0">🥇</span>
                <span v-else-if="index === 1">🥈</span>
                <span v-else>{{ index + 1 }}</span>
              </div>
              <van-image round width="32" height="32" :src="member.avatar" />
              <div class="rank-info">
                <div class="rank-name">
                  {{ member.nickname }}
                  <van-tag v-if="member.isMe" type="primary" size="small">我</van-tag>
                </div>
              </div>
              <div class="rank-value">{{ member.wishPoints || 0 }} 愿望值</div>
            </div>
          </div>
        </van-tab>
        <van-tab title="等级榜" name="level">
          <div class="rank-list">
            <div
              v-for="(member, index) in leaderboard"
              :key="member.id"
              class="rank-item"
            >
              <div class="rank-badge">{{ index + 1 }}</div>
              <van-image round width="32" height="32" :src="member.avatar" />
              <div class="rank-info">
                <div class="rank-name">{{ member.nickname }}</div>
              </div>
              <div class="rank-value">Lv.{{ member.level || 1 }}</div>
            </div>
          </div>
        </van-tab>
        <van-tab title="勤奋榜" name="streak">
          <div class="rank-list">
            <div
              v-for="(member, index) in leaderboard"
              :key="member.id"
              class="rank-item"
            >
              <div class="rank-badge">{{ index + 1 }}</div>
              <van-image round width="32" height="32" :src="member.avatar" />
              <div class="rank-info">
                <div class="rank-name">{{ member.nickname }}</div>
              </div>
              <div class="rank-value">{{ member.streak || 0 }} 天</div>
            </div>
          </div>
        </van-tab>
      </van-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAchievements, getAchievementStats } from '../api/achievement'
import { getLeaderboard } from '../api/user'
import UserHeader from '../components/UserHeader.vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const rankTab = ref('wish')
const stats = ref({})
const leaderboard = ref([])

const currentChild = computed(() => userStore.currentChild)

onMounted(async () => {
  await userStore.fetchFamily()
  try {
    const [statsRes, rankRes] = await Promise.all([
      getAchievementStats(),
      getLeaderboard('wish')
    ])
    stats.value = statsRes.data.stats || {}
    leaderboard.value = (rankRes.data || []).map(m => ({
      ...m,
      isMe: m.id === currentChild.value?.id
    }))
  } catch (error) {
    console.error(error)
  }
})
</script>

<style scoped>
.achievement-page {
  min-height: 100vh;
  background: #fff0f3;
  padding: 12px;
  padding-bottom: 80px;
}

.stats-card,
.hall-card,
.rank-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.stats-title,
.hall-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #ff6b9d;
}

.stat-label {
  font-size: 11px;
  color: #666;
  margin-top: 4px;
}

.hall-content {
  text-align: center;
  padding: 20px 0;
}

.trophy-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.trophy-text {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.trophy-hint {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.rank-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.rank-item.is-me {
  background: rgba(255, 107, 157, 0.1);
  border-radius: 8px;
  padding: 8px 12px;
  margin: 0 -12px;
}

.rank-badge {
  width: 24px;
  text-align: center;
  font-weight: 600;
  color: #666;
}

.rank-info {
  flex: 1;
}

.rank-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
}

.rank-value {
  font-size: 12px;
  color: #666;
}
</style>
