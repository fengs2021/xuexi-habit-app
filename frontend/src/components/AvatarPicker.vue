<template>
  <div class="avatar-picker">
    <!-- 当前头像已锁定，提示用户无法更换 -->
    <div v-if="currentIsLocked" class="locked-notice">
      <span class="locked-notice-icon">🔒</span>
      <span>当前头像「{{ currentAvatar?.name }}」尚未解锁<br>完成本周任务获取抽取机会吧～</span>
    </div>

    <div class="avatar-grid">
      <div
        v-for="avatar in avatars"
        :key="avatar.id"
        class="avatar-item"
        :class="{
          selected: selectedId === avatar.id && !avatar.locked,
          locked: avatar.locked
        }"
        @click="selectAvatar(avatar)"
      >
        <div class="avatar-img-wrap">
          <img :src="avatar.url" :alt="avatar.name" />
          <span v-if="avatar.locked" class="lock-overlay">🔒</span>
          <span v-if="avatar.availableThisWeek && avatar.locked" class="week-badge">本周限定</span>
        </div>
        <span class="avatar-name">{{ avatar.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { getAvatars } from '@/api/avatar'
import { useUserStore } from '@/store/modules/user'

const props = defineProps({
  modelValue: String
})

const emit = defineEmits(['update:modelValue'])

const userStore = useUserStore()
const avatars = ref([])
const selectedId = ref(props.modelValue)
const loading = ref(false)

onMounted(async () => {
  try {
    const userId = userStore.userInfo?.id
    if (!userId) return
    const res = await getAvatars(userId)
    avatars.value = res.data || []
  } catch (e) {
    console.error('Failed to load avatars:', e)
  }
})

// 当前选中头像（可能在锁定列表中）
const currentAvatar = computed(() =>
  avatars.value.find(a => a.id === selectedId.value)
)

// 选中的是否为锁定头像
const currentIsLocked = computed(() =>
  currentAvatar.value?.locked === true
)

const selectAvatar = (avatar) => {
  if (avatar.locked) return
  selectedId.value = avatar.id
  emit('update:modelValue', avatar.id)
}
</script>

<style scoped>
.avatar-picker {
  padding: 10px;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.avatar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: var(--clay-radius-sm);
  transition: all 0.2s;
}

.avatar-item:hover {
  background: #f5f5f5;
}

.avatar-item.selected {
  background: #fff0f5;
  box-shadow: 0 2px 8px rgba(255, 105, 180, 0.3);
}

.avatar-item img {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.avatar-item.selected img {
  border-color: #ff69b4;
}

.avatar-item.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.avatar-item.locked:hover {
  background: transparent;
}

.avatar-img-wrap {
  position: relative;
  display: inline-block;
}

.lock-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 28px;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.5));
  pointer-events: none;
}

.locked-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #fff3e0;
  border-radius: 10px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #e65100;
  line-height: 1.5;
}

.locked-notice-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.week-badge {
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #ff6b6b, #ff4757);
  color: #fff;
  font-size: 8px;
  padding: 1px 4px;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
}

.avatar-name {
  margin-top: 6px;
  font-size: 11px;
  color: #666;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.avatar-item.selected .avatar-name {
  color: #ff69b4;
  font-weight: 600;
}
</style>
