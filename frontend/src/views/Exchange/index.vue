<template>
  <div class="exchange-page">
    
    <van-tabs v-model:active="activeTab">
      <van-tab title="待审批" :badge="pendingCount || null">
        <!-- 任务完成审批 -->
        <van-cell-group inset title="任务完成">
          <van-cell v-for="item in pendingTasks" :key="item.id">
            <template #title>
              <div class="approval-item">
                <span class="name">{{ item.user_nickname }}</span>
                <span class="action">完成了</span>
                <span class="target">{{ item.task_title }}</span>
              </div>
            </template>
            <template #label>
              <span class="reward">+{{ item.stars_earned || item.star_reward }} ★</span>
              <span class="time">{{ formatDateTime(item.created_at) }}</span>
            </template>
            <template #right-icon>
              <van-button size="small" type="success" @click="approveTask(item.id, true)">同意</van-button>
              <van-button size="small" type="danger" @click="approveTask(item.id, false)">拒绝</van-button>
            </template>
          </van-cell>
          <van-empty v-if="pendingTasks.length === 0" description="暂无待审批任务" />
        </van-cell-group>

        <!-- 奖励兑换审批 -->
        <van-cell-group inset title="奖励兑换">
          <van-cell v-for="item in pendingExchanges" :key="item.id">
            <template #title>
              <div class="approval-item">
                <span class="name">{{ item.user_nickname }}</span>
                <span class="action">申请兑换</span>
                <span class="target">{{ item.reward_title }}</span>
              </div>
            </template>
            <template #label>
              <span class="reward">-{{ item.stars_spent || item.star_cost }} ★</span>
              <span class="time">{{ formatDateTime(item.created_at) }}</span>
            </template>
            <template #right-icon>
              <van-button size="small" type="success" @click="approveExchange(item.id, true)">同意</van-button>
              <van-button size="small" type="danger" @click="approveExchange(item.id, false)">拒绝</van-button>
            </template>
          </van-cell>
          <van-empty v-if="pendingExchanges.length === 0" description="暂无待审批兑换" />
        </van-cell-group>
      </van-tab>

      <van-tab title="已处理">
        <van-cell-group inset title="任务历史">
          <van-cell v-for="item in processedTasks" :key="item.id">
            <template #title>
              <div class="approval-item">
                <span class="name">{{ item.user_nickname }}</span>
                <span class="target">{{ item.task_title }}</span>
              </div>
            </template>
            <template #label>
              <van-tag :type="item.approval_status === 'approved' ? 'success' : 'danger'">
                {{ item.approval_status === 'approved' ? '已批准' : '已拒绝' }}
              </van-tag>
              <span class="reward" v-if="item.approval_status === 'approved'">+{{ item.stars_earned }} ★</span>
              <span class="time">{{ formatDateTime(item.created_at) }}</span>
            </template>
            <template #right-icon>
              <van-button size="small" type="warning" @click="reverseApproval(item.id, 'task')">撤销</van-button>
            </template>
          </van-cell>
          <van-empty v-if="processedTasks.length === 0" description="暂无任务历史" />
        </van-cell-group>

        <van-cell-group inset title="兑换历史">
          <van-cell v-for="item in processedExchanges" :key="item.id">
            <template #title>
              <div class="approval-item">
                <span class="name">{{ item.user_nickname }}</span>
                <span class="target">{{ item.reward_title }}</span>
              </div>
            </template>
            <template #label>
              <van-tag :type="item.status === 'approved' ? 'success' : 'danger'">
                {{ item.status === 'approved' ? '已批准' : '已拒绝' }}
              </van-tag>
              <span class="reward" v-if="item.status === 'approved'">-{{ item.stars_spent }} ★</span>
              <span class="time">{{ formatDateTime(item.created_at) }}</span>
            </template>
            <template #right-icon>
              <van-button size="small" type="warning" @click="reverseApproval(item.id, 'exchange')" v-if="item.status !== 'pending'">撤销</van-button>
            </template>
          </van-cell>
          <van-empty v-if="processedExchanges.length === 0" description="暂无兑换历史" />
        </van-cell-group>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getPendingApprovals, getApprovalHistory, approveTask as approveTaskApi, approveExchange as approveExchangeApi, reverseApproval as reverseApprovalApi } from '@/api/approval'

import { showToast, showConfirmDialog } from 'vant'

const userStore = useUserStore()
const activeTab = ref(0)
const pendingTasks = ref([])
const pendingExchanges = ref([])
const processedTasks = ref([])
const processedExchanges = ref([])

const pendingCount = computed(() => pendingTasks.value.length + pendingExchanges.value.length)

const loadPending = async () => {
  try {
    const data = await getPendingApprovals()
    pendingTasks.value = data.tasks || []
    pendingExchanges.value = data.exchanges || []
  } catch (error) {
    showToast('加载失败')
  }
}

const loadHistory = async () => {
  try {
    const data = await getApprovalHistory()
    processedTasks.value = data.tasks || []
    processedExchanges.value = data.exchanges || []
  } catch (error) {
    showToast('加载失败')
  }
}

const approveTask = async (id, approved) => {
  try {
    await approveTaskApi(id, { approved })
    showToast(approved ? '已批准' : '已拒绝')
    await loadPending()
    await loadHistory()  // 刷新已处理列表
  } catch (error) {
    showToast('操作失败')
  }
}

const approveExchange = async (id, approved) => {
  try {
    await approveExchangeApi(id, { approved })
    showToast(approved ? '已批准' : '已拒绝')
    await loadPending()
    await userStore.getUserInfoAction()
  } catch (error) {
    showToast('操作失败')
  }
}

const reverseApproval = async (id, type) => {
  await showConfirmDialog({ title: '确认撤销', message: '确定要撤销该审批吗？' })
  try {
    await reverseApprovalApi(id, type)
    showToast('已撤销')
    await loadHistory()
    await loadPending()
    await userStore.getUserInfoAction()
  } catch (error) {
    showToast('撤销失败')
  }
}

const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const formatDateTime = (time) => {
  if (!time) return ''
  const d = new Date(time)
  return d.getMonth() + 1 + '月' + d.getDate() + '日 ' + weekdays[d.getDay()] + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}
onMounted(() => {
  loadPending()
  loadHistory()
})
</script>

<style scoped>
.exchange-page {
  padding-bottom: 20px;
}
.approval-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
.approval-item .name {
  font-weight: bold;
}
.approval-item .action {
  color: #666;
}
.approval-item .target {
  color: #1989fa;
}
.approval-item .reward {
  color: #ff976a;
  font-weight: bold;
  margin-left: 8px;
}
.approval-item .time {
  color: #999;
  font-size: 12px;
  margin-left: 8px;
}
</style>
