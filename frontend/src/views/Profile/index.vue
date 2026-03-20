<template>
  <div class="profile-page">
    <el-card>
      <template #header>
        <span>个人中心</span>
      </template>
      <div class="profile-info">
        <el-avatar :size="64" icon="UserFilled" />
        <div class="info-detail">
          <h3>{{ userStore.userInfo?.nickname }}</h3>
          <p class="role">{{ userStore.isAdmin ? '家长' : '学生' }}</p>
        </div>
      </div>
      <el-divider />
      <div class="info-list">
        <div class="info-item">
          <span class="label">手机号</span>
          <span class="value">{{ userStore.userInfo?.phone || '未绑定' }}</span>
        </div>
        <div class="info-item">
          <span class="label">角色</span>
          <span class="value">{{ userStore.isAdmin ? '家长' : '学生' }}</span>
        </div>
      </div>
      <el-divider />
      <el-button type="danger" @click="handleLogout" block>退出登录</el-button>
    </el-card>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

function handleLogout() {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logoutAction()
    router.push('/login')
  }).catch(() => {})
}
</script>

<style scoped>
.profile-info { display: flex; align-items: center; gap: 20px; padding: 20px 0; }
.info-detail h3 { margin: 0 0 8px 0; }
.info-detail .role { color: #909399; margin: 0; }
.info-list { padding: 10px 0; }
.info-item { display: flex; justify-content: space-between; padding: 12px 0; }
.info-item .label { color: #909399; }
.info-item .value { font-weight: bold; }
</style>
