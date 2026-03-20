import { defineStore } from 'pinia'
import { getTaskList, createTask, completeTask } from '@/api/task'

export const useTaskStore = defineStore('task', {
  state: () => ({
    taskList: [],
    total: 0
  }),
  actions: {
    async getTaskListAction(params) {
      const res = await getTaskList(params)
      this.taskList = res
      return res
    },
    async createTaskAction(data) {
      const res = await createTask(data)
      await this.getTaskListAction()
      return res
    },
    async completeTaskAction(id) {
      const res = await completeTask(id)
      await this.getTaskListAction()
      return res
    }
  },
  persist: false
})
