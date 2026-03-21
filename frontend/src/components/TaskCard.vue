<template>
  <div class="task-card" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd" :class="{ 'swiped': isSwiped }">
    <div class="task-content">
      <div class="task-info">
        <h3>🌸 {{ task.title }}</h3>
        <div class="task-tags">
          <van-tag v-if="task.frequency === 'daily'" color="#FF69B4" plain size="small">🌞 每日</van-tag>
          <van-tag v-if="task.frequency === 'weekly'" color="#FF85A2" plain size="small">📅 每周</van-tag>
          <van-tag v-if="task.frequency === 'once'" color="#FFB6C1" plain size="small">⭐ 一次性</van-tag>
        </div>
      </div>
      <div class="task-actions">
        <div class="star-reward">+{{ task.starReward || task.star_reward }} ★</div>
        <van-button 
          v-if="task.pendingApproval" 
          type="warning" 
          size="small" 
          disabled
          class="btn-pending"
        >
          ⏳ 待审批
        </van-button>
        <van-button 
          v-else-if="task.completed" 
          type="success" 
          size="small" 
          disabled
          class="btn-done"
        >
          ✅ 已完成
        </van-button>
        <van-button 
          v-else 
          size="small" 
          type="danger" 
          class="btn-complete"
          @click.stop="complete" 
          :loading="loading"
        >
          ✨ 完成
        </van-button>
      </div>
    </div>
    <div class="task-skip" @click.stop="skip" v-if="!task.completed && !task.pendingApproval">
      <van-icon name="cross" />
      <span>跳过</span>
    </div>
  </div>

  <CelebrationAnimation 
    :show="showCelebration" 
    :stars="task.starReward || task.star_reward || 1"
    @close="showCelebration = false" 
  />
</template>

<script setup>
import { ref } from 'vue'
import { showToast } from 'vant'
import CelebrationAnimation from './CelebrationAnimation.vue'

const props = defineProps({
  task: Object
})
const emit = defineEmits(['complete', 'skip'])

let startX = 0
let currentX = 0
const isSwiped = ref(false)
const loading = ref(false)
const showCelebration = ref(false)

const onTouchStart = (e) => {
  startX = e.touches[0].clientX
}

const onTouchMove = (e) => {
  currentX = e.touches[0].clientX
  const delta = currentX - startX
  isSwiped.value = delta < -50
}

const onTouchEnd = () => {
  if (isSwiped.value) {
    skip()
  }
  isSwiped.value = false
}

const complete = async () => {
  loading.value = true
  try {
    showCelebration.value = true
    await emit('complete', props.task.id)
  } finally {
    loading.value = false
  }
}

const skip = async () => {
  await emit('skip', props.task)
}
</script>

<style scoped>
.task-card {
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF5F7 100%);
  border-radius: 20px;
  margin: 10px 16px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 3px 15px rgba(255, 105, 180, 0.15);
  border: 2px solid transparent;
  transition: all 0.3s ease;
}
.task-card:hover {
  border-color: #FFB6C1;
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(255, 105, 180, 0.25);
}
.task-card.swiped {
  transform: translateX(-60px);
}
.task-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.task-info h3 {
  margin: 0 0 8px 0;
  font-size: 15px;
  color: #333;
  font-weight: bold;
}
.task-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.star-reward {
  font-size: 17px;
  font-weight: bold;
  color: #FF69B4;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
  margin-right: 10px;
}
.btn-complete {
  background: linear-gradient(135deg, #FF69B4 0%, #FF85A2 100%) !important;
  border: none !important;
  color: #fff !important;
  font-weight: bold;
  border-radius: 22px !important;
  box-shadow: 0 3px 10px rgba(255, 105, 180, 0.4);
}
.btn-complete:active {
  transform: scale(0.95);
}
.btn-done {
  background: linear-gradient(135deg, #FFB6C1 0%, #FFC0CB 100%) !important;
  border: none !important;
  color: #fff !important;
  border-radius: 22px !important;
}
.btn-pending {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%) !important;
  border: none !important;
  color: #fff !important;
  border-radius: 22px !important;
}
.task-skip {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #C9A0A0;
  font-size: 11px;
  margin-left: 10px;
  padding: 10px;
  border-radius: 14px;
  transition: all 0.2s;
}
.task-skip:active {
  background: #FFF0F5;
  color: #FF69B4;
}
</style>
