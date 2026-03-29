<template>
  <div class="task-card" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd" :class="{ 'swiped': isSwiped }">
    <div class="task-content">
      <div class="task-info">
        <h3>🌸 {{ task.title }}</h3>
        <div class="task-tags">
          <van-tag v-if="task.frequency === 'daily'" style="--tag-color: var(--theme-primary)" class="tag-theme" plain size="small">🌞 每日</van-tag>
          <van-tag v-if="task.frequency === 'weekly'" style="--tag-color: var(--theme-secondary)" class="tag-theme" plain size="small">📅 每周</van-tag>
          <van-tag v-if="task.frequency === 'once'" style="--tag-color: #FFB6C1" class="tag-theme" plain size="small">⭐ 一次性</van-tag>
        </div>
      </div>
      <div class="task-actions">
        <div class="star-reward" :class="{ 'star-negative': (task.starReward || task.star_reward) < 0 }">
  {{ (task.starReward || task.star_reward) > 0 ? '+' : '' }}{{ task.starReward || task.star_reward }} ★
</div>
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
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { showToast } from 'vant'

const props = defineProps({
  task: Object
})
const emit = defineEmits(['complete'])

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
  isSwiped.value = false
}

const complete = async () => {
  loading.value = true
  try {
    await emit('complete', props.task)
  } finally {
    loading.value = false
  }
}

</script>

<style scoped>
.task-card {
  background: var(--theme-bg);
  border-radius: var(--clay-radius-lg);
  margin: 14px 16px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* 🧱 超强橡皮泥阴影 - 多层效果 */
  box-shadow: 
    12px 12px 24px rgba(0, 0, 0, 0.12),
    6px 6px 12px rgba(0, 0, 0, 0.08),
    inset -6px -6px 14px rgba(255, 255, 255, 0.9);
  border: 3px solid transparent;
  transition: transform var(--press-duration) cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow var(--press-duration) var(--press-timing);
  cursor: pointer;
}
.task-card:hover {
  border-color: var(--theme-primary);
}
.task-card:active {
  transform: scale(0.94);
  box-shadow: 
    4px 4px 8px rgba(0, 0, 0, 0.18),
    2px 2px 4px rgba(0, 0, 0, 0.1),
    inset -3px -3px 8px rgba(255, 255, 255, 0.8);
}
.task-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.task-info h3 {
  margin: 0 0 12px 0;
  font-size: 17px;
  color: #444;
  font-weight: 700;
}
.task-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.star-reward {
  font-size: 20px;
  font-weight: 800;
  color: var(--theme-primary);
  text-shadow: 0 2px 4px rgba(0,0,0,0.15);
  margin-right: 14px;
}
.star-reward.star-negative {
  color: #ee0a24;
}
.btn-complete,
.btn-done,
.btn-pending {
  border-radius: 50px !important;  /* 超圆润药丸形 */
  font-weight: 700;
  min-width: 110px;
  height: 42px;
  /* 🧱 柔和粉色渐变 - 不刺眼 */
  background: linear-gradient(145deg, #FFB6C1 0%, #FF91A4 50%, #FF7F9A 100%) !important;
  border: none !important;
  /* 🧱 柔和阴影 */
  box-shadow: 
    6px 6px 14px rgba(255, 127, 154, 0.35),
    3px 3px 8px rgba(255, 127, 154, 0.25),
    inset 0 2px 4px rgba(255, 255, 255, 0.5) !important;
  transition: transform var(--press-duration) cubic-bezier(0.34, 1.56, 0.64, 1) !important;
  text-shadow: 0 1px 3px rgba(0,0,0,0.15);
  padding: 0 20px !important;
  color: #fff !important;
}
.btn-complete:active,
.btn-done:active,
.btn-pending:active {
  transform: scale(var(--press-scale)) !important;
  background: linear-gradient(145deg, #FF9AAF 0%, #FF7F9A 100%) !important;
  box-shadow: 
    3px 3px 8px rgba(255, 127, 154, 0.4),
    1px 1px 4px rgba(255, 127, 154, 0.3),
    inset 0 2px 6px rgba(255, 255, 255, 0.3) !important;
}

/* 主题标签 */
.tag-theme {
  --tag-color: var(--theme-primary);
  color: var(--tag-color) !important;
  border-color: var(--tag-color) !important;
  font-weight: 600;
  border-radius: var(--clay-radius-sm) !important;
  padding: 4px 12px !important;
}
</style>
