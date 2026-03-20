<template>
  <div class="home-page">
    <!-- 用户头部 -->
    <UserHeader :user-info="currentChild" />

    <!-- 目标横幅 -->
    <GoalBanner
      :current-stars="currentChild?.stars || 0"
      :target-stars="currentGoal?.starTarget || 0"
      @click="showGoalDetail = true"
    />

    <!-- Tab切换 -->
    <van-tabs v-model:active="activeTab" sticky offset-top="50">
      <van-tab title="挑战任务" name="challenge">
        <div class="task-grid">
          <!-- 新增卡片 -->
          <TaskCard
            :task="{ title: '新增', isNew: true }"
            @click="showAddTask = true"
          />
          <!-- 任务列表 -->
          <TaskCard
            v-for="task in tasks"
            :key="task.id"
            :task="task"
            :show-actions="true"
            @complete="onTaskComplete(task)"
            @skip="onTaskSkip(task)"
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
          />
        </div>
      </van-tab>
    </van-tabs>

    <!-- 新增任务弹窗 -->
    <van-popup
      v-model:show="showAddTask"
      position="bottom"
      round
      style="height: 60%"
    >
      <div class="popup-content">
        <div class="popup-header">
          <span>新增任务</span>
          <van-icon name="close" @click="showAddTask = false" />
        </div>
        <van-form @submit="handleAddTask">
          <van-field
            v-model="newTask.title"
            label="任务名称"
            placeholder="请输入任务名称"
            :rules="[{ required: true, message: '请输入任务名称' }]"
          />
          <van-field name="starReward" label="奖励星星">
            <template #input>
              <van-stepper v-model="newTask.starReward" min="1" max="10" />
            </template>
          </van-field>
          <van-field name="rarity" label="稀有度">
            <template #input>
              <van-radio-group v-model="newTask.rarity" direction="horizontal">
                <van-radio name="N">N</van-radio>
                <van-radio name="R">R</van-radio>
                <van-radio name="SR">SR</van-radio>
                <van-radio name="SSR">SSR</van-radio>
              </van-radio-group>
            </template>
          </van-field>
          <van-field name="frequency" label="频率">
            <template #input>
              <van-radio-group v-model="newTask.frequency" direction="horizontal">
                <van-radio name="daily">每日</van-radio>
                <van-radio name="weekly">每周</van-radio>
              </van-radio-group>
            </template>
          </van-field>
          <div style="padding: 16px">
            <van-button type="primary" block round native-type="submit">
              创建任务
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>
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
const currentTask = ref(null)

const newTask = ref({
  title: '',
  starReward: 2,
  rarity: 'SR',
  frequency: 'daily'
})

const currentChild = computed(() => userStore.currentChild)
const tasks = computed(() => taskStore.tasks)
const rewards = computed(() => rewardStore.rewards)
const currentGoal = computed(() => goalStore.goals[0])

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
}

async function onTaskComplete(task) {
  try {
    const result = await taskStore.completeTask(task.id)
    showSuccessToast('获得 ' + result.starsEarned + ' 星星')
    await userStore.fetchFamily()
  } catch (error) {
    showToast(error.message || '操作失败')
  }
}

async function onTaskSkip(task) {
  try {
    await taskStore.skipTask(task.id)
    showToast('已跳过')
  } catch (error) {
    showToast(error.message || '操作失败')
  }
}

async function handleAddTask() {
  try {
    await taskStore.createTask(newTask.value)
    showSuccessToast('创建成功')
    showAddTask.value = false
    newTask.value = { title: '', starReward: 2, rarity: 'SR', frequency: 'daily' }
  } catch (error) {
    showToast('创建失败')
  }
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #fff0f3;
  padding: 12px;
  padding-bottom: 80px;
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px 16px;
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

.home-page :deep(.van-tabs__nav) {
  background: transparent;
}

.home-page :deep(.van-tab) {
  color: #666;
}

.home-page :deep(.van-tab--active) {
  color: #ff6b9d;
}

.home-page :deep(.van-tabs__line) {
  background: #ff6b9d;
}
</style>
