<template>
  <div class="pet-wrapper" ref="petWrapper">
    <div class="pet-companion" :class="{ 'pet-bounce': isBouncing }" @click="handleClick" @touchstart="handleTouchStart" @touchend="handleTouchEnd" @mousedown="handleMouseDown" @mouseup="handleMouseUp" @mouseleave="handleMouseUp">
      <div class="pet-body">
        <img v-if="isImagePet(currentPet)" :src="getPetImage(currentPet)" class="pet-image" />
        <span v-else class="pet-emoji">{{ currentPet }}</span>
        <div class="pet-bubble" v-if="showBubble">
          <span class="bubble-text">{{ currentMessage }}</span>
        </div>
      </div>
      <div class="pet-name">{{ petNames[currentPet] || '小宠物' }}</div>
    </div>
    
    <van-popup v-model:show="showPicker" position="bottom" round :overlay="false" :close-on-click-overlay="false" style="max-height: 80vh; z-index: 2001;">
      <div class="pet-picker">
        <div class="picker-title">🎀 选择你的宠物</div>
        
        <!-- 卡通宠物 -->
        <div v-if="imagePets.length > 0" class="pet-section">
          <div class="pet-section-title">🌟 卡通宠物</div>
          <div class="pet-grid image-grid">
            <div v-for="pet in imagePets" :key="pet.id" class="pet-option pet-image-option" :class="{ 'selected': currentPet === pet.filename }" @click="selectPet(pet.filename)">
              <img :src="pet.url" class="pet-thumb" />
              <div class="pet-thumb-name">{{ pet.name }}</div>
            </div>
          </div>
        </div>
        
        <!-- Emoji宠物 -->
        <div class="pet-section">
          <div class="pet-section-title">😊 表情宠物</div>
          <div class="pet-grid">
            <div v-for="pet in petOptions" :key="pet" class="pet-option" :class="{ 'selected': currentPet === pet }" @click="selectPet(pet)">
              <span class="pet-emoji-small">{{ pet }}</span>
            </div>
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getDisplaySettings, updateDisplaySettings } from '@/api/display'
import { getAvatars } from '@/api/avatar'

const userStore = useUserStore()
const petWrapper = ref(null)
const showBubble = ref(false)
const isBouncing = ref(false)
const currentMessage = ref('')
const showPicker = ref(false)
const currentPet = ref('😊')
const pressTimer = ref(null)
const imagePets = ref([])

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
  '🐝': '小蜜蜂', '🌸': '小樱花', '🌺': '小木槿', '🌈': '小彩虹',
  // 卡通宠物名称
  'peppa.jpg': '小猪佩奇', 'chase.jpg': '汪汪队Chase', 'marshall.jpg': '汪汪队Marshall',
  'elsa.jpg': '艾莎公主', 'belle.jpg': '贝儿公主', 'cinderella.jpg': '灰姑娘',
  'moana.jpg': '莫阿娜', 'tiana.jpg': '蒂安娜公主', 'rapunzel.jpg': '长发公主'
}

const messages = [
  '冲鸭！今天的任务等着你呢~', '加油！我相信你可以的！', '完成任务的你超级酷！',
  '一点一点来，不着急~', '我在这里给你加油！', '太棒啦！继续保持！',
  '你是最厉害的小朋友！', '完成今天的任务吧~', '我为你骄傲！', '让我们一起加油！'
]

// 判断是否是图片宠物
const isImagePet = (pet) => {
  return pet && (pet.endsWith('.jpg') || pet.endsWith('.png') || pet.includes('/avatars/'))
}

// 获取宠物图片URL
const getPetImage = (pet) => {
  if (isImagePet(pet)) {
    // 如果是完整URL直接返回
    if (pet.startsWith('http')) return pet
    // 从imagePets中查找完整URL
    const found = imagePets.value.find(p => p.filename === pet)
    if (found && found.url) return found.url
    // 否则拼接URL（使用公网IP）
    return `http://111.229.221.200:8080/avatars/${pet}`
  }
  return ''
}

const handleClick = () => {
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

const selectPet = async (pet) => {
  currentPet.value = pet
  try {
    await updateDisplaySettings({ userId: userStore.userInfo.id, pet: pet })
  } catch (e) {
    console.error('Failed to save pet:', e)
  }
}

// 加载宠物列表
onMounted(async () => {
  // 加载卡通宠物
  try {
    const res = await getAvatars()
    imagePets.value = res || []
  } catch (e) {
    console.error('Failed to load avatars:', e)
  }
  
  // 加载已选宠物
  try {
    const settings = await getDisplaySettings(userStore.userInfo.id)
    if (settings?.pet) {
      currentPet.value = settings.pet
    }
  } catch (e) {
    console.error('Failed to load pet settings:', e)
  }
})
</script>

<style scoped>
.pet-wrapper { position: relative; display: flex; flex-direction: column; align-items: center; }
.pet-companion { display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none; padding: 10px; transition: transform 0.3s; }
.pet-companion:hover { transform: scale(1.05); }
.pet-companion:active { transform: scale(0.95); }
.pet-bounce { animation: bounce 0.5s ease; }

.pet-body { position: relative; width: 100px; height: 100px; background: linear-gradient(135deg, #FFF5F7 0%, #FFE4EC 100%); border-radius: 50%; box-shadow: 0 8px 25px rgba(255, 105, 180, 0.25); display: flex; align-items: center; justify-content: center; cursor: pointer; border: 3px solid #FFB6C1; }
.pet-image { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
.pet-emoji { font-size: 60px; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); transition: transform 0.3s; }
.pet-body:hover .pet-emoji { transform: scale(1.1); }
.pet-bubble { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: white; padding: 8px 14px; border-radius: 16px; box-shadow: 0 4px 15px rgba(255, 105, 180, 0.25); white-space: nowrap; z-index: 100; animation: bubblePop 0.3s ease; }
.pet-bubble::after { content: ''; position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); border: 8px solid transparent; border-top-color: white; border-bottom: 0; }

.pet-name { margin-top: 8px; font-size: 14px; color: #FF69B4; font-weight: bold; }

.pet-picker { padding: 16px; max-height: 70vh; overflow-y: auto; }
.picker-title { text-align: center; font-size: 18px; font-weight: bold; color: #FF69B4; margin-bottom: 16px; }
.pet-section { margin-bottom: 16px; }
.pet-section-title { font-size: 13px; color: #999; margin-bottom: 10px; }
.pet-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 8px; }
.image-grid { grid-template-columns: repeat(4, 1fr); }
.pet-option { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6px; border-radius: 12px; cursor: pointer; transition: all 0.2s; background: #f5f5f5; }
.pet-option:hover { background: #FFE4EC; }
.pet-option.selected { background: #FFB6C1; box-shadow: 0 2px 8px rgba(255, 105, 180, 0.4); }
.pet-emoji-small { font-size: 24px; }
.pet-image-option { padding: 4px; }
.pet-thumb { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #fff; }
.pet-thumb-name { font-size: 9px; color: #666; margin-top: 2px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60px; }

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
@keyframes bubblePop {
  0% { opacity: 0; transform: translateX(-50%) scale(0.8); }
  100% { opacity: 1; transform: translateX(-50%) scale(1); }
}
</style>
