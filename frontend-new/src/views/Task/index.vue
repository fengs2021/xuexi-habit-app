<template>
  <div class="task-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>任务列表</span>
          <el-button v-if="userStore.isAdmin" type="primary" @click="showDialog = true">新增任务</el-button>
        </div>
      </template>
      <el-table :data="taskList" style="width: 100%">
        <el-table-column prop="title" label="任务名称" />
        <el-table-column prop="starReward" label="奖励星星" width="100">
          <template #default="{ row }">{{ row.starReward || row.star_reward }}⭐</template>
        </el-table-column>
        <el-table-column prop="rarity" label="稀有度" width="100">
          <template #default="{ row }">
            <el-tag :type="rarityType[row.rarity]">{{ row.rarity }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="frequency" label="频率" width="100">
          <template #default="{ row }">{{ row.frequency === 'daily' ? '每日' : '每周' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" v-if="!userStore.isAdmin">
          <template #default="{ row }">
            <el-button size="small" type="success" @click="handleComplete(row)">完成</el-button>
            <el-button size="small" @click="handleSkip(row)">跳过</el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" v-else>
          <template #default="{ row }">
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showDialog" title="新增任务" width="400px">
      <el-form :model="taskForm" label-width="80px">
        <el-form-item label="任务名称">
          <el-input v-model="taskForm.title" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="奖励星星">
          <el-input-number v-model="taskForm.starReward" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="稀有度">
          <el-select v-model="taskForm.rarity" placeholder="请选择稀有度">
            <el-option label="N" value="N" />
            <el-option label="R" value="R" />
            <el-option label="SR" value="SR" />
            <el-option label="SSR" value="SSR" />
          </el-select>
        </el-form-item>
        <el-form-item label="频率">
          <el-select v-model="taskForm.frequency" placeholder="请选择频率">
            <el-option label="每日" value="daily" />
            <el-option label="每周" value="weekly" />
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
import { getTaskList, createTask, completeTask, skipTask, deleteTask } from '@/api/task'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const taskList = ref([])
const showDialog = ref(false)
const taskForm = reactive({ title: '', starReward: 2, rarity: 'N', frequency: 'daily' })
const rarityType = { N: 'info', R: '', SR: 'warning', SSR: 'danger' }

onMounted(async () => {
  await loadData()
})

async function loadData() {
  try {
    taskList.value = await getTaskList()
  } catch (e) {
    console.error(e)
  }
}

async function handleCreate() {
  try {
    await createTask(taskForm)
    ElMessage.success('创建成功')
    showDialog.value = false
    await loadData()
  } catch (e) {
    ElMessage.error('创建失败')
  }
}

async function handleComplete(row) {
  try {
    await completeTask(row.id)
    ElMessage.success('任务完成！获得 ' + (row.starReward || row.star_reward) + ' 星星')
    await loadData()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

async function handleSkip(row) {
  try {
    await skipTask(row.id)
    ElMessage.success('已跳过')
    await loadData()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

async function handleDelete(row) {
  try {
    await deleteTask(row.id)
    ElMessage.success('删除成功')
    await loadData()
  } catch (e) {
    ElMessage.error(e.message || '删除失败')
  }
}
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
