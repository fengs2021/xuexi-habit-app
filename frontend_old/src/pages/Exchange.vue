<template>
  <div class="exchange-page">
    <UserHeader :user-info="currentChild" />

    <!-- 愿望值统计 -->
    <div class="wish-stats">
      <div class="wish-left">
        <div class="wish-label">我的愿望值</div>
        <div class="wish-value">{{ currentChild?.wishPoints || 0 }}</div>
      </div>
      <van-divider vertical style="height: 40px" />
      <div class="wish-right">
        <van-icon name="gift" color="#ff6b9d" size="24px" />
        <span>随机挑战</span>
      </div>
    </div>

    <!-- 奖励列表 -->
    <div class="reward-grid">
      <RewardCard
        v-for="reward in rewards"
        :key="reward.id"
        :reward="reward"
        :user-stars="currentChild?.stars || 0"
        @exchange="onExchange"
      />
    </div>

    <van-empty v-if="rewards.length === 0" description="暂无奖励" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { showSuccessToast } from 'vant'
import UserHeader from '../components/UserHeader.vue'
import RewardCard from '../components/RewardCard.vue'
import { useUserStore } from '../stores/user'
import { useRewardStore } from '../stores/reward'

const userStore = useUserStore()
const rewardStore = useRewardStore()

const currentChild = computed(() => userStore.currentChild)
const rewards = computed(() => rewardStore.rewards)

onMounted(async () => {
  await Promise.all([
    userStore.fetchFamily(),
    rewardStore.fetchRewards()
  ])
})

async function onExchange(reward) {
  try {
    await rewardStore.createExchange({ rewardId: reward.id })
    showSuccessToast('兑换成功')
    await userStore.fetchFamily()
  } catch (error) {
    showSuccessToast(error.message || '兑换失败')
  }
}
</script>

<style scoped>
.exchange-page {
  min-height: 100vh;
  background: #fff0f3;
  padding: 12px;
  padding-bottom: 80px;
}

.wish-stats {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #ff6b9d 0%, #ff9a6c 100%);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 16px;
  color: #fff;
}

.wish-left {
  flex: 1;
}

.wish-label {
  font-size: 12px;
  opacity: 0.9;
}

.wish-value {
  font-size: 32px;
  font-weight: 700;
}

.wish-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.wish-right span {
  font-size: 12px;
}

.reward-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
</style>
