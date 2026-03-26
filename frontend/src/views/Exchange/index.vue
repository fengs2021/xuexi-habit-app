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
                {{ getActionLabel(item) }}
              </van-tag>
              <span class="reward" v-if="item.action === 'complete'">+{{ item.stars_earned }} ★</span>
              <span class="reward" v-else-if="item.action === 'skipped'">跳过</span>
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

      <van-tab title="积分明细">
        <!-- 积分汇总 -->
        <van-cell-group inset title="积分概览" v-if="pointSummary">
          <van-cell title="当前余额" :value="pointSummary.currentBalance + ' ★'" />
          <van-cell title="累计获得" :value="'+' + pointSummary.totalEarned + ' ★'" value-class="earn-text" />
          <van-cell title="累计消费" :value="'-' + pointSummary.totalSpent + ' ★'" value-class="spend-text" />
        </van-cell-group>

        <!-- 积分明细列表 -->
        <van-cell-group inset title="收支记录">
          <van-cell v-for="item in pointLogs" :key="item.id">
            <template #title>
              <div class="point-item">
                <span class="child-name">[{{ item.childNickname || '未知' }}]</span>
                <span class="type-icon">{{ getTypeIcon(item.type) }}</span>
                <span class="type-name">{{ getTypeName(item.type) }}</span>
                <span class="desc">{{ item.description }}</span>
              </div>
            </template>
            <template #label>
              <span class="time">{{ formatDateTime(item.created_at) }}</span>
            </template>
            <template #value>
              <span :class="item.amount > 0 ? 'amount-plus' : 'amount-minus'">
                {{ item.amount > 0 ? '+' : '' }}{{ item.amount }} ★
              </span>
            </template>
          </van-cell>
          <van-loading v-if="pointLogsLoading" style="text-align: center; padding: 16px;" />
          <van-empty v-if="!pointLogsLoading && pointLogs.length === 0" description="暂无积分记录" />
        </van-cell-group>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getPendingApprovals, getApprovalHistory, approveTask as approveTaskApi, approveExchange as approveExchangeApi, reverseApproval as reverseApprovalApi } from '@/api/approval'
import { getChildPointLogs, getChildPointSummary } from '@/api/points'
import { getFamilyChildren } from '@/api/family'

import { showToast, showConfirmDialog } from 'vant'

const userStore = useUserStore()
const activeTab = ref(0)
const pendingTasks = ref([])
const pendingExchanges = ref([])
const processedTasks = ref([])
const processedExchanges = ref([])

// 积分明细相关
const children = ref([])
const selectedChildId = ref('')
const pointLogs = ref([])
const pointSummary = ref(null)
const pointLogsLoading = ref(false)

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
    // 只显示完成的任务，跳过的不要显示
    processedTasks.value = (data.tasks || []).filter(t => t.action === 'complete')
    processedExchanges.value = data.exchanges || []
  } catch (error) {
    showToast('加载失败')
  }
}

const loadChildren = async () => {
  try {
    const data = await getFamilyChildren()
    children.value = (data || []).map(c => ({
      text: c.nickname,
      value: c.id
    }))
    if (children.value.length > 0) {
      loadPointData() // 加载所有孩子的数据
    }
  } catch (error) {
    console.error('[DEBUG] Load children error:', error)
  }
}

const loadPointData = async () => {
  console.log('[DEBUG] loadPointData called, children.length:', children.value.length)
  if (children.value.length === 0) {
    console.log('[DEBUG] children is empty, returning early')
    return
  }
  
  pointLogsLoading.value = true
  try {
    // 并行加载所有孩子的积分明细
    const allLogs = []
    const allSummary = { totalEarned: 0, totalSpent: 0, currentBalance: 0 }
    
    for (const child of children.value) {
      try {
        console.log('[DEBUG] Loading logs for child:', child.text, child.value)
        const [logsRes, summaryRes] = await Promise.all([
          getChildPointLogs(child.value),
          getChildPointSummary(child.value)
        ])
        console.log('[DEBUG] logsRes:', logsRes ? 'has data' : 'null/undefined', 'items:', logsRes?.items?.length)
        // 为每条记录添加孩子名字
        const logsWithName = (logsRes?.items || []).map(log => ({
          ...log,
          childNickname: child.text
        }))
        allLogs.push(...logsWithName)
        
        if (summaryRes) {
          allSummary.totalEarned += summaryRes.totalEarned || 0
          allSummary.totalSpent += summaryRes.totalSpent || 0
          allSummary.currentBalance += summaryRes.currentBalance || 0
        }
      } catch (e) {
        console.error('[DEBUG] Error loading data for child:', child.text, e)
      }
    }
    
    console.log('[DEBUG] allLogs before sort:', allLogs.length)
    // 按时间排序（最新的在前）
    allLogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    
    pointLogs.value = allLogs
    pointSummary.value = allSummary
    console.log('[DEBUG] pointLogs set, length:', pointLogs.value.length)
  } catch (error) {
    console.error('[DEBUG] loadPointData error:', error)
    showToast('加载积分明细失败')
  } finally {
    pointLogsLoading.value = false
  }
}

const onChildChange = (value) => {
  selectedChildId.value = value
  loadPointData()
}

const getTypeIcon = (type) => {
  const icons = {
    signin: '📅',
    task_approve: '✅',
    achievement: '🏆',
    wheel: '🎡',
    exchange: '🎁',
    lottery: '🎰',
    deduct: '📉',
    adjust: '⚙️'
  }
  return icons[type] || '💰'
}

const getActionLabel = (item) => {
  if (item.approval_status === 'rejected') return '已拒绝'
  if (item.action === 'skipped') return '已跳过'
  if (item.action === 'complete') return '已完成'
  return '已批准'
}

const getTypeName = (type) => {
  const names = {
    signin: '签到',
    task_approve: '任务',
    achievement: '成就',
    wheel: '转盘',
    exchange: '兑换',
    lottery: '抽奖',
    deduct: '扣分',
    adjust: '调整'
  }
  return names[type] || '其他'
}

const approveTask = async (id, approved) => {
  try {
    await approveTaskApi(id, { approved })
    showToast(approved ? '已批准' : '已拒绝')
    await loadPending()
    await loadHistory()
    if (activeTab.value === 2) loadPointData()  // 刷新积分明细
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
    if (activeTab.value === 2) loadPointData()  // 刷新积分明细
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
    if (activeTab.value === 2) loadPointData()  // 刷新积分明细
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
  loadChildren()
})

// 当切换到积分明细标签时加载数据
watch(activeTab, (newVal) => {
  if (newVal === 2 && pointLogs.value.length === 0) {
    loadPointData()
  }
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

/* 积分明细样式 */
.point-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.point-item .child-name {
  color: #1989fa;
  font-weight: bold;
  font-size: 12px;
}
.point-item .type-icon {
  font-size: 16px;
}
.point-item .type-name {
  font-weight: bold;
  color: #333;
}
.point-item .desc {
  color: #666;
  font-size: 12px;
}
.amount-plus {
  color: #07c160;
  font-weight: bold;
}
.amount-minus {
  color: #ee0a24;
  font-weight: bold;
}
.earn-text {
  color: #07c160 !important;
}
.spend-text {
  color: #ee0a24 !important;
}
</style>
