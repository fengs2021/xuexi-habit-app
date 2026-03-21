<template>
  <div class=spin-wheel-overlay v-if=visible @click.self=close>
    <div class=spin-wheel-container>
      <div class=spin-wheel-title>🎰 幸运转盘</div>
      
      <div class=wheel-wrapper>
        <div class=wheel-pointer>▼</div>
        <div class=wheel :class="{ spinning: spinning }" :style="{ transform: 'rotate(' + wheelAngle + 'deg)' }">
          <div class=wheel-segment v-for="(prize, index) in prizes" :key="prize.id" 
               :style="getSegmentStyle(index)">
            <span class="prize-emoji">{{ prize.emoji }}</span>
            <span class="prize-name">{{ prize.name }}</span>
          </div>
        </div>
      </div>
      
      <button class="spin-btn" v-if="!spinning && !result" @click="doSpin" 
              :disabled="hasSpunToday || prizes.length === 0">
        {{ hasSpunToday ? '今日已转动' : (prizes.length === 0 ? '加载中...' : '开始转动') }}
      </button>
      
      <div class="result-display" v-if="result">
        <div class="result-emoji">{{ result.prize.emoji }}</div>
        <div class="result-name">{{ result.prize.name }}</div>
        <div class="result-reward" v-if="result.reward">
          <span v-if="result.reward.type === 'stars'">+{{ result.reward.value }} ⭐</span>
          <span v-else-if="result.reward.type === 'sticker'">获得 {{ result.reward.rarity }} 级贴纸！</span>
        </div>
        <button class="close-btn" @click="close">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import axios from '@/api/request'

const props = defineProps({
  visible: Boolean,
  userId: String
})

const emit = defineEmits(['close', 'spin-success'])

const prizes = ref([])
const spinning = ref(false)
const wheelAngle = ref(0)
const hasSpunToday = ref(false)
const result = ref(null)

onMounted(async () => {
  await loadConfig()
  await checkTodaySpin()
})

// 每次打开弹窗时重新检查
watch(() => props.visible, async (newVal) => {
  if (newVal && props.userId) {
    await checkTodaySpin()
  }
})

async function loadConfig() {
  try {
    const res = await axios.get('/wheel/config')
    prizes.value = res || []
  } catch (e) {
    console.error('Load wheel config error:', e)
  }
}

async function checkTodaySpin() {
  if (!props.userId) return
  try {
    const res = await axios.get('/wheel/today/' + props.userId + '?t=' + Date.now())
    console.log('Spin check response:', res)
    hasSpunToday.value = res.spun || false
    console.log('hasSpunToday set to:', hasSpunToday.value)
  } catch (e) {
    console.error('Check today spin error:', e)
  }
}

function getSegmentStyle(index) {
  if (prizes.value.length === 0) return {}
  const angle = 360 / prizes.value.length
  const rotate = index * angle
  return {
    transform: 'rotate(' + rotate + 'deg)',
    backgroundColor: index % 2 === 0 ? '#FFF5E6' : '#FFE4C4'
  }
}

async function doSpin() {
  if (spinning.value || hasSpunToday.value || !props.userId || prizes.value.length === 0) return
  
  spinning.value = true
  result.value = null
  
  const prizeIndex = Math.floor(Math.random() * prizes.value.length)
  const anglePerPrize = 360 / prizes.value.length
  const extraSpins = 6 * 360
  const targetAngle = extraSpins + (prizeIndex * anglePerPrize) + (anglePerPrize / 2)
  
  wheelAngle.value = targetAngle
  
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  try {
    const res = await axios.post('/wheel/spin/' + props.userId)
    result.value = res
    hasSpunToday.value = true
    emit('spin-success', result.value)
  } catch (e) {
    console.error('Spin error:', e)
  }
  
  spinning.value = false
}

function close() {
  if (!spinning.value) {
    emit('close')
  }
}
</script>

<style scoped>
.spin-wheel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.spin-wheel-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 20px;
  text-align: center;
  color: white;
  max-width: 350px;
  width: 90%;
}

.spin-wheel-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
}

.wheel-wrapper {
  position: relative;
  margin: 0 auto 20px;
  width: 280px;
  height: 280px;
}

.wheel-pointer {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 35px;
  color: #FFD700;
  z-index: 10;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
}

.wheel {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 8px solid #FFD700;
  background: #FFF;
  display: flex;
  flex-wrap: wrap;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  transition: transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99);
}

.wheel.spinning {
  transition: transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99);
}

.wheel-segment {
  width: 50%;
  height: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.prize-emoji {
  font-size: 28px;
}

.prize-name {
  font-size: 10px;
  color: #333;
  margin-top: 2px;
}

.spin-btn {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  border: none;
  padding: 12px 40px;
  border-radius: 25px;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  transition: transform 0.2s;
  min-width: 150px;
}

.spin-btn:disabled {
  background: #CCC;
  color: #888;
  cursor: not-allowed;
}

.spin-btn:not(:disabled):active {
  transform: scale(0.95);
}

.result-display {
  padding: 20px;
}

.result-emoji {
  font-size: 60px;
  margin-bottom: 10px;
  animation: bounce 0.5s ease infinite alternate;
}

@keyframes bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-10px); }
}

.result-name {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 5px;
}

.result-reward {
  font-size: 16px;
  margin-bottom: 15px;
  color: #FFD700;
}

.close-btn {
  background: white;
  border: none;
  padding: 10px 30px;
  border-radius: 20px;
  font-size: 16px;
  cursor: pointer;
}
</style>
