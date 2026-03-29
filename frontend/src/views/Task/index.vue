<template>
  <div class="task-page">
    
    <van-button v-if="userStore.isAdmin" type="primary" block class="add-btn" @click="showCreate = true">
      创建新任务
    </van-button>
    <van-button v-if="userStore.isAdmin" type="warning" block class="deduct-btn" @click="openDeductDialog">
      直接扣分
    </van-button>

    <!-- 家长视图 -->
    <van-tabs v-if="userStore.isAdmin" v-model:active="activeTab">
      <van-tab title="每日任务">
        <van-cell-group inset title="每日任务列表">
          <van-cell v-for="task in dailyTasks" :key="task.id">
            <template #title>
              <van-field v-model="task.title" style="padding: 0;" @blur="updateTask(task)" />
            </template>
            <template #label>
              <div class="task-edit-row">
                <span>类型：</span>
                <van-tag :type="task.frequency === 'daily' ? 'primary' : task.frequency === 'weekly' ? 'success' : 'warning'" 
                         @click="cycleFrequency(task)" size="small" style="cursor:pointer">
                  {{ task.frequency === 'daily' ? '每日' : task.frequency === 'weekly' ? '每周' : '特殊' }}
                </van-tag>
              </div>
              <div class="task-edit-row">
                <span>星级：</span>
                <van-stepper v-model="task.starReward" integer min="1" max="99" @change="updateTask(task)" />
              </div>
              <div class="student-status-row">
                <span class="completed">已完成：{{ getCompletedStudents(task).join(', ') || '无' }}</span>
              </div>
              <div class="student-status-row">
                <span class="pending">待审批：{{ getPendingStudents(task).join(', ') || '无' }}</span>
              </div>
            </template>
            <template #right-icon>
              <van-button size="small" type="danger" plain @click="deleteTask(task.id)">删除</van-button>
            </template>
          </van-cell>
          <van-empty v-if="dailyTasks.length === 0" description="暂无每日任务" />
        </van-cell-group>
      </van-tab>
      <van-tab title="每周任务">
        <van-cell-group inset title="每周任务列表">
          <van-cell v-for="task in weeklyTasks" :key="task.id">
            <template #title>
              <van-field v-model="task.title" style="padding: 0;" @blur="updateTask(task)" />
            </template>
            <template #label>
              <div class="task-edit-row">
                <span>类型：</span>
                <van-tag :type="task.frequency === 'daily' ? 'primary' : task.frequency === 'weekly' ? 'success' : 'warning'" 
                         @click="cycleFrequency(task)" size="small" style="cursor:pointer">
                  {{ task.frequency === 'daily' ? '每日' : task.frequency === 'weekly' ? '每周' : '特殊' }}
                </van-tag>
              </div>
              <div class="task-edit-row">
                <span>星级：</span>
                <van-stepper v-model="task.starReward" integer min="1" max="99" @change="updateTask(task)" />
              </div>
              <div class="student-status-row">
                <span class="completed">已完成：{{ getCompletedStudents(task).join(', ') || '无' }}</span>
              </div>
              <div class="student-status-row">
                <span class="pending">待审批：{{ getPendingStudents(task).join(', ') || '无' }}</span>
              </div>
            </template>
            <template #right-icon>
              <van-button size="small" type="danger" plain @click="deleteTask(task.id)">删除</van-button>
            </template>
          </van-cell>
          <van-empty v-if="weeklyTasks.length === 0" description="暂无每周任务" />
        </van-cell-group>
      </van-tab>
      <van-tab title="特殊任务">
        <van-cell-group inset title="特殊任务列表">
          <van-cell v-for="task in specialTasks" :key="task.id">
            <template #title>
              <van-field v-model="task.title" style="padding: 0;" @blur="updateTask(task)" />
            </template>
            <template #label>
              <div class="task-edit-row">
                <span>类型：</span>
                <van-tag :type="task.frequency === 'daily' ? 'primary' : task.frequency === 'weekly' ? 'success' : 'warning'" 
                         @click="cycleFrequency(task)" size="small" style="cursor:pointer">
                  {{ task.frequency === 'daily' ? '每日' : task.frequency === 'weekly' ? '每周' : '特殊' }}
                </van-tag>
              </div>
              <div class="task-edit-row">
                <span>星级：</span>
                <van-stepper v-model="task.starReward" integer min="-99" max="99" @change="updateTask(task)" />
              </div>
              <div class="student-status-row">
                <span class="completed">已完成：{{ getCompletedStudents(task).join(', ') || '无' }}</span>
              </div>
              <div class="student-status-row">
                <span class="pending">待审批：{{ getPendingStudents(task).join(', ') || '无' }}</span>
              </div>
            </template>
            <template #right-icon>
              <van-button size="small" type="danger" plain @click="deleteTask(task.id)">删除</van-button>
            </template>
          </van-cell>
          <van-empty v-if="specialTasks.length === 0" description="暂无特殊任务" />
        </van-cell-group>
      </van-tab>
    </van-tabs>

    <!-- 孩子视图 -->
    <div v-else>
      <van-tabs v-model:active="childTab">
        <van-tab title="每日任务">
          <TaskCard
            v-for="task in dailyTasks"
            :key="task.id"
            :task="task"
            @complete="handleComplete"
          />
          <van-empty v-if="dailyTasks.length === 0" description="今日无每日任务" />
        </van-tab>
        <van-tab title="每周任务">
          <TaskCard
            v-for="task in weeklyTasks"
            :key="task.id"
            :task="task"
            @complete="handleComplete"
          />
          <van-empty v-if="weeklyTasks.length === 0" description="本周无每周任务" />
        </van-tab>
        <van-tab title="特殊任务">
          <TaskCard
            v-for="task in specialTasks"
            :key="task.id"
            :task="task"
            @complete="handleComplete"
          />
          <van-empty v-if="specialTasks.length === 0" description="无特殊任务" />
        </van-tab>
      </van-tabs>
    </div>

    <van-dialog v-model:show="showCreate" title="创建任务" show-cancel-button @confirm="createTask">
      <van-form>
        <van-cell-group inset>
          <van-field v-model="newTask.title" label="任务名称" placeholder="例如：收拾房间" />
          <van-field v-model.number="newTask.starReward" label="星星奖励" type="number" placeholder="输入奖励星星数（负数为惩罚）" />
          <van-field
            v-model="newTask.frequency"
            label="任务类型"
            readonly
            @click="showFrequencyPicker = true"
          />
        </van-cell-group>
      </van-form>
      <van-popup v-model:show="showFrequencyPicker" position="bottom">
        <van-picker
          :columns="frequencyColumns"
          @confirm="onFrequencyConfirm"
          @cancel="showFrequencyPicker = false"
        />
      </van-popup>
    </van-dialog>

    <van-dialog v-model:show="showDeductDialog" title="直接扣分" show-cancel-button @confirm="confirmDeduct">
      <van-form>
        <van-cell-group inset>
          <van-field
            v-model="deductStudent.nickname"
            label="选择学生"
            readonly
            placeholder="点击选择学生"
            @click="showStudentPicker = true"
          />
          <van-field
            v-model.number="deductAmount"
            label="扣分数"
            type="number"
            placeholder="请输入要扣除的星星数"
          />
        </van-cell-group>
      </van-form>
      <van-popup v-model:show="showStudentPicker" position="bottom">
        <van-picker
          :columns="studentColumns"
          @confirm="onStudentConfirm"
          @cancel="showStudentPicker = false"
        />
      </van-popup>
    </van-dialog>

    <!-- 贴纸掉落弹窗 -->
    <van-dialog
      v-model:show="stickerDropDialog.show"
      :show-confirm-button="true"
      confirm-button-text="太棒了！"
      close-on-click-overlay
      class="sticker-drop-dialog"
    >
      <div class="sticker-drop-content">
        <div class="drop-bg">
          <div class="sticker-reveal">
            <span class="sticker-emoji">{{ stickerDropDialog.emoji }}</span>
          </div>
          <div class="drop-title">🎉 恭喜获得新贴纸！</div>
          <div class="sticker-info">
            <span class="sticker-name">{{ stickerDropDialog.name }}</span>
            <span class="sticker-rarity" :style="{ color: stickerDropDialog.rarityColor }">{{ stickerDropDialog.rarity }}</span>
          </div>
          <div class="drop-tip">来自：{{ stickerDropDialog.taskName }}</div>
        </div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getTasks, createTask as createTaskApi, updateTask as updateTaskApi, deleteTask as deleteTaskApi, completeTask, getStudentTaskStatus, getCycleTaskStatus, deductStars } from '@/api/task'
import TaskCard from '@/components/TaskCard.vue'

import { showToast } from 'vant'
import { showConfirmDialog } from 'vant'

const userStore = useUserStore()
const activeTab = ref(0)
const childTab = ref(0)
const tasks = ref([])
const completedTasks = ref([])
const studentTaskStatus = ref([])
const dailyTasks = ref([])
const weeklyTasks = ref([])
const specialTasks = ref([])
const showCreate = ref(false)
const showFrequencyPicker = ref(false)
const newTask = ref({ title: '', starReward: 2, frequency: 'daily' })
const showDeductDialog = ref(false)
const showStudentPicker = ref(false)
const deductStudent = ref({ id: '', nickname: '' })
const deductAmount = ref(0)

const studentColumns = computed(() => {
  const students = [...new Map(studentTaskStatus.value.map(s => [s.user_id, { text: s.user_nickname, value: s.user_id }])).values()]
  return students.length > 0 ? students : [{ text: '无学生', value: '' }]
})

const onStudentConfirm = ({ selectedOptions }) => {
  deductStudent.value.id = selectedOptions[0].value
  deductStudent.value.nickname = selectedOptions[0].text
  showStudentPicker.value = false
}

const openDeductDialog = () => {
  if (studentTaskStatus.value.length === 0) {
    showToast('暂无学生数据，请先加载任务状态')
    return
  }
  deductStudent.value = { id: '', nickname: '' }
  deductAmount.value = 0
  showDeductDialog.value = true
}

const frequencyColumns = [
  { text: '每日任务', value: 'daily' },
  { text: '每周任务', value: 'weekly' },
  { text: '特殊任务（一次性）', value: 'once' }
]

const onFrequencyConfirm = ({ selectedOptions }) => {
  newTask.value.frequency = selectedOptions[0].value
  showFrequencyPicker.value = false
}

const mapTaskFields = (task) => {
  if (!task) return {}
  return {
    ...task,
    starReward: task.star_reward ?? task.starReward ?? 1,
    frequency: task.frequency || 'daily'
  }
}

const loadTasks = async () => {
  try {
    const data = await getTasks()
    
    if (userStore.isAdmin) {
      dailyTasks.value = (data.daily || []).map(mapTaskFields)
      weeklyTasks.value = (data.weekly || []).map(mapTaskFields)
      specialTasks.value = (data.special || []).map(mapTaskFields)
      try {
        const statusData = await getCycleTaskStatus()
        studentTaskStatus.value = statusData || []
      } catch (e) {
        studentTaskStatus.value = []
      }
    } else {
      dailyTasks.value = (data.daily || []).filter(t => !t.action).map(mapTaskFields)
      weeklyTasks.value = (data.weekly || []).filter(t => !t.action).map(mapTaskFields)
      specialTasks.value = (data.special || []).filter(t => !t.action).map(mapTaskFields)
    }
  } catch (error) {
    showToast('加载失败')
  }
}

const createTask = async () => {
  try {
    await createTaskApi(newTask.value)
    showToast('创建成功')
    showCreate.value = false
    newTask.value = { title: '', starReward: 2, frequency: 'daily' }
    await loadTasks()
  } catch (error) {
    showToast('创建失败')
  }
}

const confirmDeduct = async () => {
  if (!deductStudent.value.id || !deductAmount.value) {
    showToast('请输入扣分数')
    return
  }
  try {
    await deductStars({
      studentId: deductStudent.value.id,
      stars: deductAmount.value
    })
    showToast(`已扣除 ${deductStudent.value.nickname} ${deductAmount.value} 星星`)
    deductAmount.value = 0
    deductStudent.value = { id: '', nickname: '' }
  } catch (error) {
    showToast('扣分失败')
  }
}

const updateTask = async (task) => {
  try {
    await updateTaskApi({ id: task.id, title: task.title, star_reward: task.starReward, frequency: task.frequency })
    // 重新加载任务列表以刷新分类
    await loadTasks()
  } catch (error) {
    showToast('更新失败')
  }
}

const cycleFrequency = (task) => {
  const freqOrder = ['daily', 'weekly', 'special']
  const currentIdx = freqOrder.indexOf(task.frequency)
  const nextIdx = (currentIdx + 1) % freqOrder.length
  task.frequency = freqOrder[nextIdx]
  updateTask(task)
}

const deleteTask = async (id) => {
  try {
    await showConfirmDialog({ title: '确认删除', message: '确定要删除该任务吗？' })
    await deleteTaskApi(id)
    showToast('已删除')
    await loadTasks()
  } catch (error) {
    if (error !== 'cancel') showToast('删除失败')
  }
}

const handleComplete = async (task) => {
  try {
    const res = await completeTask(task.id)
    // 显示贴纸掉落弹窗
    showStickerDrop(task, res.data?.sticker)
    await loadTasks()
  } catch (error) {
    showToast(error.message || '操作失败')
  }
}

// 贴纸掉落弹窗
const showStickerDrop = (task, stickerResult) => {
  if (!stickerResult || !stickerResult.awarded) {
    showToast('已提交家长审批')
    return
  }
  // 获取贴纸详情
  const emoji = stickerResult.emoji || '🎁'
  const name = stickerResult.name || '神秘贴纸'
  const rarity = stickerResult.rarity || 'N'
  
  const rarityText = { SSR: 'SSR', SR: 'SR', R: 'R', N: 'N' }[rarity] || 'N'
  const rarityColor = { SSR: '#FFD700', SR: '#9933FF', R: '#1989FA', N: '#999' }[rarity] || '#999'
  
  // 构建弹窗内容
  stickerDropDialog.value = {
    show: true,
    emoji,
    name,
    rarity: rarityText,
    rarityColor,
    taskName: task.title
  }
}

const stickerDropDialog = ref({
  show: false,
  emoji: '🎁',
  name: '',
  rarity: 'N',
  rarityColor: '#999',
  taskName: ''
})

const getCompletedStudents = (task) => {
  return studentTaskStatus.value
    .filter(s => s.task_id === task.id && s.approval_status === 'approved')
    .map(s => s.user_nickname)
}

const getPendingStudents = (task) => {
  return studentTaskStatus.value
    .filter(s => s.task_id === task.id && s.approval_status === 'pending')
    .map(s => s.user_nickname)
}

const formatTime = (time) => {
  if (!time) return ''
  const d = new Date(time)
  return 
}

onMounted(() => {
  loadTasks()
})
</script>

<style scoped>
.task-page {
  padding-bottom: 20px;
}
.deduct-btn {
  margin-bottom: 12px;
  background: linear-gradient(135deg, #ff976a 0%, #ee0a24 100%) !important;
  border: none !important;
}
.add-btn {
  margin-bottom: 12px;
}
.completed-task-card {
  background: #fff;
  border-radius: var(--clay-radius-sm);
  margin: 8px 16px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.task-info h3 {
  margin: 0 0 4px 0;
  font-size: 14px;
}
.reward {
  color: #ff976a;
  font-weight: bold;
  margin: 0;
}
.task-edit-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}
.student-status-row {
  margin-top: 4px;
  font-size: 12px;
}
.student-status-row .completed {
  color: #07c160;
}
.student-status-row .pending {
  color: #ff976a;
}

/* 贴纸掉落弹窗 */
.sticker-drop-content {
  padding: 20px;
  text-align: center;
}
.drop-bg {
  background: linear-gradient(135deg, #FFF0F5 0%, #FFE4EC 50%, #FFF8DC 100%);
  border-radius: var(--clay-radius-md);
  padding: 30px 20px;
  border: 3px solid #FFB6C1;
}
.sticker-reveal {
  width: 100px;
  height: 100px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #fff 0%, #ffe4ec 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 25px rgba(255, 105, 180, 0.35);
  animation: stickerBounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.sticker-emoji {
  font-size: 56px;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15));
}
@keyframes stickerBounce {
  0% { transform: scale(0) rotate(-20deg); }
  50% { transform: scale(1.2) rotate(10deg); }
  100% { transform: scale(1) rotate(0deg); }
}
.drop-title {
  font-size: 22px;
  font-weight: bold;
  color: #FF69B4;
  margin-bottom: 12px;
  text-shadow: 0 2px 4px rgba(255, 105, 180, 0.3);
}
.sticker-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}
.sticker-name {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}
.sticker-rarity {
  font-size: 16px;
  font-weight: 800;
  padding: 2px 10px;
  background: rgba(0,0,0,0.08);
  border-radius: 20px;
}
.drop-tip {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}
</style>
