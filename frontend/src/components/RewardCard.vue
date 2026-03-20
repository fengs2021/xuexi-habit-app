<template>
  <div class="reward-card" :class="rarityClass" @click="onClick">
    <!-- 右上角稀有度 -->
    <div class="rarity-tag" :class="rarityClass">
      {{ rarityText }}
    </div>

    <!-- 图标 -->
    <div class="reward-icon">
      <van-icon :name="rewardIcon" :size="28" />
    </div>

    <!-- 奖励名称 -->
    <div class="reward-title">{{ reward.title }}</div>

    <!-- 价格 -->
    <div class="reward-price">
      <van-icon name="star" color="#ffc107" size="14px" />
      <span>{{ reward.starCost }}</span>
    </div>

    <!-- 兑换按钮 -->
    <van-button
      v-if="showButton"
      size="small"
      type="primary"
      :disabled="!canExchange"
      @click.stop="onExchange"
    >
      兑换
    </van-button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { showToast } from 'vant'

const props = defineProps({
  reward: {
    type: Object,
    required: true
  },
  userStars: {
    type: Number,
    default: 0
  },
  showButton: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['click', 'exchange'])

const rarityClass = computed(() => {
  const map = {
    'normal': 'rarity-normal',
    'epic': 'rarity-epic',
    'legend': 'rarity-legend'
  }
  return map[props.reward.rarity] || 'rarity-normal'
})

const rarityText = computed(() => {
  const map = {
    'normal': '普通',
    'epic': '史诗',
    'legend': '传说'
  }
  return map[props.reward.rarity] || '普通'
})

const rewardIcon = computed(() => {
  const iconMap = {
    '玩手机': 'phone-o',
    '看电视': 'tv-o',
    '免做家务': 'shield-o',
    '看电影': 'video-o',
    '出去吃饭': 'shop-o',
    '游乐场': 'location-o',
    '玩具': 'gift-o',
    '好书': 'book-mark-o',
    'default': 'gift-o'
  }
  return iconMap[props.reward.title] || iconMap.default
})

const canExchange = computed(() => props.userStars >= props.reward.starCost)

function onClick() {
  emit('click', props.reward)
}

function onExchange() {
  if (!canExchange.value) {
    showToast('星星不足')
    return
  }
  emit('exchange', props.reward)
}
</script>

<style scoped>
.reward-card {
  position: relative;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  border: 2px solid transparent;
  transition: transform 0.2s;
}

.reward-card:active {
  transform: scale(0.98);
}

.rarity-epic {
  border-color: #a855f7;
}

.rarity-legend {
  border-color: #f59e0b;
}

.rarity-tag {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.rarity-normal .rarity-tag {
  background: #e5e7eb;
  color: #6b7280;
}

.rarity-epic .rarity-tag {
  background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
  color: #fff;
}

.rarity-legend .rarity-tag {
  background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
  color: #fff;
}

.reward-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: #f3f4f6;
  border-radius: 12px;
  color: #6b7280;
}

.rarity-epic .reward-icon {
  background: rgba(168, 85, 247, 0.1);
  color: #a855f7;
}

.rarity-legend .reward-icon {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.reward-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  text-align: center;
}

.reward-price {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
  color: #666;
}

.reward-card:deep(.van-button) {
  background: linear-gradient(135deg, #ff6b9d 0%, #ff9a6c 100%);
  border: none;
  border-radius: 16px;
}
</style>
