<template>
  <div class="attack-animation" v-if="visible">
    +{{ points }} ★
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  points: { type: Number, default: 5 }
})
const visible = ref(false)

const show = (pts) => {
  if (pts) props.points = pts
  visible.value = true
  setTimeout(() => { visible.value = false }, 800)
}

defineExpose({ show })
</script>

<style scoped>
.attack-animation {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, #ff976a, #ff6b6b);
  color: #fff;
  padding: 12px 24px;
  border-radius: 24px;
  font-size: 20px;
  font-weight: bold;
  animation: fadeUp 0.8s ease-out;
  z-index: 2000;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
}
@keyframes fadeUp {
  0% {
    opacity: 0;
    transform: translate(-50%, -20%);
  }
  20% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -100%);
  }
}
</style>
