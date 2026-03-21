<template>
  <div class="pet-wrapper" ref="petWrapper">
    <div class="pet-companion" :class="{ 'pet-bounce': isBouncing }" @click="handleClick" @touchstart="handleTouchStart" @touchend="handleTouchEnd" @mousedown="handleMouseDown" @mouseup="handleMouseUp" @mouseleave="handleMouseLeave">
      <div class="pet-body">
        <span class="pet-emoji">{{ currentPet }}</span>
        <div class="pet-bubble" v-if="showBubble">
          <span class="bubble-text">{{ currentMessage }}</span>
        </div>
      </div>
      <div class="pet-name">{{ petNames[currentPet] || '小宠物' }}</div>
    </div>
    
    <van-popup v-model:show="showPicker" position="bottom" round :overlay="false" :close-on-click-overlay="false" style="max-height: 70vh; z-index: 2001;">
      <div class="pet-picker">
        <div class="picker-title">🎀 选择你的宠物</div>
        <div class="pet-grid">
          <div v-for="pet in petOptions" :key="pet" class="pet-option" :class="{ 'selected': currentPet === pet }" @click="selectPet(pet)">
            <span class="pet-emoji-small">{{ pet }}</span>
          </div>
        </div>
        <van-button type="primary" block @click="showPicker = false" style="margin-top: 16px; background: #FF69B4; border: none;">
          完成
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getDisplaySettings, updateDisplaySettings } from '@/api/display'

const userStore = useUserStore()
const petWrapper = ref(null)
const showBubble = ref(false)
const isBouncing = ref(false)
const currentMessage = ref('')
const showPicker = ref(false)
const currentPet = ref('😊')
const pressTimer = ref(null)

const petOptions = [
  '😊', '😍', '🥰', '😎', '🤩', '😇', '🤗', '😺', '😸', '😻',
  '🙈', '🙉', '🙊', '🐵', '🐶', '🐱', '🐰', '🐻', '🐼', '🐨',
  '🦊', '🦁', '🐯', '🦄', '🐲', '🦋', '🐢', '🐠', '🐬', '🐳',
  '🦈', '🐸', '🦜', '🦚', '🦩', '🦆', '🦢', '🪼', '🦎', '🐛',
  '🐝', '🌸', '🌺', '🌈'
]

const petNames = {
  '😊': '开心果', '😍': '小甜心', '🥰': '小可爱', '😎': '小酷哥', '🤩': '小星星',
  '😇': '小天使', '🤗': '小拥抱', '😺': '小猫咪', '😸': '小笑脸', '😻': '小爱心',
  '🙈': '小害羞', '🙉': '小猴猴', '🙊': '小脸红', '🐵': '小猴子', '🐶': '小狗子',
  '🐱': '小猫咪', '🐰': '小兔兔', '🐻': '小熊宝', '🐼': '小熊猫', '🐨': '小考拉',
  '🦊': '小狐狸', '🦁': '小狮子', '🐯': '小老虎', '🦄': '小独角兽', '🐲': '小龙龙',
  '🦋': '小蝴蝶', '🐢': '小乌龟', '🐠': '小金鱼', '🐬': '小海豚', '🐳': '小蓝鲸',
  '🦈': '小鲨鱼', '🐸': '小青蛙', '🦜': '小鹦鹉', '🦚': '小孔雀', '🦩': '小火烈鸟',
  '🦆': '小鸭子', '🦢': '小天鹅', '🪼': '小水母', '🦎': '小蜥蜴', '🐛': '小毛虫',
  '🐝': '小蜜蜂', '🌸': '小樱花', '🌺': '小木槿', '🌈': '小彩虹'
}

const messages = [
  '冲鸭！今天的任务等着你呢~', '加油！我相信你可以的！', '完成任务的你超级酷！',
  '一点一点来，不着急~', '我在这里给你加油！', '太棒啦！继续保持！',
  '你是最厉害的小朋友！', '完成今天的任务吧~', '我为你骄傲！', '让我们一起加油！'
]

const handleClick = () => {
  // 点击显示气泡
  currentMessage.value = messages[Math.floor(Math.random() * messages.length)]
  showBubble.value = true
  isBouncing.value = true
  setTimeout(() => { isBouncing.value = false }, 500)
  setTimeout(() => { showBubble.value = false }, 3000)
}

const handleTouchStart = (e) => {
  
  pressTimer.value = setTimeout(() => {
    showPicker.value = true
  }, 500)
}

const handleTouchEnd = (e) => {
  
  if (pressTimer.value) {
    clearTimeout(pressTimer.value)
    pressTimer.value = null
  }
}

const handleMouseDown = (e) => {
  pressTimer.value = setTimeout(() => {
    showPicker.value = true
  }, 500)
}

const handleMouseUp = (e) => {
  if (pressTimer.value) {
    clearTimeout(pressTimer.value)
    pressTimer.value = null
  }
}

const handleMouseLeave = (e) => {
  if (pressTimer.value) {
    clearTimeout(pressTimer.value)
    pressTimer.value = null
  }
}

const selectPet = async (pet) => {
  currentPet.value = pet
  showPicker.value = false
  try {
    await updateDisplaySettings({ userId: userStore.userInfo.id, pet: pet })
  } catch (e) {
    console.error('保存宠物失败', e)
  }
}

const loadPet = async () => {
  try {
    const res = await getDisplaySettings(userStore.userInfo.id)
    const settings = res?.data || res
    if (settings?.pet) {
      currentPet.value = settings.pet
    }
  } catch (e) {
    console.error('加载宠物失败', e)
  }
}

onMounted(() => {
  loadPet()
})

onUnmounted(() => {
  if (pressTimer.value) {
    clearTimeout(pressTimer.value)
  }
})
</script>

<style scoped>
.pet-wrapper { position: relative; display: flex; flex-direction: column; align-items: center; }
.pet-companion { display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none; padding: 10px; transition: transform 0.3s; }
.pet-companion:hover { transform: scale(1.05); }
.pet-companion:active { transform: scale(0.95); }
.pet-bounce { animation: bounce 0.5s ease; }
@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
.pet-body { position: relative; width: 100px; height: 100px; background: linear-gradient(135deg, #FFF5F7 0%, #FFE4EC 100%); border-radius: 50%; box-shadow: 0 8px 25px rgba(255, 105, 180, 0.25); display: flex; align-items: center; justify-content: center; cursor: pointer; border: 3px solid #FFB6C1; }
.pet-emoji { font-size: 60px; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); transition: transform 0.3s; }
.pet-body:hover .pet-emoji { transform: scale(1.1); }
.pet-bubble { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: white; padding: 8px 14px; border-radius: 16px; box-shadow: 0 4px 15px rgba(255, 105, 180, 0.25); white-space: nowrap; z-index: 100; animation: bubblePop 0.3s ease; }
.pet-bubble::after { content: ''; position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); border: 8px solid transparent; border-top-color: white; border-bottom: 0; }
@keyframes bubblePop { 0% { opacity: 0; transform: translateX(-50%) translateY(10px); } 100% { opacity: 1; transform: translateX(-50%) translateY(0); } }
.bubble-text { font-size: 12px; color: #FF69B4; font-weight: bold; }
.pet-name { margin-top: 8px; font-size: 14px; color: #FF69B4; font-weight: bold; }
.pet-picker { padding: 20px; background: #FFF5F7; max-height: 70vh; overflow-y: auto; -webkit-overflow-scrolling: touch; }
.picker-title { text-align: center; font-size: 18px; font-weight: bold; color: #FF69B4; margin-bottom: 20px; }
.pet-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
.pet-option { width: 50px; height: 50px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 2px solid transparent; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.pet-option:hover { transform: scale(1.1); border-color: #FF69B4; }
.pet-option.selected { border-color: #FF69B4; background: #FFE4EC; box-shadow: 0 0 0 3px rgba(255, 105, 180, 0.3); }
.pet-emoji-small { font-size: 28px; line-height: 1; }
</style>
