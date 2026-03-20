<template>
  <div class="family-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>家庭信息</span>
          <el-button type="primary" @click="handleGenerateCode">生成邀请码</el-button>
        </div>
      </template>
      <div class="family-info" v-if="familyInfo">
        <div class="info-item">
          <span class="label">家庭名称</span>
          <span class="value">{{ familyInfo.name }}</span>
        </div>
        <div class="info-item">
          <span class="label">邀请码</span>
          <span class="value code">{{ familyInfo.code }}</span>
        </div>
      </div>
    </el-card>

    <el-card class="members-card">
      <template #header>
        <span>家庭成员</span>
      </template>
      <el-table :data="familyInfo?.members" style="width: 100%">
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">{{ row.role === 'admin' ? '家长' : '学生' }}</template>
        </el-table-column>
        <el-table-column prop="stars" label="星星数" width="100">
          <template #default="{ row }">{{ row.stars }}⭐</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getFamily, generateInviteCode } from '@/api/family'
import { ElMessage } from 'element-plus'

const familyInfo = ref(null)

onMounted(async () => {
  try {
    familyInfo.value = await getFamily()
  } catch (e) {
    console.error(e)
  }
})

async function handleGenerateCode() {
  try {
    const res = await generateInviteCode()
    familyInfo.value.code = res.code
    ElMessage.success('邀请码已生成：' + res.code)
  } catch (e) {
    ElMessage.error('生成失败')
  }
}
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.family-info { padding: 20px 0; }
.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}
.info-item .label { color: #909399; }
.info-item .value { font-weight: bold; }
.info-item .code { color: #409EFF; font-size: 18px; letter-spacing: 2px; }
.members-card { margin-top: 20px; }
</style>
