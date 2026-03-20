<template>
  <div class="reward-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>奖励列表</span>
          <el-button v-if="userStore.isAdmin" type="primary" @click="showDialog = true">新增奖励</el-button>
        </div>
      </template>
      <el-table :data="rewardList" style="width: 100%">
        <el-table-column prop="title" label="奖励名称" />
        <el-table-column prop="starCost" label="所需星星" width="120">
          <template #default="{ row }">{{ row.starCost || row.star_cost }}⭐</template>
        </el-table-column>
        <el-table-column prop="rarity" label="稀有度" width="100">
          <template #default="{ row }">
            <el-tag :type="rarityType[row.rarity]">{{ rarityMap[row.rarity] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button v-if="!userStore.isAdmin" size="small" type="primary" @click="handleExchange(row)">兑换</el-button>
            <el-button v-if="userStore.isAdmin" size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showDialog" title="新增奖励" width="400px">
      <el-form :model="rewardForm" label-width="80px">
        <el-form-item label="奖励名称">
          <el-input v-model="rewardForm.title" placeholder="请输入奖励名称" />
        </el-form-item>
        <el-form-item label="所需星星">
          <el-input-number v-model="rewardForm.starCost" :min="1" :max="1000" />
        </el-form-item>
        <el-form-item label="稀有度">
          <el-select v-model="rewardForm.rarity" placeholder="请选择稀有度">
            <el-option label="普通" value="normal" />
            <el-option label="史诗" value="epic" />
            <el-option label="传说" value="legend" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getRewardList, createReward, deleteReward, createExchange } from '@/api/reward'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const rewardList = ref([])
const showDialog = ref(false)
const rewardForm = reactive({ title: '', starCost: 30, rarity: 'normal' })
const rarityType = { normal: 'info', epic: 'purple', legend: 'warning' }
const rarityMap = { normal: '普通', epic: '史诗', legend: '传说' }

onMounted(async () => {
  try {
    rewardList.value = await getRewardList()
  } catch (e) {
    console.error(e)
  }
})

async function handleCreate() {
  try {
    await createReward(rewardForm)
    ElMessage.success('创建成功')
    showDialog.value = false
    rewardList.value = await getRewardList()
  } catch (e) {
    ElMessage.error('创建失败')
  }
}

async function handleExchange(row) {
  try {
    await createExchange({ rewardId: row.id })
    ElMessage.success('兑换成功！等待家长审批')
  } catch (e) {
    ElMessage.error(e.message || '兑换失败')
  }
}

async function handleDelete(row) {
  try {
    await deleteReward(row.id)
    ElMessage.success('删除成功')
    rewardList.value = await getRewardList()
  } catch (e) {
    ElMessage.error(e.message || '删除失败')
  }
}
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
