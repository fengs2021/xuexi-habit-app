<template>
  <div class="exchange-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>兑换审批</span>
          <el-button type="primary" @click="loadData">刷新</el-button>
        </div>
      </template>
      <el-table :data="pendingList" style="width: 100%" v-if="pendingList.length > 0">
        <el-table-column prop="child_nickname" label="申请人" width="120" />
        <el-table-column prop="reward_title" label="奖励名称" />
        <el-table-column prop="stars_spent" label="消耗星星" width="120">
          <template #default="{ row }">{{ row.stars_spent }}⭐</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]">{{ statusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" type="success" @click="handleApprove(row)">批准</el-button>
            <el-button size="small" type="danger" @click="handleReject(row)">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无待审批的兑换申请" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getPendingExchanges, approveExchange } from '@/api/reward'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const pendingList = ref([])
const statusMap = { pending: '待审批', approved: '已批准', rejected: '已拒绝' }
const statusType = { pending: 'warning', approved: 'success', rejected: 'danger' }

onMounted(async () => {
  await loadData()
})

async function loadData() {
  try {
    pendingList.value = await getPendingExchanges()
  } catch (e) {
    console.error(e)
  }
}

async function handleApprove(row) {
  try {
    await approveExchange(row.id, { comment: '批准' })
    ElMessage.success('已批准')
    await loadData()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

async function handleReject(row) {
  try {
    await approveExchange(row.id, { comment: '拒绝' })
    ElMessage.success('已拒绝')
    await loadData()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
