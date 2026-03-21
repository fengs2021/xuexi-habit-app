<template>
  <div class="login-container">
    <div class="login-header">
      <h1>{{ VITE_APP_TITLE }}</h1>
      <p>培养好习惯，快乐成长</p>
    </div>

    <van-tabs v-model:active="activeTab">
      <van-tab title="家长登录" name="parent">
        <van-form @submit="handleParentLogin">
          <van-cell-group inset>
            <van-field
              v-model="parentForm.phone"
              label="手机号"
              placeholder="请输入手机号"
              :rules="[{ required: true, message: '请输入手机号' }]"
            />
            <van-field
              v-model="parentForm.password"
              type="password"
              label="密码"
              placeholder="请输入密码"
              :rules="[{ required: true, message: '请输入密码' }]"
            />
          </van-cell-group>
          <div style="margin: 16px;">
            <van-button round block type="primary" native-type="submit" :loading="loading">
              登录
            </van-button>
          </div>
        </van-form>
      </van-tab>

      <van-tab title="学生登录" name="child">
        <van-cell-group inset>
          <van-field
            v-model="inviteCode"
            label="邀请码"
            placeholder="请输入家庭邀请码"
            @update:model-value="loadChildren"
          />
        </van-cell-group>

        <van-cell-group inset title="选择学生" v-if="children.length > 0" style="margin-top: 12px;">
          <van-radio-group v-model="currentChildId">
            <van-cell
              v-for="child in children"
              :key="child.id"
              :title="child.nickname"
              :label="child.stars + ' ★'"
              clickable
              @click="selectChild(child)"
            >
              <template #right-icon>
                <van-radio :name="child.id" />
              </template>
            </van-cell>
          </van-radio-group>
        </van-cell-group>

        <div style="margin: 16px;">
          <van-button
            round
            block
            type="primary"
            :loading="loading"
            :disabled="!currentChildId"
            @click="doChildLogin"
          >
            登录
          </van-button>
        </div>
      </van-tab>
    </van-tabs>

    <van-dialog v-model:show="showRegister" title="家长注册" show-cancel-button @confirm="handleRegister">
      <van-form>
        <van-cell-group inset>
          <van-field v-model="registerForm.phone" label="手机号" placeholder="请输入手机号" />
          <van-field v-model="registerForm.password" type="password" label="密码" placeholder="请输入密码" />
          <van-field v-model="registerForm.nickname" label="昵称" placeholder="请输入昵称" />
          <van-field v-model="registerForm.inviteCode" label="邀请码" placeholder="可选填入邀请码加入家庭" />
        </van-cell-group>
      </van-form>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { registerParent } from '@/api/auth'
import axios from 'axios'
import { showToast, showConfirmDialog } from 'vant'
import { setToken } from '@/utils/auth'

const { VITE_APP_TITLE } = import.meta.env
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const activeTab = ref('parent')
const showRegister = ref(false)
const inviteCode = ref('')
const children = ref([])
const currentChildId = ref('')

const parentForm = reactive({ phone: '', password: '' })
const registerForm = reactive({ phone: '', password: '', nickname: '', inviteCode: '' })

const loadChildren = async (val) => {
  if (!val || val.length < 4) return
  try {
    const res = await axios.get('/api/family/by-code/' + val)
    if (res.data.code === 0) {
      children.value = res.data.data.children || []
      if (children.value.length === 1) {
        currentChildId.value = children.value[0].id
      }
    } else {
      showToast(res.data.message || '邀请码无效')
    }
  } catch (error) {
    console.error('loadChildren error:', error)
    showToast('加载失败')
  }
}

const selectChild = (child) => {
  currentChildId.value = child.id
}

const doChildLogin = async () => {
  console.log('doChildLogin called, currentChildId:', currentChildId.value)
  if (!currentChildId.value) {
    showToast('请选择学生')
    return
  }
  loading.value = true
  try {
    console.log('Sending login request with userId:', currentChildId.value)
    const res = await axios.post('/api/auth/login/device', { userId: currentChildId.value })
    console.log('Login response:', res.data)
    const data = res.data
    if (data.code === 0) {
      console.log('Login success, token:', data.data.token)
      userStore.token = data.data.token
      userStore.userInfo = data.data.user
      userStore.roles = [data.data.user.role]
      setToken(data.data.token)
      showToast('登录成功')
      router.push('/dashboard')
    } else {
      console.log('Login failed:', data.message)
      showToast(data.message || '登录失败')
    }
  } catch (error) {
    console.error('Login error:', error)
    showToast(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}

const handleParentLogin = async () => {
  console.log('handleParentLogin called, form:', parentForm)
  loading.value = true
  try {
    await userStore.loginParentAction(parentForm)
    router.push('/dashboard')
  } catch (error) {
    console.error('Login error:', error)
    showToast(error.message || '登录失败')
  } finally {
    loading.value = false
    console.log('handleParentLogin finally')
  }
}

const handleRegister = async () => {
  try {
    await registerParent(registerForm)
    showToast('注册成功')
    showRegister.value = false
  } catch (error) {
    showToast(error.message || '注册失败')
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}
.login-header {
  text-align: center;
  color: white;
  padding: 40px 0;
}
.login-header h1 {
  margin: 0;
  font-size: 28px;
}
.login-header p {
  margin: 10px 0 0;
  opacity: 0.9;
}
:deep(.van-tabs__content) {
  background: white;
  border-radius: 16px;
  padding: 16px;
  min-height: 300px;
}
</style>
