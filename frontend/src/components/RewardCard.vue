<template>
  <div class="reward-card">
    <div class="reward-info">
      <h3>{{ reward.title }}</h3>
      <p class="cost">{{ reward.starCost || reward.star_cost }} ★</p>
    </div>
    <div class="reward-actions">
      <van-button size="small" type="primary" @click="exchange" :loading="loading">兑换</van-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  reward: Object
})
const emit = defineEmits(['exchange'])
const loading = ref(false)

const exchange = async () => {
  loading.value = true
  try {
    await emit('exchange', props.reward.id)
  } finally {
    loading.value = false
  }
}
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
.cost {
  color: #ff976a;
  font-weight: bold;
  margin-top: 4px;
}
</style>
