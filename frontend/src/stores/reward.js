import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as rewardApi from '../api/reward'
import * as exchangeApi from '../api/exchange'

export const useRewardStore = defineStore('reward', () => {
  const rewards = ref([])
  const exchanges = ref([])
  const loading = ref(false)

  // 获取奖励列表
  async function fetchRewards() {
    loading.value = true
    try {
      const res = await rewardApi.getRewards()
      rewards.value = res.data
      return res.data
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 创建奖励
  async function createReward(data) {
    try {
      const res = await rewardApi.createReward(data)
      rewards.value.unshift(res.data)
      return res.data
    } catch (error) {
      throw error
    }
  }

  // 更新奖励
  async function updateReward(id, data) {
    try {
      const res = await rewardApi.updateReward(id, data)
      const index = rewards.value.findIndex(r => r.id === id)
      if (index !== -1) {
        rewards.value[index] = { ...rewards.value[index], ...res.data }
      }
      return res.data
    } catch (error) {
      throw error
    }
  }

  // 删除奖励
  async function deleteReward(id) {
    try {
      await rewardApi.deleteReward(id)
      rewards.value = rewards.value.filter(r => r.id !== id)
    } catch (error) {
      throw error
    }
  }

  // 获取兑换记录
  async function fetchExchanges() {
    try {
      const res = await exchangeApi.getExchanges()
      exchanges.value = res.data
      return res.data
    } catch (error) {
      throw error
    }
  }

  // 发起兑换
  async function createExchange(data) {
    try {
      const res = await exchangeApi.createExchange(data)
      exchanges.value.unshift(res.data)
      return res.data
    } catch (error) {
      throw error
    }
  }

  return {
    rewards,
    exchanges,
    loading,
    fetchRewards,
    createReward,
    updateReward,
    deleteReward,
    fetchExchanges,
    createExchange
  }
})
