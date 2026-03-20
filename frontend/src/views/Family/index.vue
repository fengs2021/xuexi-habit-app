<template>
  <div class="family-page">
    <van-cell-group inset title="家庭信息">
      <van-cell title="家庭名称" :value="familyInfo?.name || ''" />
      <van-cell title="邀请码" :value="familyInfo?.code || ''" v-if="userStore.isAdmin" />
    </van-cell-group>

    <van-cell-group inset title="家庭成员">
      <van-cell
        v-for="member in familyInfo?.members || []"
        :key="member.id"
        :title="member.nickname"
        :label="member.role === 'admin' ? '家长' : '学生'"
      >
        <template #right-icon>
          <span>{{ member.stars || 0 }} ★</span>
        </template>
      </van-cell>
    </van-cell-group>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getFamily } from '@/api/family'
import { showToast } from 'vant'

const userStore = useUserStore()
const familyInfo = ref(null)

const loadFamily = async () => {
  try {
    const data = await getFamily()
    familyInfo.value = data
  } catch (error) {
    showToast('加载失败')
  }
}

onMounted(async () => {
  if (!userStore.userInfo) {
    await userStore.getUserInfoAction()
  }
  await loadFamily()
})
</script>

<style scoped>
.family-page {
  padding-bottom: 20px;
}
</style>
