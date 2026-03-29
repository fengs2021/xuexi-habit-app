<template>
  <div class="practice-page">
    <van-nav-bar title="🎯 练习" left-text="退出" @click-left="exitPractice" />

    <!-- 模式选择 -->
    <div class="mode-select" v-if="!practiceStarted">
      <div class="mode-header">开始练习</div>

      <van-cell-group inset>
        <van-cell title="科目" is-link :value="selectedSubjectName" @click="showPicker = true" />
      </van-cell-group>

      <van-popup v-model:show="showPicker" position="bottom">
        <van-picker
          :columns="subjectColumns"
          @confirm="onSubjectConfirm"
          @cancel="showPicker = false"
        />
      </van-popup>

      <van-radio-group v-model="practiceMode">
        <van-cell-group inset style="margin-top: 12px">
          <van-cell title="全部题库" clickable @click="practiceMode = 'all'">
            <template #right-icon>
              <van-radio name="all" />
            </template>
          </van-cell>
          <van-cell title="错题本" clickable @click="practiceMode = 'wrong'">
            <template #right-icon>
              <van-radio name="wrong" />
            </template>
          </van-cell>
        </van-cell-group>
      </van-radio-group>

      <div class="count-input">
        <van-field v-model.number="questionCount" type="number" label="题目数量" placeholder="每次练习题数" />
      </div>

      <van-button type="primary" block class="start-btn" @click="beginPractice">
        开始练习
      </van-button>
    </div>

    <!-- 练习中 -->
    <div class="practice-area" v-else-if="!showResult">
      <div class="progress-info">
        <span>第 {{ currentIndex + 1 }} / {{ questions.length }} 题</span>
        <van-progress :percentage="((currentIndex + 1) / questions.length * 100)" :show-pivot="false" />
      </div>

      <div class="question-card" v-if="currentQuestion">
        <div class="q-type">
          <van-tag type="primary" size="medium">{{ getTypeName(currentQuestion.question_type) }}</van-tag>
        </div>
        <div class="q-content">{{ currentQuestion.content }}</div>

        <!-- 选择题 -->
        <div class="options" v-if="currentQuestion.question_type === 'choice'">
          <div
            v-for="opt in currentQuestion.options"
            :key="opt.label"
            class="option-item"
            :class="{ selected: answers[currentQuestion.id] === opt.label }"
            @click="selectAnswer(opt.label)"
          >
            <span class="opt-label">{{ opt.label }}.</span>
            <span>{{ opt.text }}</span>
          </div>
        </div>

        <!-- 判断题 -->
        <div class="tf-buttons" v-else-if="currentQuestion.question_type === 'truefalse'">
          <van-button size="large" @click="selectAnswer('正确')">✓ 正确</van-button>
          <van-button size="large" @click="selectAnswer('错误')">✗ 错误</van-button>
        </div>

        <!-- 其他题型 -->
        <div class="text-input" v-else>
          <van-field v-model="textAnswer" placeholder="输入答案" @keyup.enter="handleEnter" />
        </div>
      </div>

      <div class="action-area">
        <van-button
          v-if="currentIndex < questions.length - 1"
          type="primary"
          block
          :disabled="!canNext"
          @click="nextQuestion"
        >
          下一题
        </van-button>
        <van-button
          v-else
          type="success"
          block
          :disabled="!allAnswered"
          @click="submitPractice"
        >
          提交练习
        </van-button>
      </div>
    </div>

    <!-- 结果页 -->
    <div class="result-page" v-if="showResult">
      <div class="score-display">
        <div class="score-num">{{ result.score }}</div>
        <div class="score-label">分</div>
      </div>

      <van-cell-group inset>
        <van-cell title="正确率" :value="result.score + '%'" />
        <van-cell title="答对" :value="result.correct + ' / ' + result.total + ' 题'" />
        <van-cell v-if="result.new_wrong_count > 0" title="新错题" :value="result.new_wrong_count + ' 题'" />
      </van-cell-group>

      <div class="result-tip" v-if="result.new_wrong_count > 0">
        ⚠️ {{ result.new_wrong_count }} 道新错题已收入错题本
      </div>

      <van-button type="primary" block @click="exitPractice" style="margin-top: 20px">
        完成
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getSubjects, startPractice as startPracticeApi, submitPractice as submitPracticeApi } from '@/api/study'

const router = useRouter()

const showPicker = ref(false)
const subjects = ref([])
const selectedSubject = ref('')
const practiceMode = ref('all')
const questionCount = ref(10)
const practiceStarted = ref(false)
const questions = ref([])
const currentIndex = ref(0)
const answers = ref({})
const textAnswer = ref('')
const showResult = ref(false)
const result = ref({})

const currentQuestion = computed(() => questions.value[currentIndex.value])
const allAnswered = computed(() =>
  questions.value.every(q => answers.value[q.id] !== undefined && answers.value[q.id] !== '')
)
const canNext = computed(() =>
  answers.value[currentQuestion.value?.id] !== undefined && answers.value[currentQuestion.value?.id] !== '')
const selectedSubjectName = computed(() => {
  const s = subjects.value.find(x => x.id === selectedSubject.value)
  return s ? s.icon + ' ' + s.name : '请选择'
})
const subjectColumns = computed(() =>
  subjects.value.map(s => ({ text: s.icon + ' ' + s.name, value: s.id }))
)

const getTypeName = (type) => {
  const map = { choice: '选择题', truefalse: '判断题', fill: '填空题', application: '应用题', blank: '简答题' }
  return map[type] || '题目'
}

const loadSubjects = async () => {
  try {
    const res = await getSubjects()
    subjects.value = res || []
    if (subjects.value.length > 0) {
      selectedSubject.value = subjects.value[0].id
    }
  } catch (e) {
    console.error('加载科目失败:', e)
  }
}

const onSubjectConfirm = ({ selectedOptions }) => {
  selectedSubject.value = selectedOptions[0].value
  showPicker.value = false
}

const selectAnswer = (label) => {
  answers.value[currentQuestion.value.id] = label
}

const handleEnter = () => {
  if (textAnswer.value.trim()) {
    answers.value[currentQuestion.value.id] = textAnswer.value.trim()
  }
}

const nextQuestion = () => {
  if (currentQuestion.value.question_type !== 'choice' && currentQuestion.value.question_type !== 'truefalse') {
    if (textAnswer.value.trim()) {
      answers.value[currentQuestion.value.id] = textAnswer.value.trim()
    }
    textAnswer.value = ''
  }
  currentIndex.value++
}

const beginPractice = async () => {
  if (!selectedSubject.value) {
    showToast('请选择科目')
    return
  }
  try {
    const res = await startPracticeApi({
      subject_id: selectedSubject.value,
      mode: practiceMode.value,
      count: questionCount.value
    })
    if (!res || res.questions.length === 0) {
      showToast('暂无可练习的题目')
      return
    }
    questions.value = res.questions
    currentIndex.value = 0
    answers.value = {}
    textAnswer.value = ''
    practiceStarted.value = true
    showResult.value = false
  } catch (e) {
    showToast('获取题目失败')
    console.error(e)
  }
}

const submitPractice = async () => {
  if (currentQuestion.value.question_type !== 'choice' && currentQuestion.value.question_type !== 'truefalse') {
    if (textAnswer.value.trim()) {
      answers.value[currentQuestion.value.id] = textAnswer.value.trim()
    }
  }
  try {
    const res = await submitPracticeApi({
      subject_id: selectedSubject.value,
      mode: practiceMode.value,
      questions: questions.value,
      answers: answers.value
    })
    result.value = res || {}
    showResult.value = true
  } catch (e) {
    showToast('提交失败')
    console.error(e)
  }
}

const exitPractice = () => {
  router.push('/study')
}

onMounted(() => {
  loadSubjects()
})
</script>

<style scoped>
.practice-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20px;
}

.mode-select {
  padding: 16px;
}

.mode-header {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 16px;
}

.count-input {
  margin-top: 12px;
}

.start-btn {
  margin-top: 20px;
}

.progress-info {
  padding: 16px;
  background: white;
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
}

.progress-info span {
  display: block;
  margin-bottom: 8px;
}

.question-card {
  background: white;
  margin: 0 16px 16px;
  padding: 20px;
  border-radius: 12px;
}

.q-type {
  margin-bottom: 12px;
}

.q-content {
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 16px;
}

.option-item {
  padding: 12px 16px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.option-item.selected {
  border-color: #1989fa;
  background: #e6f4ff;
}

.opt-label {
  font-weight: bold;
  margin-right: 8px;
}

.tf-buttons {
  display: flex;
  gap: 12px;
}

.text-input {
  margin-top: 8px;
}

.action-area {
  padding: 0 16px;
}

.result-page {
  padding: 30px 16px;
  text-align: center;
}

.score-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-bottom: 30px;
}

.score-num {
  font-size: 72px;
  font-weight: bold;
  color: #667eea;
}

.score-label {
  font-size: 24px;
  color: #667eea;
  margin-left: 4px;
}

.result-tip {
  margin-top: 16px;
  padding: 12px;
  background: #fff3e0;
  border-radius: 8px;
  color: #ff976a;
  font-size: 14px;
}
</style>
