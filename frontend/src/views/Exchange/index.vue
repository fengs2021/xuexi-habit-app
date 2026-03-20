<template>
  <div class="exchange-page">
    <van-cell-group inset title="待审批兑换">
      <van-cell v-for="req in requests" :key="req.id">
        <template #title>
          <span>{{ req.child_nickname || req.childNickname }} 申请兑换 {{ req.reward_title || req.rewardTitle }}</span>
        </template>
        <template #label>
          <span>消耗：{{ req.stars_spent || req.starsSpent }} ★</span>
        </template>
        <template #right-icon>
          <van-button size="small" type="success" @click="approve(req.id, true)">同意</van-button>
          <van-button size="small" type="danger" @click="approve(req.id, false)">拒绝</van-button>
        </template>
      </van-cell>
    </van-cell-group>
    <EmptyState v-if="requests.length === 0" description="暂无待审批申请" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getPendingExchanges, approveExchange as approveApi } from '@/api/exchange'
import EmptyState from '@/components/EmptyState.vue'
import { showToast } from 'vant'

const requests = ref([])

const loadRequests = async () => {
  try {
    const data = await getPendingExchanges()
    requests.value = data || []
  } catch (error) {
    showToast('加载失败')
  }
}

const approve = async (id, approved) => {
  try {
    await approveApi(id, { comment: approved ? '批准' : '拒绝' })
    showToast(approved ? '已同意' : '已拒绝')
    await loadRequests()
  } catch (error) {
    showToast('操作失败')
  }
}

onMounted(() => {
  loadRequests()
})
</script>

<style scoped>
.exchange-page {
  padding-bottom: 20px;
}
</style>
