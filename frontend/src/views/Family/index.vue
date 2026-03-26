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
        :title="member.role === 'admin' ? member.nickname : member.nickname"
        :label="member.role === 'admin' ? '家长' : '学生'"
        :is-link="member.role !== 'admin'"
        @click="member.role !== 'admin' && goToStatistics(member)"
      >
        <template #right-icon>
          <div class="member-actions">
            <span>{{ member.stars || 0 }} ★</span>
            <van-button 
              v-if="userStore.isAdmin && member.id !== userStore.userInfo?.id" 
              size="small" 
              type="danger" 
              plain
              @click="handleRemove(member)"
            >
              删除
            </van-button>
          </div>
        </template>
      </van-cell>
      <van-cell v-if="userStore.isAdmin">
        <van-button type="primary" block @click="showAddDialog = true">添加学生成员</van-button>
      </van-cell>
    </van-cell-group>

    <van-dialog v-model:show="showAddDialog" title="添加学生成员" show-cancel-button @confirm="handleAddChild">
      <van-form>
        <van-field v-model="newChildNickname" label="昵称" placeholder="请输入学生昵称" />
      </van-form>
    </van-dialog>

    <van-dialog v-model:show="showRemoveDialog" title="移除成员" show-cancel-button @confirm="confirmRemove">
      <div style="padding: 16px;">确定要将 {{ pendingRemove?.nickname }} 从家庭中移除吗？</div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { getFamily } from '@/api/family'
import { showToast, showConfirmDialog } from 'vant'
import request from '@/api/request'

const userStore = useUserStore()
const router = useRouter()
const familyInfo = ref(null)
const showAddDialog = ref(false)
const newChildNickname = ref('')
const showRemoveDialog = ref(false)
const pendingRemove = ref(null)

const goToStatistics = (member) => {
  router.push({ path: '/statistics', query: { childId: member.id, name: member.nickname } })
}

const loadFamily = async () => {
  try {
    const data = await getFamily()
    familyInfo.value = data
  } catch (error) {
    console.error('加载家庭信息失败:', error)
    showToast('加载失败')
  }
}

const copyCode = async () => {
  if (familyInfo.value?.code) {
    await navigator.clipboard.writeText(familyInfo.value.code)
    showToast('邀请码已复制')
  }
}

const handleAddChild = async () => {
  if (!newChildNickname.value.trim()) {
    showToast('请输入昵称')
    return
  }
  try {
    const res = await request({ url: '/family/child', method: 'POST', data: { nickname: newChildNickname.value } })
    showToast('添加成功')
    newChildNickname.value = ''
    loadFamily()
  } catch (error) {
    showToast('添加失败')
  }
}

const handleRemove = async (member) => {
  pendingRemove.value = member
  showRemoveDialog.value = true
}

const confirmRemove = async () => {
  if (!pendingRemove.value) return
  try {
    await request({ url: '/family/member/' + pendingRemove.value.id, method: 'DELETE' })
    showToast('移除成功')
    pendingRemove.value = null
    loadFamily()
  } catch (error) {
    showToast('移除失败')
  }
}

onMounted(() => {
  loadFamily()
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
