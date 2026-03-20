<template>
  <div class="task-page">
    <van-button v-if="userStore.isAdmin" type="primary" block class="add-btn" @click="showCreate = true">
      创建新任务
    </van-button>

    <van-tabs v-model:active="activeTab">
      <van-tab title="进行中">
        <TaskCard
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          @complete="handleComplete"
          @skip="handleSkip"
        />
        <EmptyState v-if="tasks.length === 0" />
      </van-tab>
      <van-tab title="已完成" v-if="userStore.isAdmin">
        <TaskCard
          v-for="task in completedTasks"
          :key="task.id"
          :task="task"
          disabled
        />
        <EmptyState v-if="completedTasks.length === 0" description="暂无已完成任务" />
      </van-tab>
    </van-tabs>

    <van-dialog v-model:show="showCreate" title="创建任务" show-cancel-button @confirm="createTask">
      <van-form>
        <van-cell-group inset>
          <van-field v-model="newTask.title" label="任务名称" placeholder="例如：收拾房间" />
          <van-field v-model.number="newTask.starReward" label="星星奖励" type="number" placeholder="输入奖励星星数" />
        </van-cell-group>
      </van-form>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getTasks, createTask as createTaskApi, completeTask, skipTask } from '@/api/task'
import TaskCard from '@/components/TaskCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import { showToast } from 'vant'

const userStore = useUserStore()
const activeTab = ref(0)
const tasks = ref([])
const completedTasks = ref([])
const showCreate = ref(false)
const newTask = ref({ title: '', starReward: 2 })

const loadTasks = async () => {
  try {
    const data = await getTasks()
    tasks.value = data || []
  } catch (error) {
    showToast('加载失败')
  }
}

const createTask = async () => {
  try {
    await createTaskApi(newTask.value)
    showToast('创建成功')
    showCreate.value = false
    newTask.value = { title: '', starReward: 2 }
    await loadTasks()
  } catch (error) {
    showToast('创建失败')
  }
}

const handleComplete = async (id) => {
  try {
    await completeTask(id)
    showToast('任务完成！')
    await loadTasks()
    await userStore.getUserInfoAction()
  } catch (error) {
    showToast('操作失败')
  }
}

const handleSkip = async (id) => {
  try {
    await skipTask(id)
    showToast('已跳过')
    await loadTasks()
  } catch (error) {
    showToast('操作失败')
  }
}

onMounted(() => {
  loadTasks()
})
</script>

<style scoped>
.task-page {
  padding-bottom: 20px;
}
.add-btn {
  margin-bottom: 12px;
}
</style>
