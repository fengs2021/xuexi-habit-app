<template>
  <div class="dashboard">
    <!-- 装饰元素 -->
    <div class="deco-flowers">
      <span class="deco-flower df1">🌸</span>
      <span class="deco-flower df2">🌺</span>
      <span class="deco-flower df3">🌷</span>
      <span class="deco-flower df4">💐</span>
    </div>

    <!-- 目标血条（仅孩子且有目标时显示） -->
    <van-cell-group inset class="target-card" v-if="userStore.isChild && userStore.targetReward">
      <van-cell>
        <template #title>
          <div class="target-title">
            <span class="target-name">🎯 目标：{{ userStore.targetReward.name }}</span>
            <van-button size="small" plain @click="handleClearTarget">取消</van-button>
          </div>
        </template>
      </van-cell>
      <van-cell>
        <div class="progress-wrapper">
          <div class="progress-bar pink-progress">
            <van-progress
              :percentage="progressPercent"
              :color="progressColor"
              :pivot-text="progressPercent + '%'"
              :stroke-width="20"
            />
          </div>
        </div>
        <div class="progress-text">
          💖 {{ userStore.userInfo?.stars || 0 }} / {{ userStore.targetReward.cost }} ★
        </div>
        <div class="encourage-text" :class="{ 'bounce': progressPercent === 100 }">
          {{ encourageText }}
        </div>
      </van-cell>
    </van-cell-group>

    <!-- 小宠物（仅孩子显示） -->
    <div class="pet-wrapper" v-if="userStore.isChild">
      <PetCompanion :tasks="tasks" />
    </div>

    <!-- 签到卡片（仅孩子显示） -->
    <SigninCard v-if="userStore.isChild" />

    <!-- 今日任务 -->
    <van-cell-group inset title="🌸 今日任务" class="task-group">
      <TaskCard
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        @complete="handleComplete"
        @skip="handleSkip"
      />
      <van-empty v-if="!loading && tasks.length === 0" description="今日无任务，休息一下吧！🌈" />
    </van-cell-group>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getTasks, completeTask, skipTask } from '@/api/task'
import TaskCard from '@/components/TaskCard.vue'
import SigninCard from '@/components/SigninCard.vue'
import PetCompanion from '@/components/PetCompanion.vue'
import { showToast } from 'vant'

const userStore = useUserStore()
const loading = ref(false)
const tasks = ref([])

const progressPercent = computed(() => {
  if (!userStore.targetReward) return 0
  const current = userStore.userInfo?.stars || 0
  const target = userStore.targetReward.cost
  return Math.min(100, Math.round((current / target) * 100))
})

const progressColor = computed(() => {
  const percent = progressPercent.value
  if (percent >= 100) return '#FF69B4'
  if (percent >= 70) return '#FF85A2'
  if (percent >= 30) return '#FFB6C1'
  return '#FFC0CB'
})

const encourageText = computed(() => {
  const percent = progressPercent.value
  if (percent === 0) {
    const texts = [
      '🌸 冲鸭！奖励在前方等着你！',
      '✨ 大冒险开始啦，快去收集星星！',
      '🎀 任务副本已刷新，等你来战！',
      '🌟 每颗星星都是你的超能力！',
      '🎯 设定小目标，一步一步来！'
    ]
    return texts[Math.floor(Math.random() * texts.length)]
  }
  if (percent < 20) {
    const texts = [
      '💪 很好！已经迈出第一步啦！',
      '🌱 种子已经种下，继续浇水吧！',
      '🎈 起步顺利，继续加油！',
      '✨ 已经有星星在口袋里啦！'
    ]
    return texts[Math.floor(Math.random() * texts.length)]
  }
  if (percent < 40) {
    const texts = [
      '🌸 越来越棒啦！进度不错！',
      '🦋 像蝴蝶一样美丽！',
      '💖 打败40%的困难啦！',
      '🏃 跑得真快，继续冲刺！'
    ]
    return texts[Math.floor(Math.random() * texts.length)]
  }
  if (percent < 60) {
    const texts = [
      '🌺 速度加成！快到飞起！',
      '💎 快一半啦，你是小明星！',
      '🌈 看到彩虹了吗？就在前方！',
      '🏆 你是任务小达人！'
    ]
    return texts[Math.floor(Math.random() * texts.length)]
  }
  if (percent < 80) {
    const texts = [
      '🌸 只差一点啦！你是冠军候选！',
      '✨ 小宇宙爆发中！',
      '🎯 靶心近在咫尺！',
      '🦸 超能力蓄满，即将爆发！'
    ]
    return texts[Math.floor(Math.random() * texts.length)]
  }
  if (percent < 100) {
    const texts = [
      '🏅 胜利就在眼前！冲啊！',
      '👑 小公主/小王子即将诞生！',
      '🌟 最后冲刺！你是最棒的！',
      '💖 加油加油！'
    ]
    return texts[Math.floor(Math.random() * texts.length)]
  }
  // 100%
  const texts = [
    '🎉🎊 目标达成！你是超级小明星！',
    '🏆 太厉害啦！任务终结者！',
    '🌟🌟🌟 满星通关！无敌！',
    '👑 王者降临！全服最美！',
    '🎖️ 荣誉时刻！你是冠军！'
  ]
  return texts[Math.floor(Math.random() * texts.length)]
})

const loadTasks = async () => {
  loading.value = true
  try {
    const data = await getTasks()
    tasks.value = [...(data.daily||[]), ...(data.weekly||[]), ...(data.special||[])]
  } catch (error) {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

const handleComplete = async (task) => {
  try {
    await completeTask(task.id)
    showToast({ message: '✨ 任务完成！+' + (task.starReward || task.star_reward || 1) + '星', duration: 1500 })
    loadTasks()
  } catch (error) {
    showToast('操作失败')
  }
}

const handleSkip = async (task) => {
  try {
    await skipTask(task.id)
    showToast('已跳过')
    loadTasks()
  } catch (error) {
    showToast('操作失败')
  }
}

const handleClearTarget = async () => {
  userStore.targetReward = null
  localStorage.removeItem('targetReward')
  showToast('已取消目标')
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
  position: relative;
}
.deco-flowers {
  position: fixed;
  top: 70px;
  right: 10px;
  z-index: 0;
  pointer-events: none;
}
.deco-flower {
  position: absolute;
  font-size: 20px;
  opacity: 0.5;
  animation: floatDeco 4s ease-in-out infinite;
}
.df1 { top: 0; right: 0; animation-delay: 0s; }
.df2 { top: 40px; right: -10px; animation-delay: 1s; font-size: 16px; }
.df3 { top: 70px; right: 5px; animation-delay: 2s; font-size: 18px; }
.df4 { top: 100px; right: -5px; animation-delay: 0.5s; font-size: 22px; }
@keyframes floatDeco {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(15deg); }
}
.target-card {
  margin-bottom: 12px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(255, 105, 180, 0.2);
  background: linear-gradient(135deg, #FFF5F7 0%, #FFF0F5 100%);
  border: 2px solid #FFB6C1;
}
.target-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.target-name {
  font-size: 15px;
  font-weight: bold;
  color: #FF69B4;
}
.progress-wrapper {
  padding: 8px 0;
}
.pink-progress {
  border-radius: 12px;
  overflow: hidden;
}
.progress-text {
  font-size: 15px;
  color: #FF69B4;
  text-align: center;
  margin-top: 8px;
  font-weight: bold;
}
.encourage-text {
  font-size: 14px;
  color: #FF85A2;
  text-align: center;
  margin-top: 8px;
  font-weight: 500;
}
.encourage-text.bounce {
  animation: celebrateBounce 0.6s ease infinite;
  color: #FF69B4;
  font-size: 16px;
}
@keyframes celebrateBounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
.task-group :deep(.van-cell-group__title) {
  color: #FF69B4;
  font-size: 15px;
  font-weight: bold;
}
</style>
