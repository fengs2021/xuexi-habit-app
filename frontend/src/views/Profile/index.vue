<template>
  <div class="profile-page">
    <van-cell-group inset>
      <van-cell title="昵称" :value="userStore.userInfo?.nickname || ''" />
      <van-cell title="角色" :value="userStore.isAdmin ? '家长' : '学生'" />
    </van-cell-group>
    <van-cell-group inset>
      <van-cell title="我的星星" :value="(userStore.userInfo?.stars || 0) + ' ★'" />
    </van-cell-group>
    <van-button type="danger" block class="logout-btn" @click="logout">退出登录</van-button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { showConfirmDialog } from 'vant'

const router = useRouter()
const userStore = useUserStore()

const logout = async () => {
  await showConfirmDialog({ title: '提示', message: '确定要退出登录吗？' })
  userStore.logoutAction()
  router.push('/login')
}
</script>

<style scoped>
.profile-page {
  padding-bottom: 20px;
}
.logout-btn {
  margin: 40px 16px;
}
</style>
