import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as taskApi from '../api/task'

export const useTaskStore = defineStore('task', () => {
  const tasks = ref([])
  const loading = ref(false)

  // 获取任务列表
  async function fetchTasks(params) {
    loading.value = true
    try {
      const res = await taskApi.getTasks(params)
      tasks.value = res.data
      return res.data
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 创建任务
  async function createTask(data) {
    try {
      const res = await taskApi.createTask(data)
      tasks.value.unshift(res.data)
      return res.data
    } catch (error) {
      throw error
    }
  }

  // 更新任务
  async function updateTask(id, data) {
    try {
      const res = await taskApi.updateTask(id, data)
      const index = tasks.value.findIndex(t => t.id === id)
      if (index !== -1) {
        tasks.value[index] = { ...tasks.value[index], ...res.data }
      }
      return res.data
    } catch (error) {
      throw error
    }
  }

  // 删除任务
  async function deleteTask(id) {
    try {
      await taskApi.deleteTask(id)
      tasks.value = tasks.value.filter(t => t.id !== id)
    } catch (error) {
      throw error
    }
  }

  // 完成任务
  async function completeTask(id) {
    try {
      const res = await taskApi.completeTask(id)
      return res.data
    } catch (error) {
      throw error
    }
  }

  // 跳过任务
  async function skipTask(id) {
    try {
      await taskApi.skipTask(id)
    } catch (error) {
      throw error
    }
  }

  return {
    tasks,
    loading,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    skipTask
  }
})
