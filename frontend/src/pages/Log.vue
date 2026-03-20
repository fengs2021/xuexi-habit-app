<template>
  <div class="log-page">
    <UserHeader :user-info="currentChild" />

    <!-- 日志列表 -->
    <div class="log-list" v-if="logs.length > 0">
      <div v-for="log in logs" :key="log.id" class="log-item">
        <div class="log-icon" :class="log.action">
          <van-icon v-if="log.action === 'complete'" name="checked" color="#22c55e" />
          <van-icon v-else name="arrow-left" color="#9ca3af" />
        </div>
        <div class="log-info">
          <div class="log-title">
            {{ log.taskTitle }}
            <van-tag v-if="log.action === 'complete'" type="success" size="small">
              +{{ log.starsEarned }}⭐
            </van-tag>
            <van-tag v-else type="default" size="small">
              跳过
            </van-tag>
          </div>
          <div class="log-time">{{ formatTime(log.createdAt) }}</div>
        </div>
      </div>
    </div>

    <van-empty v-else description="还没有任何记录">
      <template #image>
        <div class="empty-icon">📝</div>
      </template>
      <template #description>
        <div class="empty-text">完成任务后这里会显示记录</div>
      </template>
    </van-empty>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getLogs } from '../api/log'
import UserHeader from '../components/UserHeader.vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const logs = ref([])

const currentChild = computed(() => userStore.currentChild)

onMounted(async () => {
  await userStore.fetchFamily()
  try {
    const res = await getLogs({ limit: 50 })
    logs.value = res.data
  } catch (error) {
    console.error(error)
  }
})

function formatTime(time) {
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString()
}
</script>

<style scoped>
.log-page {
  min-height: 100vh;
  background: #fff0f3;
  padding: 12px;
  padding-bottom: 80px;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 12px 16px;
}

.log-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
}

.log-info {
  flex: 1;
}

.log-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.log-time {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

.empty-icon {
  font-size: 64px;
}

.empty-text {
  color: #9ca3af;
  font-size: 14px;
}
</style>
