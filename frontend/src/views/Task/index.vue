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
      <van-cell-group inset title="今日任务">
        <TaskCard
          v-for="task in todayTasks"
          :key="task.id"
          :task="task"
          @complete="handleComplete"
          @skip="handleSkip"
        />
        <van-empty v-if="todayTasks.length === 0" description="今天没有任务" />
      </van-cell-group>

      <van-cell-group inset title="已完成任务" class="completed-section">
        <div
          v-for="task in completedTasks"
          :key="task.id"
          class="completed-task-card"
          @touchstart="onTouchStart($event, task)"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
          :class="{ 'attacking': attackingTaskId === task.id }"
        >
          <div class="task-info">
            <h3>{{ task.title }}</h3>
            <p class="reward">+{{ task.starReward || task.star_reward }} ★</p>
          </div>
          <div class="attack-hint">
            <van-icon name="arrow-up" /> 上滑攻击
          </div>
        </div>
        <van-empty v-if="completedTasks.length === 0" description="暂无已完成任务" />
      </van-cell-group>
    </div>

    <van-dialog v-model:show="showCreate" title="创建任务" show-cancel-button @confirm="createTask">
      <van-form>
        <van-cell-group inset>
          <van-field v-model="newTask.title" label="任务名称" placeholder="例如：收拾房间" />
          <van-field v-model.number="newTask.starReward" label="星星奖励" type="number" placeholder="输入奖励星星数" />
        </van-cell-group>
      </van-form>
    </van-dialog>

    <AttackAnimation ref="attackAnimationRef" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getTasks, createTask as createTaskApi, completeTask, skipTask } from '@/api/task'
import TaskCard from '@/components/TaskCard.vue'
import AttackAnimation from '@/components/AttackAnimation.vue'
import { showToast } from 'vant'

const userStore = useUserStore()
const activeTab = ref(0)
const tasks = ref([])
const completedTasks = ref([])
const todayTasks = ref([])
const showCreate = ref(false)
const newTask = ref({ title: '', starReward: 2 })
const attackAnimationRef = ref(null)
const attackingTaskId = ref(null)

let startY = 0
let currentY = 0

const loadTasks = async () => {
  try {
    const data = await getTasks()
    if (userStore.isAdmin) {
      tasks.value = (data?.tasks || []).filter(t => !t.completed)
      completedTasks.value = (data?.tasks || []).filter(t => t.completed)
    } else {
      todayTasks.value = (data?.todayTasks || data || []).filter(t => !t.completed)
      completedTasks.value = data?.completedTasks || []
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
    newTask.value = { title: '', starReward: 2 }
    await loadTasks()
  } catch (error) {
    showToast('创建失败')
  }
}

const handleComplete = async (id) => {
  try {
    await completeTask(id)
    showToast('任务完成！')
    await loadTasks()
    await userStore.getUserInfoAction()
  } catch (error) {
    showToast('操作失败')
  }
}

const handleSkip = async (id) => {
  try {
    await skipTask(id)
    showToast('已跳过')
    await loadTasks()
  } catch (error) {
    showToast('操作失败')
  }
}

const onTouchStart = (e, task) => {
  startY = e.touches[0].clientY
  attackingTaskId.value = task.id
}

const onTouchMove = (e) => {
  currentY = e.touches[0].clientY
}

const onTouchEnd = () => {
  const delta = startY - currentY
  if (delta > 50) {
    showToast('上滑攻击！+星星奖励')
    attackAnimationRef.value?.show()
    setTimeout(() => {
      attackingTaskId.value = null
    }, 300)
  } else {
    attackingTaskId.value = null
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
.completed-section {
  margin-top: 20px;
}
.completed-task-card {
  background: #fff;
  border-radius: 12px;
  margin: 8px 16px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: transform 0.2s, opacity 0.2s;
}
.completed-task-card.attacking {
  transform: translateY(-20px);
  opacity: 0;
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
.attack-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ff976a;
  font-size: 12px;
}
</style>
