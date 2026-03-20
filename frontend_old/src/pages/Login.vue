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
          placeholder="请输入昵称"
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
        
        <van-field
          v-if="role === 'parent'"
          v-model="phone"
          type="tel"
          label="手机号"
          placeholder="请输入手机号"
        />
        <van-field
          v-if="role === 'parent'"
          v-model="password"
          type="password"
          label="密码"
          placeholder="请输入密码"
        />
      </van-cell-group>

      <div class="login-tips">
        <van-icon name="info-o" />
        <span v-if="role === 'child'">使用设备ID自动登录</span>
        <span v-else>使用手机号密码登录</span>
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
      
      <div class="register-link" v-if="role === 'parent'">
        <span>还没有账号？</span>
        <van-button size="small" type="primary" plain hairline @click="showRegister = true">立即注册</van-button>
      </div>
    </div>

    <!-- 注册弹窗 -->
    <van-popup v-model:show="showRegister" position="bottom" round style="height: 60%">
      <div class="register-popup">
        <h3>注册家长账号</h3>
        <van-form @submit="handleRegister">
          <van-cell-group inset>
            <van-field
              v-model="registerForm.phone"
              type="tel"
              label="手机号"
              placeholder="请输入手机号"
              :rules="[{ required: true, message: '请输入手机号' }]"
            />
            <van-field
              v-model="registerForm.password"
              type="password"
              label="密码"
              placeholder="请输入密码(6位以上)"
              :rules="[{ required: true, message: '请输入密码' }]"
            />
            <van-field
              v-model="registerForm.nickname"
              label="昵称"
              placeholder="请输入家长昵称"
              :rules="[{ required: true, message: '请输入昵称' }]"
            />
            <van-field
              v-model="registerForm.familyName"
              label="家庭名"
              placeholder="给家庭起个名字"
            />
          </van-cell-group>
          <div class="form-submit">
            <van-button round block type="primary" native-type="submit">
              注册
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const nickname = ref('')
const phone = ref('')
const password = ref('')
const role = ref('child')
const loading = ref(false)
const showRegister = ref(false)

const registerForm = reactive({
  phone: '',
  password: '',
  nickname: '',
  familyName: ''
})

async function handleLogin() {
  if (role.value === 'child') {
    // 孩子登录 - 使用设备ID
    let deviceId = localStorage.getItem('deviceId')
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('deviceId', deviceId)
    }
    
    loading.value = true
    try {
      await userStore.loginDevice({ deviceId })
      showSuccessToast('登录成功')
      const hasGuide = localStorage.getItem('hasGuide')
      router.replace(hasGuide ? '/home' : '/guide')
    } catch (error) {
      showToast(error.message || '登录失败')
    } finally {
      loading.value = false
    }
  } else {
    // 家长登录 - 使用手机号密码
    if (!phone.value.trim()) {
      showToast('请输入手机号')
      return
    }
    if (!password.value) {
      showToast('请输入密码')
      return
    }
    
    loading.value = true
    try {
      await userStore.loginParent({
        phone: phone.value.trim(),
        password: password.value
      })
      showSuccessToast('登录成功')
      router.replace('/home')
    } catch (error) {
      showToast(error.message || '登录失败')
    } finally {
      loading.value = false
    }
  }
}

async function handleRegister() {
  if (!registerForm.phone || !registerForm.password || !registerForm.nickname) {
    showToast('请填写完整信息')
    return
  }
  if (registerForm.password.length < 6) {
    showToast('密码至少6位')
    return
  }
  
  loading.value = true
  try {
    await userStore.registerParent({
      phone: registerForm.phone,
      password: registerForm.password,
      nickname: registerForm.nickname,
      familyName: registerForm.familyName || '我的家庭'
    })
    showSuccessToast('注册成功')
    showRegister.value = false
    router.replace('/home')
  } catch (error) {
    showToast(error.message || '注册失败')
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
  gap: 16px;
}

.login-tips {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  color: #999;
}

.register-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.login-form :deep(.van-button--primary) {
  background: linear-gradient(135deg, #ff6b9d 0%, #ff9a6c 100%);
  border: none;
}

.register-popup {
  padding: 24px;
}

.register-popup h3 {
  text-align: center;
  margin-bottom: 24px;
  font-size: 18px;
  color: #333;
}

.form-submit {
  margin-top: 24px;
  padding: 0 16px;
}

.form-submit :deep(.van-button--primary) {
  background: linear-gradient(135deg, #ff6b9d 0%, #ff9a6c 100%);
  border: none;
}
</style>
