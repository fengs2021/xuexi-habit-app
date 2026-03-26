<template>
  <div class="streak-badge" v-if="streak > 0 || showAlways">
    <span class="streak-fire" v-if="streak >= 3">{{ fireEmoji }}</span>
    <span class="streak-count">{{ streak }}</span>
    <span class="streak-label">天</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  streak: {
    type: Number,
    default: 0
  },
  showAlways: {
    type: Boolean,
    default: false
  }
})

const fireEmoji = computed(() => {
  if (props.streak >= 30) return '🏆'
  if (props.streak >= 7) return '🔥'
  if (props.streak >= 3) return '✨'
  return ''
})
</script>

<style scoped>
.streak-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
  padding: 2px 8px;
  border-radius: var(--clay-radius-sm);
  font-size: 12px;
  color: white;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(255,107,107,0.3);
}

.streak-fire {
  font-size: 14px;
}

.streak-count {
  font-size: 14px;
}

.streak-label {
  font-size: 10px;
  opacity: 0.9;
}
</style>
