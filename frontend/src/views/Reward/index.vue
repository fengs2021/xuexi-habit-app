<template>
  <div class="reward-page">
    <van-button v-if="userStore.isAdmin" type="primary" block class="add-btn" @click="showCreate = true">
      创建新奖励
    </van-button>

    <RewardCard
      v-for="reward in rewards"
      :key="reward.id"
      :reward="reward"
      @exchange="handleExchange"
    />
    <EmptyState v-if="rewards.length === 0" description="暂无奖励" />

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
import { getRewards, createReward as createRewardApi, createExchange } from '@/api/reward'
import RewardCard from '@/components/RewardCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import { showToast } from 'vant'

const userStore = useUserStore()
const rewards = ref([])
const showCreate = ref(false)
const newReward = ref({ title: '', starCost: 30 })

const loadRewards = async () => {
  try {
    const data = await getRewards()
    rewards.value = data || []
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
  try {
    await createExchange({ rewardId: id })
    showToast('兑换成功，等待审批')
    await loadRewards()
  } catch (error) {
    showToast('兑换失败')
  }
}

onMounted(() => {
  loadRewards()
})
</script>

<style scoped>
.reward-page {
  padding-bottom: 20px;
}
.add-btn {
  margin-bottom: 12px;
}
</style>
