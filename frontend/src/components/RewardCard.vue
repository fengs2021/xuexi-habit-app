<template>
  <div class="reward-card">
    <div class="reward-info">
      <h3>{{ reward.title }}</h3>
      <p class="cost">{{ reward.starCost || reward.star_cost }} ★</p>
    </div>
    <div class="reward-actions">
      <van-button
        v-if="userStore.isChild && !isCurrentTarget"
        size="small"
        type="warning"
        @click.stop="$emit('setTarget', reward)"
      >
        设为目标
      </van-button>
      <van-button
        v-else-if="userStore.isChild && isCurrentTarget"
        size="small"
        type="default"
        @click.stop="$emit('clearTarget')"
      >
        取消目标
      </van-button>
      <van-tag v-else-if="reward.status === 'exchanged'" type="success">已兑换</van-tag>
      <van-button
        v-else
        size="small"
        type="primary"
        @click.stop="$emit('exchange', reward.id)"
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

const props = defineProps({
  reward: Object,
  loading: { type: Boolean, default: false }
})
defineEmits(['exchange', 'setTarget', 'clearTarget'])

const userStore = useUserStore()
const isCurrentTarget = computed(() => userStore.targetReward?.id === props.reward.id)
</script>

<style scoped>
.reward-card {
  background: #fff;
  border-radius: 12px;
  margin-bottom: 12px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.reward-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
}
.cost {
  color: #ff976a;
  font-weight: bold;
  margin: 0;
}
</style>
