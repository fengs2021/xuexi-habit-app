<template>
  <div class="family-page">
    <van-cell-group inset title="家庭信息">
      <van-cell title="家庭名称" :value="familyInfo?.name || ''" />
      <van-cell title="邀请码" :value="familyInfo?.code || ''" v-if="userStore.isAdmin" is-link @click="copyCode" />
    </van-cell-group>

    <van-cell-group inset title="家庭成员">
      <van-cell
        v-for="member in familyInfo?.members || []"
        :key="member.id"
        :title="member.nickname"
        :label="member.role === 'admin' ? '家长' : '学生'"
      >
        <template #right-icon>
          <div class="member-actions">
            <span>{{ member.stars || 0 }} ★</span>
            <van-button 
              v-if="userStore.isAdmin && member.id !== userStore.userInfo?.id" 
              size="small" 
              type="danger" 
              plain
              @click="removeMember(member)"
            >
              删除
            </van-button>
          </div>
        </template>
      </van-cell>
    </van-cell-group>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getFamily } from '@/api/family'
import { showToast, showConfirmDialog } from 'vant'
import axios from 'axios'

const userStore = useUserStore()
const familyInfo = ref(null)

const loadFamily = async () => {
  try {
    const data = await getFamily()
    familyInfo.value = data
  } catch (error) {
    showToast('加载失败')
  }
}

const copyCode = async () => {
  if (familyInfo.value?.code) {
    await navigator.clipboard.writeText(familyInfo.value.code)
    showToast('邀请码已复制')
  }
}

const removeMember = async (member) => {
  try {
    await showConfirmDialog({
      title: '确认移除',
      message: '确定要将 ' + member.nickname + ' 从家庭中移除吗？'
    })
    await axios.delete('/api/family/member/' + member.id)
    showToast('已移除')
    await loadFamily()
  } catch (error) {
    if (error !== 'cancel') {
      showToast('移除失败')
    }
  }
}

onMounted(async () => {
  if (!userStore.userInfo) {
    await userStore.getUserInfoAction()
  }
  await loadFamily()
})
</script>

<style scoped>
.family-page {
  padding-bottom: 20px;
}
.member-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
