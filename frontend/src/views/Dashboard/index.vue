<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="welcome-card">
          <div class="welcome-content">
            <div class="welcome-text">
              <h2>欢迎回来，{{ userStore.userInfo?.nickname }}！</h2>
              <p class="role-tag">{{ userStore.isAdmin ? '家长' : '学生' }}</p>
            </div>
            <div class="stars-display">
              <span class="stars-icon">⭐</span>
              <span class="stars-count">{{ familyInfo?.members?.[0]?.stars || 0 }}</span>
              <span class="stars-label">星星</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon" color="#67C23A"><List /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ taskStats.total }}</div>
              <div class="stat-label">总任务</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon" color="#409EFF"><Check /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ taskStats.completed }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon" color="#F56C6C"><Close /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ taskStats.pending }}</div>
              <div class="stat-label">待审批</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>快捷操作</span>
            </div>
          </template>
          <div class="quick-actions">
            <el-button type="primary" @click="router.push('/task')">任务管理</el-button>
            <el-button type="success" @click="router.push('/reward')">奖励兑换</el-button>
            <el-button v-if="userStore.isAdmin" type="warning" @click="router.push('/exchange')">审批兑换</el-button>
            <el-button type="info" @click="router.push('/family')">家庭管理</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="recent-row">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>Recent Tasks</span>
            </div>
          </template>
          <el-table :data="recentTasks" style="width: 100%">
            <el-table-column prop="title" label="任务名称" />
            <el-table-column prop="starReward" label="奖励" width="80">
              <template #default="{ row }">{{ row.starReward || row.star_reward }}⭐</template>
            </el-table-column>
            <el-table-column prop="rarity" label="稀有度" width="80">
              <template #default="{ row }">
                <el-tag :type="rarityType[row.rarity]">{{ row.rarity }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { getTaskList } from '@/api/task'
import { getFamily } from '@/api/family'

const router = useRouter()
const userStore = useUserStore()

const familyInfo = ref(null)
const recentTasks = ref([])

const taskStats = computed(() => {
  const list = recentTasks.value
  return {
    total: list.length,
    completed: list.filter(t => t.isCompleted).length,
    pending: list.filter(t => !t.isCompleted).length
  }
})

const rarityType = { N: 'info', R: '', SR: 'warning', SSR: 'danger' }

onMounted(async () => {
  try {
    const [taskRes, familyRes] = await Promise.all([
      getTaskList(),
      getFamily()
    ])
    recentTasks.value = taskRes.slice(0, 5)
    familyInfo.value = familyRes
  } catch (e) {
    console.error(e)
  }
})
</script>

<style scoped>
.dashboard { padding: 20px; }
.welcome-card { margin-bottom: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; }
.welcome-content { display: flex; justify-content: space-between; align-items: center; }
.welcome-text h2 { margin: 0 0 8px 0; font-size: 24px; }
.role-tag { display: inline-block; padding: 4px 12px; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 12px; }
.stars-display { text-align: center; }
.stars-icon { font-size: 32px; display: block; }
.stars-count { font-size: 36px; font-weight: bold; }
.stars-label { font-size: 14px; opacity: 0.8; }
.stats-row { margin: 20px 0; }
.stat-card { text-align: center; }
.stat-content { display: flex; align-items: center; justify-content: center; gap: 12px; }
.stat-icon { font-size: 32px; }
.stat-value { font-size: 28px; font-weight: bold; color: #303133; }
.stat-label { font-size: 14px; color: #909399; }
.card-header { font-weight: bold; }
.quick-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.recent-row { margin-top: 20px; }
</style>
