<template>
  <div class="dashboard">
    <!-- 目标血条（仅孩子且有目标时显示） -->
    <van-cell-group inset class="target-card" v-if="userStore.isChild && userStore.targetReward">
      <van-cell>
        <template #title>
          <div class="target-title">
            <span>目标：{{ userStore.targetReward.name }}</span>
            <van-button size="small" plain @click="handleClearTarget">取消</van-button>
          </div>
        </template>
        <template #label>
          <div class="progress-bar">
            <van-progress :percentage="progressPercentage" :color="progressColor" />
            <div class="progress-text">{{ userStore.userInfo?.stars || 0 }} / {{ userStore.targetReward.cost }} ★</div>
          </div>
        </template>
      </van-cell>
    </van-cell-group>

    <van-cell-group inset title="今日任务">
      <TaskCard
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        @complete="handleComplete"
        @skip="handleSkip"
      />
      <van-empty v-if="!loading && tasks.length === 0" description="今日无任务，休息一下吧！" />
    </van-cell-group>

    <van-grid :column-num="4" class="shortcuts">
      <van-grid-item icon="orders-o" text="任务" to="/task" />
      <van-grid-item icon="gift-o" text="奖励" to="/reward" />
      <van-grid-item v-if="userStore.isAdmin" icon="records-o" text="审批" to="/exchange" />
      <van-grid-item icon="friends-o" text="家庭" to="/family" />
    </van-grid>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getTasks, completeTask, skipTask } from '@/api/task'
import TaskCard from '@/components/TaskCard.vue'
import { showToast } from 'vant'

const userStore = useUserStore()
const tasks = ref([])
const loading = ref(false)

const progressPercentage = computed(() => {
  if (!userStore.targetReward) return 0
  const percent = ((userStore.userInfo?.stars || 0) / userStore.targetReward.cost) * 100
  return Math.min(Math.round(percent), 100)
})

const progressColor = computed(() => {
  const p = progressPercentage.value
  if (p < 30) return '#f56c6c'
  if (p < 70) return '#ff976a'
  return '#07c160'
})

const handleClearTarget = () => {
  userStore.clearTargetReward()
  showToast('已取消目标')
}

const loadTasks = async () => {
  loading.value = true
  try {
    const data = await getTasks()
    // 根据角色筛选任务
    if (userStore.isAdmin) {
      tasks.value = data.daily || []
    } else {
      // 孩子只显示今日任务
      tasks.value = (data.daily || []).filter(t => !t.action)
    }
  } catch (error) {
    showToast('加载任务失败')
  } finally {
    loading.value = false
  }
}

const handleComplete = async (id) => {
  try {
    await completeTask(id)
    showToast('已完成申请，请等待家长审批')
    await loadTasks()
  } catch (error) {
    showToast(error.message || '操作失败')
  }
}

const handleSkip = async (id) => {
  try {
    await skipTask(id)
    showToast('已跳过')
    await loadTasks()
  } catch (error) {
    showToast(error.message || '操作失败')
  }
}

onMounted(async () => {
  if (!userStore.userInfo) {
    await userStore.getUserInfoAction()
  }
  await loadTasks()
})
</script>

<style scoped>
.dashboard {
  padding-bottom: 20px;
}
.target-card {
  margin-bottom: 12px;
}
.target-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.progress-bar {
  margin-top: 8px;
}
.progress-text {
  font-size: 12px;
  color: #666;
  text-align: center;
  margin-top: 4px;
}
.shortcuts {
  margin-top: 20px;
  background: #fff;
  border-radius: 12px;
  margin: 12px 16px;
}
</style>
