<template>
  <div class="guide-page">
    <!-- 步骤指示器 -->
    <div class="step-indicator">
      <div
        v-for="i in 3"
        :key="i"
        class="dot"
        :class="{ active: step === i }"
      />
    </div>

    <!-- Step 1: 选择目标 -->
    <div v-if="step === 1" class="step-content">
      <div class="step-header">
        <div class="step-icon">🎯</div>
        <h2>给宝贝设定一个目标</h2>
        <p>选择一个想要养成的习惯</p>
      </div>

      <div class="goal-grid">
        <div
          v-for="goal in presetGoals"
          :key="goal.title"
          class="goal-item"
          :class="{ selected: selectedGoal?.title === goal.title }"
          @click="selectGoal(goal)"
        >
          <van-icon :name="goal.icon" size="28" />
          <span>{{ goal.title }}</span>
        </div>
      </div>

      <van-field
        v-model="customGoal"
        placeholder="自己输入目标..."
        class="custom-input"
      >
        <template #left-icon>
          <van-icon name="edit" />
        </template>
      </van-field>
    </div>

    <!-- Step 2: 选择奖励 -->
    <div v-if="step === 2" class="step-content">
      <div class="step-header">
        <div class="step-icon">🎁</div>
        <h2>达成后给孩子的奖励</h2>
        <p>选择完成目标后获得的奖励</p>
      </div>

      <div class="reward-grid">
        <div
          v-for="reward in presetRewards"
          :key="reward.title"
          class="reward-item"
          :class="{ selected: selectedReward?.title === reward.title }"
          @click="selectReward(reward)"
        >
          <van-icon :name="reward.icon" size="24" />
          <span>{{ reward.title }}</span>
        </div>
      </div>

      <div class="difficulty-section">
        <div class="section-title">
          <van-icon name="star" color="#ffc107" />
          <span>设定愿望值</span>
        </div>
        <p class="section-desc">孩子需要积累多少星星才能达成目标</p>
        <van-radio-group v-model="difficulty" class="difficulty-group">
          <van-radio name="10">
            <div class="difficulty-option">
              <span class="stars">⭐</span>
              <span class="value">10</span>
              <span class="label">轻松 · 3-5天</span>
            </div>
          </van-radio>
          <van-radio name="50">
            <div class="difficulty-option">
              <span class="stars">⭐⭐</span>
              <span class="value">50</span>
              <span class="label">普通 · 1-2周</span>
            </div>
          </van-radio>
          <van-radio name="100">
            <div class="difficulty-option">
              <span class="stars">⭐⭐⭐</span>
              <span class="value">100</span>
              <span class="label">挑战 · 3-4周</span>
            </div>
          </van-radio>
        </van-radio-group>
      </div>
    </div>

    <!-- Step 3: 任务教程 -->
    <div v-if="step === 3" class="step-content">
      <div class="step-header">
        <div class="step-icon">📋</div>
        <h2>完成任务赚星星</h2>
        <p>左右滑动跳过，上滑完成</p>
      </div>

      <div class="tutorial-card">
        <div class="tutorial-label">教程 1/3</div>
        <div class="task-preview">
          <div class="task-icon">🧹</div>
          <div class="task-info">
            <div class="task-stars">
              <van-icon name="star" color="#ffc107" size="14px" />
              <span>3</span>
              <van-tag type="warning" size="small">SSR</van-tag>
            </div>
            <div class="task-name">收拾房间</div>
            <div class="task-freq">每日1次</div>
          </div>
        </div>
        <div class="tutorial-hints">
          <span>← 滑动跳过</span>
          <span>上滑完成 ↑</span>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="guide-footer">
      <van-button
        v-if="step > 1"
        plain
        size="small"
        @click="step--"
      >
        上一步
      </van-button>
      <van-button
        type="primary"
        block
        :loading="loading"
        @click="handleNext"
      >
        {{ step === 3 ? '开始体验' : '下一步' }}
      </van-button>
      <van-button
        v-if="step < 3"
        plain
        size="small"
        @click="skipGuide"
      >
        跳过教程
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast } from 'vant'
import { useGoalStore } from '../stores/goal'
import { useTaskStore } from '../stores/task'

const router = useRouter()
const goalStore = useGoalStore()
const taskStore = useTaskStore()

const step = ref(1)
const loading = ref(false)
const selectedGoal = ref(null)
const selectedReward = ref(null)
const customGoal = ref('')
const difficulty = ref('10')

const presetGoals = [
  { title: '坚持阅读', icon: 'book-o' },
  { title: '坚持运动', icon: 'fire-o' },
  { title: '戒掉懒惰', icon: 'close' },
  { title: '早睡早起', icon: 'moon-o' }
]

const presetRewards = [
  { title: '去游乐场', icon: 'location-o' },
  { title: '买个玩具', icon: 'gift-o' },
  { title: '看场电影', icon: 'video-o' },
  { title: '吃顿大餐', icon: 'shop-o' },
  { title: '去公园玩', icon: 'flower-o' },
  { title: '买本好书', icon: 'book-mark-o' }
]

function selectGoal(goal) {
  selectedGoal.value = goal
  customGoal.value = ''
}

function selectReward(reward) {
  selectedReward.value = reward
}

async function handleNext() {
  if (step.value === 1 && !selectedGoal.value && !customGoal.value) {
    return
  }

  if (step.value < 3) {
    step.value++
    return
  }

  // 完成引导
  loading.value = true
  try {
    // 创建目标和任务
    const goalTitle = customGoal.value || selectedGoal.value?.title
    if (goalTitle) {
      await goalStore.createGoal({
        title: goalTitle,
        difficulty: parseInt(difficulty.value),
        starTarget: parseInt(difficulty.value)
      })
    }

    // 创建默认任务
    const defaultTasks = [
      { title: '按时起床', icon: 'clock-o', starReward: 2, rarity: 'SR', frequency: 'daily' },
      { title: '按时睡觉', icon: 'moon-o', starReward: 2, rarity: 'SR', frequency: 'daily' },
      { title: '整理书包', icon: 'bag-o', starReward: 2, rarity: 'SR', frequency: 'daily' }
    ]
    for (const task of defaultTasks) {
      await taskStore.createTask(task)
    }

    localStorage.setItem('hasGuide', 'true')
    showSuccessToast('设置成功')
    router.replace('/home')
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

function skipGuide() {
  localStorage.setItem('hasGuide', 'true')
  router.replace('/home')
}
</script>

<style scoped>
.guide-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #fff0f3 0%, #ffe4ec 100%);
  padding: 40px 24px 24px;
  display: flex;
  flex-direction: column;
}

.step-indicator {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 32px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d1d5db;
  transition: all 0.3s;
}

.dot.active {
  width: 24px;
  border-radius: 4px;
  background: #ff6b9d;
}

.step-content {
  flex: 1;
}

.step-header {
  text-align: center;
  margin-bottom: 32px;
}

.step-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.step-header h2 {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.step-header p {
  font-size: 14px;
  color: #666;
}

/* 目标选择 */
.goal-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.goal-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: #fff;
  border-radius: 16px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.goal-item.selected {
  border-color: #ff6b9d;
  background: #fff0f3;
}

.goal-item span {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.custom-input {
  background: #fff;
  border-radius: 12px;
}

/* 奖励选择 */
.reward-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.reward-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 8px;
  background: #fff;
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.reward-item.selected {
  border-color: #a855f7;
  background: rgba(168, 85, 247, 0.05);
}

.reward-item span {
  font-size: 12px;
  color: #333;
}

.difficulty-section {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.section-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
}

.difficulty-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.difficulty-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.difficulty-option .stars {
  font-size: 12px;
}

.difficulty-option .value {
  font-weight: 600;
  color: #333;
}

.difficulty-option .label {
  font-size: 12px;
  color: #666;
}

/* 教程卡片 */
.tutorial-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
}

.tutorial-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
}

.task-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
  border-radius: 12px;
  color: #fff;
  margin-bottom: 16px;
}

.task-icon {
  font-size: 40px;
}

.task-stars {
  display: flex;
  align-items: center;
  gap: 4px;
}

.task-name {
  font-size: 18px;
  font-weight: 700;
}

.task-freq {
  font-size: 12px;
  opacity: 0.8;
}

.tutorial-hints {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #9ca3af;
}

/* 底部按钮 */
.guide-footer {
  display: flex;
  gap: 12px;
  padding-top: 24px;
}

.guide-footer :deep(.van-button--primary) {
  flex: 1;
  background: linear-gradient(135deg, #ff6b9d 0%, #ff9a6c 100%);
  border: none;
}
</style>
