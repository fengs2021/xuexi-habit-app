<template>
  <div class="task-card" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd" :class="{ 'swiped': isSwiped }">
    <div class="task-content">
      <div class="task-info">
        <h3>{{ task.title }}</h3>
        <p class="reward">{{ task.starReward || task.star_reward }} ★</p>
        <van-tag v-if="task.frequency === 'daily'" type="primary" size="small">每日</van-tag>
      </div>
      <div class="task-actions">
        <van-button size="small" type="primary" @click.stop="complete" :loading="loading" v-if="!task.completed">完成</van-button>
        <van-tag v-else-if="task.completed" type="success">已完成</van-tag>
      </div>
    </div>
    <div class="task-skip" @click.stop="skip" v-if="!task.completed">
      <van-icon name="delete" />
      <span>跳过</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  task: Object
})
const emit = defineEmits(['complete', 'skip'])

let startX = 0
let currentX = 0
const isSwiped = ref(false)
const loading = ref(false)

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
    await emit('complete', props.task.id)
  } finally {
    loading.value = false
  }
}

const skip = async () => {
  await emit('skip', props.task.id)
}
</script>

<style scoped>
.task-card {
  position: relative;
  background: #fff;
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
  transition: transform 0.2s;
}
.task-content {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.task-skip {
  position: absolute;
  right: -60px;
  top: 0;
  height: 100%;
  width: 60px;
  background: #f56c6c;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: right 0.2s;
}
.task-skip .van-icon {
  font-size: 20px;
}
.task-skip span {
  font-size: 12px;
  margin-top: 4px;
}
.task-card.swiped {
  transform: translateX(-60px);
}
.task-card.swiped .task-skip {
  right: 0;
}
.reward {
  color: #ff976a;
  font-weight: bold;
  margin: 4px 0;
}
</style>
