<template>
  <div class="login-page">
    <div class="login-header">
      <div class="logo">🎯</div>
      <h1>习惯养成</h1>
      <p>让孩子在快乐中成长</p>
    </div>

    <div class="login-form">
      <van-cell-group inset>
        <van-field
          v-model="nickname"
          label="昵称"
          placeholder="请输入孩子昵称"
          :rules="[{ required: true, message: '请输入昵称' }]"
        />
        <van-field name="role" label="角色">
          <template #input>
            <van-radio-group v-model="role" direction="horizontal">
              <van-radio name="child">孩子</van-radio>
              <van-radio name="parent">家长</van-radio>
            </van-radio-group>
          </template>
        </van-field>
      </van-cell-group>

      <div class="login-tips">
        <van-icon name="info-o" />
        <span>首次登录将自动创建设备账号</span>
      </div>

      <van-button
        type="primary"
        block
        round
        :loading="loading"
        @click="handleLogin"
      >
        开始使用
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const nickname = ref('')
const role = ref('child')
const loading = ref(false)

async function handleLogin() {
  if (!nickname.value.trim()) {
    showToast('请输入昵称')
    return
  }

  loading.value = true
  try {
    // 获取设备ID
    let deviceId = localStorage.getItem('deviceId')
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('deviceId', deviceId)
    }

    await userStore.register({
      nickname: nickname.value.trim(),
      role: role.value,
      deviceId
    })

    showSuccessToast('登录成功')
    
    // 检查是否需要新手引导
    const hasGuide = localStorage.getItem('hasGuide')
    router.replace(hasGuide ? '/home' : '/guide')
  } catch (error) {
    showToast(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #fff0f3 0%, #ffe4ec 100%);
  padding: 60px 24px 24px;
  display: flex;
  flex-direction: column;
}

.login-header {
  text-align: center;
  margin-bottom: 48px;
}

.logo {
  font-size: 64px;
  margin-bottom: 16px;
}

.login-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.login-header p {
  font-size: 14px;
  color: #666;
}

.login-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.login-tips {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  color: #999;
}

.login-form :deep(.van-button--primary) {
  background: linear-gradient(135deg, #ff6b9d 0%, #ff9a6c 100%);
  border: none;
}
</style>
