<template>
  <div class="questions-page">
    <van-nav-bar title="📚 我的题库" />

    <!-- 筛选 -->
    <div class="filter-bar">
      <van-dropdown-menu>
        <van-dropdown-item v-model="filters.subjectId" :options="subjectOptions" @change="loadQuestions" />
        <van-dropdown-item v-model="filters.type" :options="typeOptions" @change="loadQuestions" />
      </van-dropdown-menu>
      <van-search v-model="filters.search" placeholder="搜索题目" @search="loadQuestions" />
    </div>

    <!-- 题目列表 -->
    <div class="question-list" v-if="questions.length > 0">
      <div
        v-for="q in questions"
        :key="q.id"
        class="question-card"
        @click="showDetail(q)"
      >
        <div class="q-header">
          <van-tag :type="getTypeColor(q.question_type)">{{ getTypeName(q.question_type) }}</van-tag>
          <span class="subject-tag">{{ q.subject_icon }} {{ q.subject_name }}</span>
        </div>
        <div class="q-content">{{ q.content }}</div>
        <div class="q-meta">
          <span>正确 {{ q.times_correct }}/{{ q.times_asked }}</span>
        </div>
      </div>
    </div>

    <van-empty v-else description="题库为空，添加学习记录后可自动入库" />

    <!-- 底部练习入口 -->
    <div class="practice-bar" v-if="questions.length > 0">
      <van-button type="primary" block @click="$router.push('/study/practice')">
        🎯 开始练习
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { showToast } from 'vant'
import { getQuestions, getSubjects } from '@/api/study'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const questions = ref([])
const subjects = ref([])
const filters = ref({ subjectId: '', type: '', search: '' })

const subjectOptions = computed(() => [
  { text: '全部科目', value: '' },
  ...subjects.value.map(s => ({ text: s.icon + ' ' + s.name, value: s.id }))
])

const typeOptions = [
  { text: '全部类型', value: '' },
  { text: '选择题', value: 'choice' },
  { text: '判断题', value: 'truefalse' },
  { text: '填空题', value: 'fill' },
  { text: '应用题', value: 'application' }
]

const getTypeName = (type) => {
  const map = { choice: '选择', truefalse: '判断', fill: '填空', application: '应用', blank: '简答' }
  return map[type] || type
}

const getTypeColor = (type) => {
  const map = { choice: 'primary', truefalse: 'success', fill: 'warning', application: 'danger' }
  return map[type] || 'default'
}

const loadQuestions = async () => {
  try {
    const params = {}
    if (filters.value.subjectId) params.subject_id = filters.value.subjectId
    if (filters.value.type) params.question_type = filters.value.type
    if (filters.value.search) params.search = filters.value.search
    const res = await getQuestions(params)
    questions.value = res.data?.questions || []
  } catch (e) {
    showToast('加载失败')
  }
}

const loadSubjects = async () => {
  try {
    const res = await getSubjects()
    subjects.value = res.data || []
  } catch (e) {}
}

const showDetail = (q) => {
  // 简单用 Dialog 展示
  import('vant').then(({ Dialog }) => {
    Dialog.alert({
      title: '第' + q.question_no + '题 ' + getTypeName(q.question_type),
      message: q.content + '\n\n正确答案: ' + q.correct_answer
    })
  })
}

onMounted(() => {
  loadSubjects()
  loadQuestions()
})
</script>

<style scoped>
.questions-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 70px;
}

.filter-bar {
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.question-list {
  padding: 12px;
}

.question-card {
  background: white;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
}

.q-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.subject-tag {
  font-size: 12px;
  color: #999;
}

.q-content {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 8px;
}

.q-meta {
  font-size: 12px;
  color: #999;
}

.practice-bar {
  position: fixed;
  bottom: 60px;
  left: 16px;
  right: 16px;
}
</style>
