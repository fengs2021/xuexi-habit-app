<template>
  <Teleport to="body">
    <div v-if="show" class="celebration-overlay" @click="close">
      <div class="celebration-content">
        <div class="stars-container">
          <span v-for="i in 20" :key="i" class="star" :style="getStarStyle(i)">⭐</span>
        </div>
        <div class="confetti-container">
          <span v-for="i in 30" :key="'c'+i" class="confetti" :style="getConfettiStyle(i)"></span>
        </div>
        <div class="celebration-text">
          <div class="big-star">🌟</div>
          <div class="title">太棒了！</div>
          <div class="subtitle">+{{ stars }} 积分</div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: Boolean,
  stars: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['close'])

const close = () => {
  emit('close')
}

const getStarStyle = (i) => {
  const angle = (i / 20) * 360
  const radius = 100 + Math.random() * 50
  const x = Math.cos((angle * Math.PI) / 180) * radius
  const y = Math.sin((angle * Math.PI) / 180) * radius
  const delay = Math.random() * 0.5
  const duration = 1 + Math.random() * 0.5
  return {
    '--x': x + 'px',
    '--y': y + 'px',
    '--delay': delay + 's',
    '--duration': duration + 's',
    '--size': (12 + Math.random() * 12) + 'px'
  }
}

const getConfettiStyle = (i) => {
  const colors = ['#FF69B4', '#FFD700', '#FF6B6B', '#07c160', '#1989fa', '#9B59B6', '#FF85A2']
  const color = colors[i % colors.length]
  const left = Math.random() * 100
  const delay = Math.random() * 0.8
  const duration = 1.5 + Math.random() * 1
  const size = 6 + Math.random() * 6
  return {
    '--left': left + '%',
    '--color': color,
    '--delay': delay + 's',
    '--duration': duration + 's',
    '--size': size + 'px'
  }
}

watch(() => props.show, (val) => {
  if (val) {
    setTimeout(() => emit('close'), 1800)
  }
})
</script>

<style scoped>
.celebration-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.celebration-content {
  position: relative;
  text-align: center;
  animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.stars-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.star {
  position: absolute;
  font-size: var(--size);
  animation: starFly 1.5s var(--delay) ease-out forwards;
  opacity: 0;
}

@keyframes starFly {
  0% {
    transform: translate(0, 0) scale(0) rotate(0deg);
    opacity: 1;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translate(var(--x), var(--y)) scale(1) rotate(360deg);
    opacity: 0;
  }
}

.confetti-container {
  position: absolute;
  top: -100px;
  left: -100px;
  right: -100px;
  bottom: -100px;
  pointer-events: none;
  overflow: hidden;
}

.confetti {
  position: absolute;
  width: var(--size);
  height: var(--size);
  background: var(--color);
  border-radius: 2px;
  top: -20px;
  left: var(--left);
  animation: confettiFall var(--duration) var(--delay) ease-out forwards;
  opacity: 0;
}

@keyframes confettiFall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(400px) rotate(720deg);
    opacity: 0;
  }
}

.celebration-text {
  background: linear-gradient(135deg, #FFF8DC 0%, #FFFACD 50%, #FFE4E1 100%);
  border: 4px solid #FFD700;
  border-radius: 24px;
  padding: 30px 50px;
  box-shadow: 0 10px 40px rgba(255, 105, 180, 0.4);
}

.big-star {
  font-size: 60px;
  animation: bounce 0.6s ease infinite;
  margin-bottom: 10px;
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.title {
  font-size: 28px;
  font-weight: bold;
  color: #FF69B4;
  text-shadow: 0 2px 4px rgba(255, 105, 180, 0.3);
  margin-bottom: 8px;
}

.subtitle {
  font-size: 22px;
  font-weight: bold;
  color: #FF6B6B;
}
</style>
