<template>
  <div class="login-page">
    <div class="header">
      <div class="logo">🎯</div>
      <h1>习惯养成</h1>
      <p>让孩子在快乐中成长</p>
    </div>
    <div class="form">
      <van-cell-group inset>
        <van-field v-model="nickname" label="昵称" placeholder="请输入昵称" />
        <van-field name="role" label="角色">
          <template #input>
            <van-radio-group v-model="role" direction="horizontal">
              <van-radio name="child">孩子</van-radio>
              <van-radio name="parent">家长</van-radio>
            </van-radio-group>
          </template>
        </van-field>
        <van-field v-if="role === 'parent'" v-model="phone" type="tel" label="手机号" placeholder="请输入手机号" />
        <van-field v-if="role === 'parent'" v-model="password" type="password" label="密码" placeholder="请输入密码" />
      </van-cell-group>
      <div class="tips" v-if="role === 'child'"><van-icon name="info-o" />首次登录将自动创建设备账号</div>
      <van-button type="primary" block round :loading="loading" @click="handleLogin">{{ role === 'child' ? '开始使用' : '登录' }}</van-button>
      <div class="register-link" v-if="role === 'parent'"><span>还没有账号？</span><van-button size="small" type="primary" plain hairline @click="showRegister = true">立即注册</van-button></div>
    </div>
    <van-popup v-model:show="showRegister" position="bottom" round style="height: 70%">
      <div class="register-popup">
        <h3>注册家长账号</h3>
        <van-form @submit="handleRegister">
          <van-cell-group inset>
            <van-field v-model="regForm.phone" type="tel" label="手机号" placeholder="请输入手机号" :rules="[{ required: true, message: '请输入手机号' }]" />
            <van-field v-model="regForm.password" type="password" label="密码" placeholder="请输入密码(6位以上)" :rules="[{ required: true, message: '请输入密码' }]" />
            <van-field v-model="regForm.nickname" label="昵称" placeholder="请输入家长昵称" :rules="[{ required: true, message: '请输入昵称' }]" />
            <van-field v-model="regForm.familyName" label="家庭名" placeholder="给家庭起个名字" />
          </van-cell-group>
          <div class="form-submit"><van-button round block type="primary" native-type="submit">注册</van-button></div>
        </van-form>
      </div>
    </van-popup>
  </div>
</template>
<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showFailToast } from 'vant'
import { useUserStore } from '../stores/user'
const router = useRouter()
const userStore = useUserStore()
const nickname = ref(''), phone = ref(''), password = ref(''), role = ref('child'), loading = ref(false), showRegister = ref(false)
const regForm = reactive({ phone: '', password: '', nickname: '', familyName: '' })
async function handleLogin() {
  if (!nickname.value.trim()) { showToast('请输入昵称'); return }
  loading.value = true
  try {
    if (role.value === 'child') {
      let deviceId = localStorage.getItem('deviceId')
      if (!deviceId) { deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9); localStorage.setItem('deviceId', deviceId) }
      await userStore.loginDevice({ deviceId, nickname: nickname.value.trim() })
    } else {
      if (!phone.value.trim()) { showToast('请输入手机号'); loading.value = false; return }
      if (!password.value) { showToast('请输入密码'); loading.value = false; return }
      await userStore.loginParent({ phone: phone.value.trim(), password: password.value })
    }
    showSuccessToast('登录成功')
    router.replace('/home')
  } catch (e) { showFailToast(e.message || '登录失败') }
  finally { loading.value = false }
}
async function handleRegister() {
  if (!regForm.phone || !regForm.password || !regForm.nickname) { showToast('请填写完整信息'); return }
  if (regForm.password.length < 6) { showToast('密码至少6位'); return }
  loading.value = true
  try {
    await userStore.registerParent({ phone: regForm.phone, password: regForm.password, nickname: regForm.nickname, familyName: regForm.familyName || '我的家庭' })
    showSuccessToast('注册成功')
    showRegister.value = false
    router.replace('/home')
  } catch (e) { showFailToast(e.message || '注册失败') }
  finally { loading.value = false }
}
</script>
<style scoped>
.login-page { min-height: 100vh; background: linear-gradient(180deg, #fff0f3 0%, #ffe4ec 100%); padding: 60px 24px 24px; }
.header { text-align: center; margin-bottom: 48px; }
.logo { font-size: 64px; margin-bottom: 16px; }
.header h1 { font-size: 28px; font-weight: 700; color: #333; margin-bottom: 8px; }
.header p { font-size: 14px; color: #666; }
.form { display: flex; flex-direction: column; gap: 16px; }
.tips { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 12px; color: #999; }
.register-link { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; color: #666; }
:deep(.van-button--primary) { background: linear-gradient(135deg, #ff6b9d 0%, #ff9a6c 100%); border: none; }
.register-popup { padding: 24px; }
.register-popup h3 { text-align: center; margin-bottom: 24px; font-size: 18px; color: #333; }
.form-submit { margin-top: 24px; padding: 0 16px; }
</style>
