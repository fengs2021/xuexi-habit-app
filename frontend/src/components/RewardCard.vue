<template>
  <div class="reward-card">
    <div class="reward-info">
      <h3>{{ reward.title }}</h3>
      <p class="cost">{{ reward.starCost || reward.star_cost }} ★</p>
    </div>
    <div class="reward-actions">
      <!-- 管理员编辑按钮 -->
      <van-button
        v-if="showEdit && userStore.isAdmin"
        size="small"
        type="default"
        plain
        @click.stop="$emit('edit', reward)"
      >
        编辑
      </van-button>
      <van-button
        v-if="showExchange && userStore.isChild && !isCurrentTarget"
        size="small"
        type="warning"
        @click.stop="$emit('setTarget', reward)"
      >
        设为目标
      </van-button>
      <van-button
        v-else-if="showExchange && userStore.isChild && isCurrentTarget"
        size="small"
        type="default"
        @click.stop="('clearTarget')"
      >
        取消目标
      </van-button>
      <van-tag v-if="!showExchange && reward.status === 'exchanged'" type="success">已兑换</van-tag>
      <van-button
        v-if="showExchange"
        size="small"
        type="primary"
        @click.stop="handleExchange"
        :loading="loading"
      >
        兑换
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { showToast } from 'vant'

const props = defineProps({
  reward: Object,
  loading: { type: Boolean, default: false },
  showExchange: { type: Boolean, default: true },
  showEdit: { type: Boolean, default: false }
})
const emit = defineEmits(['exchange', 'setTarget', 'clearTarget', 'edit'])

const userStore = useUserStore()
const isCurrentTarget = computed(() => userStore.targetReward?.id === props.reward.id)

const handleExchange = () => {
  console.log('【调试】handleExchange 被调用', {
    reward: props.reward,
    userInfo: userStore.userInfo,
    stars: userStore.userInfo?.stars,
    cost: props.reward.starCost || props.reward.star_cost,
    showExchange: props.showExchange,
    isChild: userStore.isChild
  })
  const cost = props.reward.starCost || props.reward.star_cost
  const currentStars = userStore.userInfo?.stars || 0
  
  if (currentStars < cost) {
    console.log('【调试】积分不足', { currentStars, cost })
    showToast('分数不够，继续努力')
    return
  }
  
  console.log('【调试】emit exchange', props.reward.id)
  emit('exchange', props.reward.id)
}
</script>

<style scoped>
.reward-card {
  background: var(--theme-bg);
  border-radius: var(--clay-radius-lg);
  margin-bottom: 18px;
  padding: 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* 🧱 超强橡皮泥阴影 */
  box-shadow: 
    10px 10px 20px rgba(0, 0, 0, 0.12),
    5px 5px 10px rgba(0, 0, 0, 0.08),
    inset -5px -5px 12px rgba(255, 255, 255, 0.9);
  transition: transform var(--press-duration) cubic-bezier(0.34, 1.56, 0.64, 1);
}
.reward-card:active {
  /* 禁止缩放，避免子元素位置偏移 */
  transform: none;
}
.reward-info h3 {
  margin: 0 0 8px 0;
  font-size: 17px;
  color: #444;
  font-weight: 700;
}
.cost {
  color: var(--theme-primary);
  font-weight: 800;
  margin: 0;
  font-size: 16px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
</style>
