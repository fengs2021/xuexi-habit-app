import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as goalApi from '../api/goal'

export const useGoalStore = defineStore('goal', () => {
  const goals = ref([])
  const loading = ref(false)

  // 获取目标列表
  async function fetchGoals(params) {
    loading.value = true
    try {
      const res = await goalApi.getGoals(params)
      goals.value = res.data
      return res.data
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 创建目标
  async function createGoal(data) {
    try {
      const res = await goalApi.createGoal(data)
      goals.value.unshift(res.data)
      return res.data
    } catch (error) {
      throw error
    }
  }

  // 更新目标
  async function updateGoal(id, data) {
    try {
      const res = await goalApi.updateGoal(id, data)
      const index = goals.value.findIndex(g => g.id === id)
      if (index !== -1) {
        goals.value[index] = { ...goals.value[index], ...res.data }
      }
      return res.data
    } catch (error) {
      throw error
    }
  }

  // 删除目标
  async function deleteGoal(id) {
    try {
      await goalApi.deleteGoal(id)
      goals.value = goals.value.filter(g => g.id !== id)
    } catch (error) {
      throw error
    }
  }

  return {
    goals,
    loading,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal
  }
})
