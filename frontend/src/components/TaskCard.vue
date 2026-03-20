<template>
  <div class="task-card-wrapper" ref="wrapperRef">
    <div 
      class="task-card" 
      :class="[rarityClass, { 'is-new': task.isNew }]"
      :style="{ transform: 'translate(' + offsetX + 'px, ' + offsetY + 'px)' }"
      @click="onClick"
      @touchstart="onTouchStart"
      @touchmove.prevent="onTouchMove"
      @touchend="onTouchEnd"
    >
      <!-- 左上角星星 -->
      <div class="star-badge">
        <van-icon name="star" color="#ffc107" size="12px" />
        <span>{{ task.starReward }}</span>
      </div>

      <!-- 右上角稀有度 -->
      <div class="rarity-badge" :class="rarityClass">
        {{ task.rarity }}
      </div>

      <!-- 中央图标 -->
      <div class="task-icon">
        <van-icon :name="taskIcon" :size="32" />
      </div>

      <!-- 任务名称 -->
      <div class="task-title">{{ task.title }}</div>

      <!-- 频率标签 -->
      <div v-if="task.frequency" class="frequency-tag">
        {{ frequencyText }}
      </div>

      <!-- 操作提示 -->
      <div v-if="showActions" class="action-hints">
        <span class="hint-left">← 滑动跳过</span>
        <span class="hint-right">上滑完成 ↑</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'complete', 'skip'])

const wrapperRef = ref(null)
const offsetX = ref(0)
const offsetY = ref(0)
const startX = ref(0)
const startY = ref(0)
const isSwiping = ref(false)

const rarityClass = computed(() => {
  const map = {
    'N': 'rarity-n',
    'R': 'rarity-r',
    'SR': 'rarity-sr',
    'SSR': 'rarity-ssr'
  }
  return map[props.task.rarity] || 'rarity-n'
})

const taskIcon = computed(() => {
  const iconMap = {
    '按时起床': 'clock-o',
    '按时睡觉': 'moon-o',
    '整理书包': 'bag-o',
    '收拾房间': 'clean',
    'default': 'todo-o'
  }
  return iconMap[props.task.title] || iconMap.default
})

const frequencyText = computed(() => {
  const map = {
    'daily': '每日1次',
    'weekly': '每周1次'
  }
  return map[props.task.frequency] || props.task.frequency
})

function onClick() {
  if (!isSwiping.value && Math.abs(offsetX.value) < 10 && Math.abs(offsetY.value) < 10) {
    emit('click', props.task)
  }
  offsetX.value = 0
  offsetY.value = 0
}

function onTouchStart(e) {
  startX.value = e.touches[0].clientX
  startY.value = e.touches[0].clientY
  isSwiping.value = false
}

function onTouchMove(e) {
  const deltaX = e.touches[0].clientX - startX.value
  const deltaY = e.touches[0].clientY - startY.value
  
  // 判断滑动方向
  if (!isSwiping.value) {
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      isSwiping.value = true
    }
  }

  if (isSwiping.value) {
    // 阻止页面滚动
    e.preventDefault()
    
    // 判断主要滑动方向
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 水平滑动
      offsetX.value = deltaX * 0.6
      offsetY.value = 0
    } else {
      // 垂直滑动
      offsetX.value = 0
      offsetY.value = deltaY * 0.6
    }
  }
}

function onTouchEnd() {
  if (!isSwiping.value) {
    offsetX.value = 0
    offsetY.value = 0
    return
  }

  isSwiping.value = false

  // 判断滑动结果
  if (offsetX.value > 80) {
    // 向右滑 = 跳过
    emit('skip', props.task)
  } else if (offsetY.value < -80) {
    // 向上滑 = 完成
    emit('complete', props.task)
  }

  // 重置位置
  setTimeout(() => {
    offsetX.value = 0
    offsetY.value = 0
  }, 100)
}
</script>

<style scoped>
.task-card-wrapper {
  position: relative;
  overflow: visible;
}

.task-card {
  position: relative;
  background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 120px;
  color: #fff;
  cursor: pointer;
  touch-action: none;  /* 关键：阻止浏览器默认触摸行为 */
  user-select: none;
  transition: transform 0.1s ease-out;
}

/* 稀有度颜色 */
.rarity-sr {
  background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
}

.rarity-ssr {
  background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
}

.rarity-r {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
}

.rarity-n {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
}

.is-new {
  background: transparent;
  border: 2px dashed #d1d5db;
  color: #9ca3af;
}

.is-new .task-icon {
  background: transparent;
}

.star-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 600;
}

.rarity-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
}

.rarity-ssr .rarity-badge {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #fff;
}

.task-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  margin-bottom: 8px;
}

.task-title {
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}

.frequency-tag {
  font-size: 11px;
  opacity: 0.8;
  margin-top: 4px;
}

.action-hints {
  position: absolute;
  bottom: -24px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #9ca3af;
}
</style>
