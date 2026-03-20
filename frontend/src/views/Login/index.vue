<template>
  <div class="login-container">
    <div class="login-box">
      <h2 class="login-title">{{ VITE_APP_TITLE }}</h2>
      <el-tabs v-model="activeTab" type="card" class="login-tabs">
        <el-tab-pane label="家长登录" name="parent">
          <el-form :model="parentForm" :rules="parentRules" ref="parentFormRef" label-width="80px">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="parentForm.phone" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="parentForm.password" type="password" placeholder="请输入密码" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleParentLogin" :loading="loading" block>登录</el-button>
            </el-form-item>
            <el-form-item>
              <div class="register-tip">没有账号？<span @click="showRegister = true">去注册</span></div>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="学生登录" name="child">
          <el-form :model="childForm" :rules="childRules" ref="childFormRef" label-width="80px">
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="childForm.nickname" placeholder="请输入你的昵称" />
            </el-form-item>
            <el-form-item label="邀请码" prop="inviteCode">
              <el-input v-model="childForm.inviteCode" placeholder="请输入家庭邀请码" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleChildLogin" :loading="loading" block>登录</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="showRegister" title="家长注册" width="400px">
      <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" label-width="80px">
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="registerForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="registerForm.nickname" placeholder="请输入你的昵称" />
        </el-form-item>
        <el-form-item label="家庭名称" prop="familyName">
          <el-input v-model="registerForm.familyName" placeholder="请输入家庭名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRegister = false">取消</el-button>
        <el-button type="primary" @click="handleRegister" :loading="loading">注册</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { registerParent } from '@/api/auth'
import { ElMessage } from 'element-plus'

const VITE_APP_TITLE = import.meta.env.VITE_APP_TITLE
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const activeTab = ref('parent')
const showRegister = ref(false)

const parentFormRef = ref()
const parentForm = reactive({ phone: '', password: '' })
const parentRules = {
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const childFormRef = ref()
const childForm = reactive({ nickname: '', inviteCode: '' })
const childRules = {
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  inviteCode: [{ required: true, message: '请输入邀请码', trigger: 'blur' }]
}

const registerFormRef = ref()
const registerForm = reactive({ phone: '', password: '', nickname: '', familyName: '' })
const registerRules = {
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur', min: 6, message: '密码至少6位' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  familyName: [{ required: true, message: '请输入家庭名称', trigger: 'blur' }]
}

const handleParentLogin = async () => {
  await parentFormRef.value.validate()
  loading.value = true
  try {
    await userStore.loginParentAction(parentForm)
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } finally {
    loading.value = false
  }
}

const handleChildLogin = async () => {
  await childFormRef.value.validate()
  loading.value = true
  try {
    await userStore.loginChildAction({ deviceId: 'device_' + Date.now(), nickname: childForm.nickname, inviteCode: childForm.inviteCode })
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  await registerFormRef.value.validate()
  loading.value = true
  try {
    await registerParent(registerForm)
    ElMessage.success('注册成功，请登录')
    showRegister.value = false
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-box {
  width: 420px;
  background: #fff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}
.login-title {
  text-align: center;
  color: #409EFF;
  margin-bottom: 20px;
}
.login-tabs {
  margin-bottom: 20px;
}
.register-tip {
  text-align: center;
  color: #909399;
  font-size: 14px;
  span { color: #409EFF; cursor: pointer; }
}
</style>
