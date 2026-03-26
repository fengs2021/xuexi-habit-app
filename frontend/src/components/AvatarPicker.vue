<template>
  <div class="avatar-picker">
    <div class="avatar-grid">
      <div 
        v-for="avatar in avatars" 
        :key="avatar.id"
        class="avatar-item"
        :class="{ selected: selectedId === avatar.id }"
        @click="selectAvatar(avatar)"
      >
        <img :src="avatar.url" :alt="avatar.name" />
        <span class="avatar-name">{{ avatar.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAvatars } from '@/api/avatar'

const props = defineProps({
  modelValue: String
})

const emit = defineEmits(['update:modelValue'])

const avatars = ref([])
const selectedId = ref(props.modelValue)

onMounted(async () => {
  try {
    const res = await getAvatars()
    avatars.value = res.data || []
  } catch (e) {
    console.error('Failed to load avatars:', e)
  }
})

const selectAvatar = (avatar) => {
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
