<template>
  <div class="task-page">
    <van-button v-if="userStore.isAdmin" type="primary" block class="add-btn" @click="showCreate = true">
      创建新任务
    </van-button>

    <!-- 家长视图 -->
    <van-tabs v-if="userStore.isAdmin" v-model:active="activeTab">
      <van-tab title="进行中">
        <TaskCard
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          @complete="handleComplete"
          @skip="handleSkip"
        />
        <van-empty v-if="tasks.length === 0" description="暂无任务" />
      </van-tab>
      <van-tab title="已完成">
        <div
          v-for="task in completedTasks"
          :key="task.id"
          class="completed-task-card"
        >
          <div class="task-info">
            <h3>{{ task.title }}</h3>
            <p class="reward">+{{ task.starReward || task.star_reward }} ★</p>
          </div>
          <van-tag type="success">已完成</van-tag>
        </div>
        <van-empty v-if="completedTasks.length === 0" description="暂无已完成任务" />
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
            @skip="handleSkip"
          />
          <van-empty v-if="dailyTasks.length === 0" description="今日无每日任务" />
        </van-tab>
        <van-tab title="每周任务">
          <TaskCard
            v-for="task in weeklyTasks"
            :key="task.id"
            :task="task"
            @complete="handleComplete"
            @skip="handleSkip"
          />
          <van-empty v-if="weeklyTasks.length === 0" description="本周无每周任务" />
        </van-tab>
        <van-tab title="特殊任务">
          <TaskCard
            v-for="task in specialTasks"
            :key="task.id"
            :task="task"
            @complete="handleComplete"
            @skip="handleSkip"
          />
          <van-empty v-if="specialTasks.length === 0" description="无特殊任务" />
        </van-tab>
      </van-tabs>
    </div>

    <van-dialog v-model:show="showCreate" title="创建任务" show-cancel-button @confirm="createTask">
      <van-form>
        <van-cell-group inset>
          <van-field v-model="newTask.title" label="任务名称" placeholder="例如：收拾房间" />
          <van-field v-model.number="newTask.starReward" label="星星奖励" type="number" placeholder="输入奖励星星数" />
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

    <AttackAnimation ref="attackAnimationRef" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getTasks, createTask as createTaskApi, completeTask, skipTask } from '@/api/task'
import TaskCard from '@/components/TaskCard.vue'
import AttackAnimation from '@/components/AttackAnimation.vue'
import { showToast } from 'vant'

const userStore = useUserStore()
const activeTab = ref(0)
const childTab = ref(0)
const tasks = ref([])
const completedTasks = ref([])
const dailyTasks = ref([])
const weeklyTasks = ref([])
const specialTasks = ref([])
const showCreate = ref(false)
const showFrequencyPicker = ref(false)
const newTask = ref({ title: '', starReward: 2, frequency: 'daily' })
const attackAnimationRef = ref(null)

const frequencyColumns = [
  { text: '每日任务', value: 'daily' },
  { text: '每周任务', value: 'weekly' },
  { text: '特殊任务（一次性）', value: 'once' }
]

const onFrequencyConfirm = ({ selectedOptions }) => {
  newTask.value.frequency = selectedOptions[0].value
  showFrequencyPicker.value = false
}

const loadTasks = async () => {
  try {
    const data = await getTasks()
    
    if (userStore.isAdmin) {
      tasks.value = data.daily || []
      completedTasks.value = []
    } else {
      // 孩子视角：按类型显示任务
      dailyTasks.value = (data.daily || []).filter(t => !t.action)
      weeklyTasks.value = (data.weekly || []).filter(t => !t.action)
      specialTasks.value = (data.special || []).filter(t => !t.action)
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

const handleComplete = async (id) => {
  try {
    await completeTask(id)
    showToast('已完成申请，请等待家长审批')
    await loadTasks()
  } catch (error) {
    showToast(error.message || '操作失败')
  }
}

const handleSkip = async (id) => {
  try {
    await skipTask(id)
    showToast('已跳过')
    await loadTasks()
  } catch (error) {
    showToast(error.message || '操作失败')
  }
}

onMounted(() => {
  loadTasks()
})
</script>

<style scoped>
.task-page {
  padding-bottom: 20px;
}
.add-btn {
  margin-bottom: 12px;
}
.completed-task-card {
  background: #fff;
  border-radius: 12px;
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
</style>
