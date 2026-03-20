<template>
  <div class="goal-banner" @click="onClick">
    <div class="banner-left">
      <van-icon name="award-o" color="#fbbf24" size="24px" />
      <div class="banner-text">
        <div class="banner-title">设置目标</div>
        <div class="banner-progress">
          <span class="current">{{ currentStars }}</span>
          <span class="separator">/</span>
          <span class="target">{{ targetStars }}</span>
          <van-icon name="star" color="#ffc107" size="14px" />
        </div>
      </div>
    </div>
    <van-icon name="arrow" color="#fff" />
  </div>
</template>

<script setup>
const props = defineProps({
  currentStars: {
    type: Number,
    default: 0
  },
  targetStars: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['click'])

function onClick() {
  emit('click')
}
</script>

<style scoped>
.goal-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #ff6b9d 0%, #ff9a6c 100%);
  border-radius: 12px;
  padding: 12px 16px;
  color: #fff;
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.banner-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.banner-title {
  font-size: 14px;
  font-weight: 600;
}

.banner-progress {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  opacity: 0.9;
}

.separator {
  margin: 0 2px;
}
</style>
