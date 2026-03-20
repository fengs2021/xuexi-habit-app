<template>
  <div class="settings-page">
    <UserHeader :user-info="currentChild" />

    <!-- 家庭信息 -->
    <van-cell-group inset class="section">
      <van-cell title="当前身份" is-link @click="showIdentity = true">
        <template #value>
          <span>{{ currentChild?.nickname }} ({{ currentChild?.role === 'parent' ? '家长' : '孩子' }})</span>
        </template>
      </van-cell>
      <van-cell title="家庭名称" is-link :value="familyInfo?.name" @click="showFamilyName = true" />
    </van-cell-group>

    <!-- 宝贝档案 -->
    <van-cell-group inset title="宝贝档案" class="section">
      <van-cell
        v-for="member in familyMembers"
        :key="member.id"
        :title="member.nickname"
        :value="`Lv.${member.level}`"
        :is-link="member.role === 'child'"
        @click="onMemberClick(member)"
      >
        <template #icon>
          <van-image round width="32" height="32" :src="member.avatar" style="margin-right: 12px" />
        </template>
      </van-cell>
      <van-cell title="添加" is-link @click="showAddMember = true">
        <template #icon>
          <div class="add-icon">+</div>
        </template>
      </van-cell>
    </van-cell-group>

    <!-- 系统工具 -->
    <van-cell-group inset title="系统工具" class="section">
      <van-cell title="重置今日" is-link @click="onResetToday">
        <template #icon>
          <van-icon name="replay" style="margin-right: 12px" />
        </template>
      </van-cell>
      <van-cell title="备份恢复" is-link @click="onBackup">
        <template #icon>
          <van-icon name="description" style="margin-right: 12px" />
        </template>
      </van-cell>
      <van-cell title="音效" is-link>
        <template #icon>
          <van-icon name="volume-o" style="margin-right: 12px" />
        </template>
        <template #value>
          <van-switch v-model="soundEnabled" size="20" />
        </template>
      </van-cell>
    </van-cell-group>

    <!-- 关于 -->
    <van-cell-group inset class="section">
      <van-cell title="版本" value="1.0.0" />
    </van-cell-group>

    <!-- 编辑家庭名称弹窗 -->
    <van-dialog
      v-model:show="showFamilyName"
      title="编辑家庭名称"
      show-cancel-button
      @confirm="saveFamilyName"
    >
      <van-field v-model="familyNameInput" placeholder="请输入家庭名称" />
    </van-dialog>

    <!-- 添加成员弹窗 -->
    <van-popup v-model:show="showAddMember" position="bottom" round>
      <div class="popup-content">
        <div class="popup-header">
          <span>添加宝贝</span>
          <van-icon name="close" @click="showAddMember = false" />
        </div>
        <van-form @submit="handleAddMember">
          <van-field
            v-model="newMember.nickname"
            label="昵称"
            placeholder="请输入孩子昵称"
            :rules="[{ required: true, message: '请输入昵称' }]"
          />
          <div style="padding: 16px">
            <van-button type="primary" block round native-type="submit">
              添加
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { showToast, showSuccessToast, showConfirmDialog } from 'vant'
import UserHeader from '../components/UserHeader.vue'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'

const router = useRouter()
const userStore = useUserStore()

const showFamilyName = ref(false)
const showAddMember = ref(false)
const showIdentity = ref(false)
const soundEnabled = ref(true)
const familyNameInput = ref('')
const newMember = ref({ nickname: '' })

const currentChild = computed(() => userStore.currentChild)
const familyInfo = computed(() => userStore.familyInfo)
const familyMembers = computed(() =>
  (userStore.familyInfo?.members || []).filter(m => m.role === 'child')
)

onMounted(async () => {
  await userStore.fetchFamily()
  familyNameInput.value = familyInfo.value?.name || ''
})

function onMemberClick(member) {
  if (member.role !== 'child') return
  // 切换当前孩子
}

async function saveFamilyName() {
  try {
    await userStore.updateFamily({ name: familyNameInput.value })
    showSuccessToast('保存成功')
  } catch (error) {
    showToast('保存失败')
  }
}

async function handleAddMember() {
  try {
    // 调用 API 添加成员
    showSuccessToast('添加成功')
    showAddMember.value = false
    newMember.value = { nickname: '' }
    await userStore.fetchFamily()
  } catch (error) {
    showToast('添加失败')
  }
}

async function onResetToday() {
  try {
    await showConfirmDialog({
      title: '确认重置',
      message: '确定要重置今日数据吗？'
    })
    showSuccessToast('已重置')
  } catch {
    // 取消
  }
}

function onBackup() {
  showToast('功能开发中')
}
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: #fff0f3;
  padding-bottom: 80px;
}

.section {
  margin-bottom: 12px;
}

.add-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px dashed #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #9ca3af;
  margin-right: 12px;
}

.popup-content {
  height: 300px;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #eee;
}
</style>
