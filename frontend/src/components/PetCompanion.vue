<template>
  <div class="pet-companion" @click="handleClick" :class="{ 'pet-bounce': isBouncing }">
    <div class="pet-body" @click="handleClick">
      <div class="pet-face" :class="petMood">
        <div class="pet-eyes">
          <span class="eye eye-left"></span>
          <span class="eye eye-right"></span>
        </div>
        <div class="pet-mouth"></div>
        <div class="pet-cheeks">
          <span class="cheek cheek-left"></span>
          <span class="cheek cheek-right"></span>
        </div>
        <div class="pet-bubble" v-if="showBubble">
          <span class="bubble-text">{{ currentMessage }}</span>
        </div>
      </div>
      <div class="pet-accessories">
        <span class="accessory" v-if="moodLevel >= 4">👑</span>
        <span class="accessory" v-else-if="moodLevel >= 3">🎀</span>
        <span class="accessory" v-else-if="moodLevel >= 2">🌸</span>
        <span class="accessory" v-else>🍃</span>
      </div>
    </div>
    <div class="pet-name">{{ petName }}</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  tasks: {
    type: Array,
    default: () => []
  }
})

const petName = '小星'
const showBubble = ref(false)
const isBouncing = ref(false)
const currentMessage = ref('')

const completedCount = computed(() => props.tasks.filter(t => t.completed).length)
const totalCount = computed(() => props.tasks.length)
const completionRate = computed(() => {
  if (totalCount.value === 0) return 0
  return completedCount.value / totalCount.value
})

const moodLevel = computed(() => {
  if (completionRate.value >= 1) return 5  // 完全开心
  if (completionRate.value >= 0.75) return 4  // 很开心
  if (completionRate.value >= 0.5) return 3  // 开心
  if (completionRate.value >= 0.25) return 2  // 一般
  return 1  // 有点沮丧
})

const petMood = computed(() => {
  const moods = ['sad', 'neutral', 'happy', 'excited', 'thrilled']
  return moods[moodLevel.value - 1]
})

const messages = {
  sad: [
    '呜呜，今天还没完成任务呢...',
    '加油呀！我相信你可以的！',
    '别灰心，迈出第一步就好啦~',
    '今天的任务等着你呢~'
  ],
  neutral: [
    '今天要加油哦！我陪着你~',
    '来完成一些任务吧！',
    '我在这里给你加油！',
    '一点一点来，不着急~'
  ],
  happy: [
    '做得很好！继续加油！',
    '太棒啦！保持这个节奏~',
    '你真厉害！我为你骄傲！',
    '继续保持，一定能完成！'
  ],
  excited: [
    '哇！太厉害了吧！',
    '继续保持！你太优秀了！',
    '冲刺！胜利就在前方！',
    '最后一搏！我们能行！'
  ],
  thrilled: [
    '完美！！你是最棒的！！',
    '全部完成啦！！太厉害了！！',
    '今天的任务全部搞定！',
    '休息一下吧，你值得！'
  ]
}

const handleClick = () => {
  const moodMessages = messages[petMood.value]
  currentMessage.value = moodMessages[Math.floor(Math.random() * moodMessages.length)]
  showBubble.value = true
  isBouncing.value = true
  
  setTimeout(() => {
    isBouncing.value = false
  }, 500)
  
  setTimeout(() => {
    showBubble.value = false
  }, 3000)
}
</script>

<style scoped>
.pet-companion {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  user-select: none;
  padding: 10px;
  transition: transform 0.3s;
  overflow: visible;
}

.pet-companion:hover {
  transform: scale(1.05);
}

.pet-companion:active {
  transform: scale(0.95);
}

.pet-bounce {
  animation: bounce 0.5s ease;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.pet-body {
  position: relative;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #FFE4E1 0%, #FFC0CB 100%);
  border-radius: 50% 50% 45% 45%;
  box-shadow: 0 4px 15px rgba(255, 105, 180, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  cursor: pointer;
}

.pet-face {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.pet-eyes {
  display: flex;
  gap: 15px;
  margin-bottom: 5px;
}

.eye {
  width: 12px;
  height: 12px;
  background: #333;
  border-radius: 50%;
  position: relative;
}

.eye::after {
  content: '';
  position: absolute;
  width: 4px;
  height: 4px;
  background: white;
  border-radius: 50%;
  top: 2px;
  right: 2px;
}

.pet-mouth {
  width: 20px;
  height: 10px;
  border-radius: 0 0 10px 10px;
  background: #FF69B4;
  transition: all 0.3s;
}

.pet-cheeks {
  position: absolute;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 5px;
  top: 35px;
}

.cheek {
  width: 12px;
  height: 8px;
  background: rgba(255, 150, 150, 0.6);
  border-radius: 50%;
}

.accessory {
  position: absolute;
  top: -10px;
  font-size: 24px;
}

/* Mood variations */
.sad .pet-mouth {
  width: 15px;
  height: 8px;
  border-radius: 10px 10px 0 0;
  background: #FF9999;
}

.sad .eye {
  height: 10px;
}

.neutral .pet-mouth {
  width: 15px;
  height: 5px;
  border-radius: 5px;
  background: #FFB6C1;
}

.happy .pet-mouth {
  width: 25px;
  height: 12px;
}

.excited .pet-mouth {
  width: 30px;
  height: 15px;
  background: #FF69B4;
}

.thrilled .pet-mouth {
  width: 35px;
  height: 18px;
  background: #FF1493;
  animation: mouthWiggle 0.3s ease infinite;
}

@keyframes mouthWiggle {
  0%, 100% { transform: scaleX(1); }
  50% { transform: scaleX(1.1); }
}

.thrilled .cheek {
  background: rgba(255, 100, 100, 0.8);
  animation: cheekPulse 0.5s ease infinite;
}

@keyframes cheekPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.pet-bubble {
  position: absolute;
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 6px 10px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(255, 105, 180, 0.3);
  white-space: nowrap;
  z-index: 100;
  animation: bubblePop 0.3s ease;
}

.pet-bubble::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: white;
  border-bottom: 0;
}

@keyframes bubblePop {
  0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.bubble-text {
  font-size: 11px;
  color: #FF69B4;
  font-weight: bold;
}

.pet-name {
  margin-top: 5px;
  font-size: 12px;
  color: #FF69B4;
  font-weight: bold;
}
</style>
