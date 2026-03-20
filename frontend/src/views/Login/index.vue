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
          <div class="register-tip">
            没有账号？<span @click="showRegister = true">去注册</span>
          </div>
        </van-form>
      </van-tab>

      <van-tab title="学生登录" name="child">
        <van-form @submit="handleChildLogin">
          <van-cell-group inset>
            <van-field
              v-model="inviteCode"
              label="邀请码"
              placeholder="请输入家庭邀请码"
              :rules="[{ required: true, message: '请输入邀请码' }]"
              @change="loadChildren"
            />
          </van-cell-group>

          <van-cell-group inset title="选择学生" v-if="children.length > 0">
            <van-radio-group v-model="selectedChildId">
              <van-cell-group>
                <van-cell
                  v-for="child in children"
                  :key="child.id"
                  clickable
                  @click="selectedChildId = child.id"
                >
                  <template #title>
                    <span class="child-name">{{ child.nickname }}</span>
                  </template>
                  <template #label>
                    <span class="child-stars">{{ child.stars || 0 }} ★</span>
                  </template>
                  <template #right-icon>
                    <van-radio :name="child.id" />
                  </template>
                </van-cell>
              </van-cell-group>
            </van-radio-group>
          </van-cell-group>

          <div style="margin: 16px;">
            <van-button
              round
              block
              type="primary"
              native-type="submit"
              :loading="loading"
              :disabled="!selectedChildId"
            >
              登录
            </van-button>
          </div>
        </van-form>
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
import { registerParent, loginParent } from '@/api/auth'
import { showToast } from 'vant'
import axios from 'axios'

const { VITE_APP_TITLE } = import.meta.env
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const activeTab = ref('parent')
const showRegister = ref(false)
const inviteCode = ref('')
const children = ref([])
const selectedChildId = ref(null)

const parentForm = reactive({ phone: '', password: '' })
const registerForm = reactive({ phone: '', password: '', nickname: '', familyName: '' })

const loadChildren = async () => {
  if (inviteCode.value.length < 4) return
  try {
    const res = await axios.get(`/api/family/by-code/${inviteCode.value}`)
    if (res.data.code === 0) {
      children.value = res.data.data.children || []
      if (children.value.length === 1) {
        selectedChildId.value = children.value[0].id
      } else {
        selectedChildId.value = null
      }
    } else {
      children.value = []
      selectedChildId.value = null
    }
  } catch (error) {
    children.value = []
    selectedChildId.value = null
  }
}

const handleParentLogin = async () => {
  loading.value = true
  try {
    await userStore.loginParentAction(parentForm)
    showToast('登录成功')
    router.push('/dashboard')
  } catch (error) {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false
  }
}

const handleChildLogin = async () => {
  if (!selectedChildId.value) {
    showToast('请选择学生')
    return
  }
  loading.value = true
  try {
    const res = await axios.post('/api/auth/login/device', { userId: selectedChildId.value })
    const data = res.data
    if (data.code === 0) {
      userStore.token = data.data.token
      userStore.userInfo = data.data.user
      userStore.roles = [data.data.user.role]
      showToast('登录成功')
      router.push('/dashboard')
    } else {
      showToast(data.message || '登录失败')
    }
  } catch (error) {
    showToast(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  loading.value = true
  try {
    await registerParent(registerForm)
    showToast('注册成功，请登录')
    showRegister.value = false
  } catch (error) {
    showToast(error.message || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60px 20px;
}
.login-header {
  text-align: center;
  color: #fff;
  margin-bottom: 40px;
}
.login-header h1 {
  font-size: 32px;
  margin-bottom: 8px;
}
.login-header p {
  font-size: 14px;
  opacity: 0.8;
}
.register-tip {
  text-align: center;
  font-size: 14px;
  color: #666;
}
.register-tip span {
  color: #409eff;
  cursor: pointer;
}
.child-name {
  font-size: 16px;
  font-weight: bold;
}
.child-stars {
  color: #ff976a;
}
</style>
