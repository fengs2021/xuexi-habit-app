<template>
  <div class="manage-page">
    <UserHeader :user-info="currentChild" />

    <GoalBanner
      :current-stars="currentChild?.stars || 0"
      :target-stars="currentGoal?.starTarget || 0"
    />

    <!-- Tab切换 -->
    <van-tabs v-model:active="activeTab" sticky offset-top="50">
      <van-tab title="挑战任务" name="challenge">
        <div class="task-grid">
          <TaskCard
            :task="{ title: '新增', isNew: true }"
            @click="showAddTask = true"
          />
          <TaskCard
            v-for="task in tasks"
            :key="task.id"
            :task="task"
            @click="onTaskClick(task)"
          />
        </div>
      </van-tab>
      <van-tab title="奖励兑换" name="reward">
        <div class="task-grid">
          <RewardCard
            v-for="reward in rewards"
            :key="reward.id"
            :reward="reward"
            :user-stars="currentChild?.stars || 0"
            :show-button="false"
          />
        </div>
      </van-tab>
    </van-tabs>

    <!-- 新增/编辑任务弹窗 -->
    <van-popup v-model:show="showAddTask" position="bottom" round style="height: 60%">
      <div class="popup-content">
        <div class="popup-header">
          <span>{{ editingTask ? '编辑任务' : '新增任务' }}</span>
          <van-icon name="close" @click="closePopup" />
        </div>
        <van-form @submit="handleSaveTask">
          <van-field
            v-model="taskForm.title"
            label="任务名称"
            placeholder="请输入任务名称"
            :rules="[{ required: true, message: '请输入任务名称' }]"
          />
          <van-field name="starReward" label="奖励星星">
            <template #input>
              <van-stepper v-model="taskForm.starReward" min="1" max="10" />
            </template>
          </van-field>
          <van-field name="rarity" label="稀有度">
            <template #input>
              <van-radio-group v-model="taskForm.rarity" direction="horizontal">
                <van-radio name="N">N</van-radio>
                <van-radio name="R">R</van-radio>
                <van-radio name="SR">SR</van-radio>
                <van-radio name="SSR">SSR</van-radio>
              </van-radio-group>
            </template>
          </van-field>
          <div style="padding: 16px">
            <van-button type="primary" block round native-type="submit">
              保存
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>

    <!-- 任务操作 -->
    <van-action-sheet
      v-model:show="showTaskAction"
      :actions="taskActions"
      @select="onTaskAction"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { showToast, showSuccessToast } from 'vant'
import UserHeader from '../components/UserHeader.vue'
import GoalBanner from '../components/GoalBanner.vue'
import TaskCard from '../components/TaskCard.vue'
import RewardCard from '../components/RewardCard.vue'
import { useUserStore } from '../stores/user'
import { useTaskStore } from '../stores/task'
import { useGoalStore } from '../stores/goal'
import { useRewardStore } from '../stores/reward'

const userStore = useUserStore()
const taskStore = useTaskStore()
const goalStore = useGoalStore()
const rewardStore = useRewardStore()

const activeTab = ref('challenge')
const showAddTask = ref(false)
const showTaskAction = ref(false)
const editingTask = ref(null)
const currentTask = ref(null)

const taskForm = ref({
  title: '',
  starReward: 2,
  rarity: 'SR'
})

const currentChild = computed(() => userStore.currentChild)
const tasks = computed(() => taskStore.tasks)
const rewards = computed(() => rewardStore.rewards)
const currentGoal = computed(() => goalStore.goals[0])

const taskActions = computed(() => [
  { name: '编辑', action: 'edit' },
  { name: '删除', action: 'delete', color: '#ee0a24' }
])

onMounted(async () => {
  await Promise.all([
    userStore.fetchFamily(),
    taskStore.fetchTasks(),
    goalStore.fetchGoals(),
    rewardStore.fetchRewards()
  ])
})

function onTaskClick(task) {
  currentTask.value = task
  showTaskAction.value = true
}

function closePopup() {
  showAddTask.value = false
  editingTask.value = null
  taskForm.value = { title: '', starReward: 2, rarity: 'SR' }
}

async function onTaskAction(action) {
  showTaskAction.value = false
  if (!currentTask.value) return

  if (action.action === 'edit') {
    editingTask.value = currentTask.value
    taskForm.value = {
      title: currentTask.value.title,
      starReward: currentTask.value.starReward,
      rarity: currentTask.value.rarity
    }
    showAddTask.value = true
  } else if (action.action === 'delete') {
    try {
      await taskStore.deleteTask(currentTask.value.id)
      showSuccessToast('已删除')
    } catch (error) {
      showToast('删除失败')
    }
  }
}

async function handleSaveTask() {
  try {
    if (editingTask.value) {
      await taskStore.updateTask(editingTask.value.id, taskForm.value)
      showSuccessToast('更新成功')
    } else {
      await taskStore.createTask(taskForm.value)
      showSuccessToast('创建成功')
    }
    closePopup()
  } catch (error) {
    showToast('保存失败')
  }
}
</script>

<style scoped>
.manage-page {
  min-height: 100vh;
  background: #fff0f3;
  padding: 12px;
  padding-bottom: 80px;
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 16px 0;
}

.popup-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #eee;
}
</style>
