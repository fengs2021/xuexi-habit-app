<template>
  <div class="study-page">
    <!-- 头部 -->
    <div class="study-header">
      <div class="header-title">📚 学习记录</div>
      <van-button
        v-if="userStore.isAdmin"
        size="small"
        type="primary"
        @click="$router.push('/study/add')"
      >
        添加记录
      </van-button>
    </div>

    <!-- 科目筛选 -->
    <div class="subject-filter" v-if="subjects.length > 0">
      <van-tabs v-model:active="activeSubject" shrink @change="onSubjectChange">
        <van-tab title="全部" name="" />
        <van-tab
          v-for="s in subjects"
          :key="s.id"
          :title="s.icon + ' ' + s.name"
          :name="s.id"
        />
      </van-tabs>
    </div>

    <!-- 学习记录列表 -->
    <div class="record-list" v-if="records.length > 0">
      <div
        v-for="record in records"
        :key="record.id"
        class="record-card"
        @click="goDetail(record)"
      >
        <div class="record-header">
          <span class="subject-tag" :style="{ background: record.subject_color || '#4A90D9' }">
            {{ record.subject_icon || '📚' }} {{ record.subject_name }}
          </span>
          <span class="record-date">{{ formatDate(record.record_date) }}</span>
        </div>
        <div class="record-content" v-if="record.notes">
          {{ record.notes }}
        </div>
        <div class="record-footer">
          <van-tag v-if="record.question_count > 0" type="success">
            {{ record.question_count }} 题
          </van-tag>
          <van-tag v-else type="warning">待录入</van-tag>
          <span class="record-status" :class="record.status">
            {{ record.status === 'approved' ? '✓ 已审核' : '⏳ 待审核' }}
          </span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <van-empty v-else description="暂无学习记录" image="search">
      <van-button
        v-if="userStore.isAdmin"
        type="primary"
        size="small"
        @click="$router.push('/study/add')"
      >
        添加第一条记录
      </van-button>
    </van-empty>

    <!-- 底部学习入口 -->
    <div class="study-quick-nav">
      <van-grid :column-num="3" square clickable>
        <van-grid-item text="题库" icon="question-o" @click="$router.push('/study/questions')" />
        <van-grid-item text="错题本" icon="fail" @click="$router.push('/study/wrong')" />
        <van-grid-item
          v-if="userStore.isChild"
          text="练习"
          icon="edit"
          @click="$router.push('/study/practice')"
        />
        <van-grid-item
          v-if="userStore.isAdmin"
          text="科目管理"
          icon="setting-o"
          @click="$router.push('/study/subjects')"
        />
      </van-grid>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { getSubjects, getRecords } from '@/api/study'
import { showToast } from 'vant'

const router = useRouter()
const userStore = useUserStore()

const subjects = ref([])
const records = ref([])
const activeSubject = ref('')

const loadSubjects = async () => {
  try {
    const res = await getSubjects()
    subjects.value = res || []
  } catch (e) {
    console.error('加载科目失败:', e)
  }
}

const loadRecords = async () => {
  try {
    const params = {}
    if (activeSubject.value) {
      params.subject_id = activeSubject.value
    }
    const res = await getRecords(params)
    records.value = res || []
  } catch (e) {
    console.error('加载学习记录失败:', e)
  }
}

const onSubjectChange = () => {
  loadRecords()
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

const goDetail = (record) => {
  router.push(`/study/record/${record.id}`)
}

onMounted(() => {
  loadSubjects()
  loadRecords()
})
</script>

<style scoped>
.study-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 60px;
}

.study-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
}

.header-title {
  font-size: 20px;
  font-weight: bold;
}

.subject-filter {
  background: white;
  margin-bottom: 8px;
}

.record-list {
  padding: 12px;
}

.record-card {
  background: white;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.subject-tag {
  padding: 4px 10px;
  border-radius: 20px;
  color: white;
  font-size: 13px;
}

.record-date {
  color: #999;
  font-size: 13px;
}

.record-content {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.4;
}

.record-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-status {
  font-size: 12px;
}

.record-status.approved {
  color: #07c160;
}

.record-status.draft {
  color: #ff976a;
}

.study-quick-nav {
  position: fixed;
  bottom: 50px;
  left: 0;
  right: 0;
  background: white;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}
</style>
