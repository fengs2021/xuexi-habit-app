<template>
  <div class="reward-page">
    
    <van-button v-if="userStore.isAdmin" type="primary" block class="add-btn" @click="showCreate = true">
      创建新奖励
    </van-button>

    <!-- 家长视图 -->
    <van-tabs v-if="userStore.isAdmin" v-model:active="activeTab">
      <van-tab title="奖励列表">
        <RewardCard
          v-for="reward in rewards"
          :key="reward.id"
          :reward="reward"
          :show-exchange="false"
          @setTarget="handleSetTarget"
          @clearTarget="handleClearTarget"
        />
        <van-empty v-if="rewards.length === 0" description="暂无奖励" />
      </van-tab>
      <van-tab title="兑换历史">
        <van-cell-group inset>
          <van-cell v-for="item in exchangeHistory" :key="item.id">
            <template #title>
              <div class="exchange-item">
                <span class="name">{{ item.user_nickname }}</span>
                <span class="action">兑换</span>
                <span class="target">{{ item.reward_title }}</span>
              </div>
            </template>
            <template #label>
              <van-tag :type="item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'">
                {{ item.status === 'approved' ? '已批准' : item.status === 'rejected' ? '已拒绝' : '待审批' }}
              </van-tag>
              <span class="reward">-{{ item.stars_spent || item.star_cost }} ★</span>
              <span class="time">{{ formatDateTime(item.created_at) }}</span>
            </template>
          </van-cell>
          <van-empty v-if="exchangeHistory.length === 0" description="暂无兑换记录" />
        </van-cell-group>
      </van-tab>
    </van-tabs>

    <!-- 孩子视图 -->
    <div v-else>
      <RewardCard
        v-for="reward in rewards"
        :key="reward.id"
        :reward="reward"
        @exchange="handleExchange"
        @setTarget="handleSetTarget"
        @clearTarget="handleClearTarget"
      />
      <van-empty v-if="rewards.length === 0" description="暂无奖励" />
    </div>

    <van-dialog v-model:show="showCreate" title="创建奖励" show-cancel-button @confirm="createReward">
      <van-form>
        <van-cell-group inset>
          <van-field v-model="newReward.title" label="奖励名称" placeholder="例如：去游乐场" />
          <van-field v-model.number="newReward.starCost" label="所需星星" type="number" placeholder="输入所需星星" />
        </van-cell-group>
      </van-form>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getRewards, createReward as createRewardApi, createExchange, getStudentExchanges } from '@/api/reward'
import RewardCard from '@/components/RewardCard.vue'

import { showToast } from 'vant'

const userStore = useUserStore()
const rewards = ref([])
const exchangeHistory = ref([])
const showCreate = ref(false)
const activeTab = ref(0)
const newReward = ref({ title: '', starCost: 30 })

const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const formatDateTime = (time) => {
  if (!time) return ''
  const d = new Date(time)
  return 
}

const loadRewards = async () => {
  try {
    const data = await getRewards()
    rewards.value = data || []
  } catch (error) {
    showToast('加载失败')
  }
}

const loadExchangeHistory = async () => {
  try {
    const data = await getStudentExchanges()
    exchangeHistory.value = data || []
  } catch (error) {
    showToast('加载失败')
  }
}

const createReward = async () => {
  try {
    await createRewardApi(newReward.value)
    showToast('创建成功')
    showCreate.value = false
    newReward.value = { title: '', starCost: 30 }
    await loadRewards()
  } catch (error) {
    showToast('创建失败')
  }
}

const handleExchange = async (id) => {
  const reward = rewards.value.find(r => r.id === id)
  if (!reward) return
  
  const cost = reward.starCost || reward.star_cost
  const currentStars = userStore.userInfo?.stars || 0
  
  if (currentStars < cost) {
    showToast('分数不够，继续努力')
    return
  }
  
  try {
    await createExchange({ rewardId: id })
    showToast('已提交家长审批')
    await loadRewards()
  } catch (error) {
    showToast('兑换失败')
  }
}

const handleSetTarget = (reward) => {
  userStore.setTargetReward({ id: reward.id, name: reward.title, cost: reward.starCost || reward.star_cost || reward.stars })
  showToast()
}

const handleClearTarget = () => {
  userStore.clearTargetReward()
  showToast('已取消目标')
}

onMounted(() => {
  loadRewards()
  if (userStore.isAdmin) {
    loadExchangeHistory()
  }
})
</script>

<style scoped>
.reward-page {
  padding-bottom: 20px;
}
.add-btn {
  margin-bottom: 12px;
}
.exchange-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
.exchange-item .name {
  font-weight: bold;
}
.exchange-item .action {
  color: #666;
}
.exchange-item .target {
  color: #1989fa;
}
.exchange-item .reward {
  color: #ff976a;
  font-weight: bold;
  margin-left: 8px;
}
.exchange-item .time {
  color: #999;
  font-size: 12px;
  margin-left: 8px;
}
</style>
