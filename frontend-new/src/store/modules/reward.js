import { defineStore } from 'pinia'
import { getRewardList, createReward, createExchange, getPendingExchanges, approveExchange } from '@/api/reward'

export const useRewardStore = defineStore('reward', {
  state: () => ({
    rewardList: [],
    pendingList: []
  }),
  actions: {
    async getRewardListAction() {
      const res = await getRewardList()
      this.rewardList = res
      return res
    },
    async createRewardAction(data) {
      const res = await createReward(data)
      await this.getRewardListAction()
      return res
    },
    async createExchangeAction(data) {
      return await createExchange(data)
    },
    async getPendingExchangesAction() {
      const res = await getPendingExchanges()
      this.pendingList = res
      return res
    },
    async approveExchangeAction(id, data) {
      const res = await approveExchange(id, data)
      await this.getPendingExchangesAction()
      return res
    }
  },
  persist: false
})
