<template>
  <div class="user-header">
    <div class="user-info">
      <van-image
        round
        width="44px"
        height="44px"
        :src="userInfo?.avatar || defaultAvatar"
        class="avatar"
      />
      <div class="info">
        <div class="name-row">
          <span class="name">{{ userInfo?.nickname || '未登录' }}</span>
          <van-tag v-if="userInfo?.level" type="primary" size="medium">
            Lv.{{ userInfo.level }}
          </van-tag>
        </div>
        <div class="stars">
          <van-icon name="star" color="#ffc107" size="16px" />
          <span>{{ userInfo?.stars || 0 }}</span>
        </div>
      </div>
    </div>
    <van-icon name="arrow-down" @click="showMemberList = true" />
  </div>

  <!-- 成员切换弹窗 -->
  <van-action-sheet
    v-model:show="showMemberList"
    title="切换孩子"
    :actions="memberActions"
    @select="onSelectMember"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '../stores/user'

const props = defineProps({
  userInfo: {
    type: Object,
    default: null
  }
})

const userStore = useUserStore()
const showMemberList = ref(false)

const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

const members = computed(() => userStore.familyInfo?.members || [])
const memberActions = computed(() =>
  members.value.map(m => ({
    name: m.nickname,
    subname: m.isCurrent ? '当前' : '',
    data: m
  }))
)

function onSelectMember(action) {
  // 切换成员逻辑
  showMemberList.value = false
}
</script>

<style scoped>
.user-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-radius: 12px;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.stars {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #666;
}
</style>
